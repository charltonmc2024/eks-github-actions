# Implementation Plan: 03-backend

## Overview

This plan builds a NEW reusable backend module at `ecs-terraform/modules/backend/` and wires it into the
existing deployment root at `ecs-terraform/envs/dev/`, alongside the already-implemented `module.network`
and `module.data`. The backend owns the application runtime and edge entry point: one ECR repository, an
internal ALB with an IP target group, the CloudFront VPC Origin, an ECS Fargate cluster/task/service, two
IAM roles, a CloudWatch log group, minimal autoscaling, and backend-owned ALB/ECS security groups. It
creates no VPC, no DynamoDB table, and no CloudFront distribution.

The module directory contains exactly ten `.tf` files: `ecr.tf`, `alb.tf`, `vpc-origin.tf`, `ecs.tf`,
`iam.tf`, `secrets.tf`, `autoscaling.tf`, `logs.tf`, `variables.tf`, `outputs.tf`. The `terraform {}`
version block and `locals { name_prefix }` block live at the top of `ecs.tf` (no separate
`versions.tf`/`locals.tf`), matching the 02-data pattern.

Build order is bottom-up: variables and version/locals first; then the independent leaf resources (ECR,
log group, IAM roles); then the ALB with its security groups; then the ECS task/service that ties image +
logs + roles + target group together; then the VPC Origin over the ALB; then autoscaling and secrets; then
the minimized module outputs. The dev root is wired last, then the whole thing is formatted, validated, and
plan-verified against the design invariants (Properties 1-23). This plan does NOT run `terraform apply`.

This is a clean-slate creation: `terraform plan` against a fresh state shows only creations (N to add, 0 to
change, 0 to destroy). There are NO `moved` blocks and NO state migration.

Edge connections (viewer HTTPS, HTTP origin): Viewer->CloudFront is HTTPS on the default `*.cloudfront.net`
DEV domain using the CloudFront default viewer certificate (no custom alias, no viewer ACM cert in DEV).
CloudFront VPC Origin->internal ALB is HTTP on `var.alb_listener_port` (default 80) over the private VPC
Origin path. ALB->ECS remains HTTP on the application/container port. DEV uses no ACM certificate for the
ALB, no `alb_listener_certificate_arn`, and no `origin_domain_name`; 03-backend creates no ACM/Route 53
resources and holds no reference to 04-edge. 04-edge later consumes `module.backend.vpc_origin_id` and sets
the distribution origin domain to the backend-exposed ALB DNS name.

The module output surface is deliberately minimal (terraform.md steering): only `ecr_repository_url`,
`alb_dns_name`, `vpc_origin_id`, `ecs_cluster_name`, and `ecs_service_name` are exposed, because each has a
concrete downstream consumer. `alb_arn`, `vpc_origin_arn`, `alb_security_group_id`, and
`ecs_security_group_id` are intentionally NOT exposed.

**Cross-module dependency (see Requirement 11) — RESOLVED at the configuration/design level:** private
ECS Fargate tasks reach ECR, CloudWatch Logs, and Secrets Manager/STS through the egress the 01-network DEV
configuration now provides (`enable_nat_gateway = true`, `enable_vpc_endpoints = true`): one NAT Gateway
for general outbound traffic plus S3 and DynamoDB Gateway endpoints for that same-Region traffic. No VPC
interface endpoints and no endpoint security group are used. The backend adds no network resources; it
consumes what 01-network provides. `fmt`/`validate`/`plan` do not test connectivity, so actual AWS runtime
connectivity (image pull, log delivery) is NOT yet verified and will be confirmed only when the
infrastructure is planned/applied/tested.

This is Terraform IaC; property-based testing does not apply. Verification uses `terraform fmt`/`validate`/
`plan` and plan-JSON invariant assertions. Applying to shared dev infrastructure is gated on operator
confirmation — this plan does NOT auto-apply.

## Tasks

- [ ] 1. Build module foundation (variables, version pin, locals)
  - [ ] 1.1 Create `modules/backend/variables.tf` with all typed, described, validated inputs
    - Declare `app_name`, `environment` (string, non-empty validation)
    - Declare `tags` (map(string), `default = {}`)
    - Declare `vpc_id` (string) and `private_subnet_ids` (list(string), validation length >= 2)
    - Declare `dynamodb_table_name`, `dynamodb_table_arn` (string)
    - Declare `container_port` (number, default 3000, validation 1-65535) and `health_check_path` (string, default "/")
    - Declare `image_tag` (string), `task_cpu` (number, default 256), `task_memory` (number, default 512), `desired_count` (number, default 1)
    - Declare `min_capacity` (default 1), `max_capacity` (default 2), `cpu_target` (default 60), `log_retention_days` (default 14)
    - Declare `image_tag_mutability` (string, default "MUTABLE"), `alb_listener_port` (number, default 80)
    - Do NOT declare `alb_listener_certificate_arn` or `origin_domain_name` or any TLS/certificate input (the DEV ALB listener is HTTP)
    - Declare `app_secret_arn` (string, default null, `sensitive = true`) — preserve as optional/null
    - 03-backend creates NO ACM certificate, certificate validation, hosted zone, or DNS record; declare no `aws_region`; no hardcoded account IDs/ARNs/region/subnet IDs in defaults
    - _Requirements: 14.1, 14.2, 14.3, 13.3, 13.5, 2.8, 12.1_

  - [ ] 1.2 Add the `terraform {}` version block and `locals { name_prefix }` at the top of `modules/backend/ecs.tf`
    - `required_version = "~> 1.16.0"`; AWS provider `~> 6.62`; comment why it lives in ecs.tf (no versions.tf)
    - `name_prefix = "${var.app_name}-${var.environment}"`; comment why it lives here (no locals.tf)
    - No major version increment
    - _Requirements: 13.1, 15.3_

- [ ] 2. Implement ECR repository (`ecr.tf`)
  - [ ] 2.1 Create `modules/backend/ecr.tf`
    - `aws_ecr_repository` named `${local.name_prefix}-app`, `image_scanning_configuration { scan_on_push = true }`, `image_tag_mutability = var.image_tag_mutability`
    - `aws_ecr_lifecycle_policy` expiring untagged and superseded images (cost-conscious DEV retention)
    - Common tags; exactly one repository; no hardcoded account ID/ARN/registry URL
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 13.2, 13.5_

- [ ] 3. Implement CloudWatch application logging (`logs.tf`)
  - [ ] 3.1 Create `modules/backend/logs.tf`
    - `aws_cloudwatch_log_group` named `${local.name_prefix}-app` with `retention_in_days = var.log_retention_days` (no unlimited retention)
    - Common tags; create no S3 ALB access-log bucket
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 13.2_

- [ ] 4. Implement IAM roles and least-privilege policies (`iam.tf`)
  - [ ] 4.1 Create the ECS execution role
    - `aws_iam_role` trusting `ecs-tasks.amazonaws.com`; attach `AmazonECSTaskExecutionRolePolicy`; no `AdministratorAccess`
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ] 4.2 Create the ECS application task role with scoped DynamoDB access
    - `aws_iam_role` trusting `ecs-tasks.amazonaws.com`
    - Inline/managed policy granting exactly the five actions `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:Query`, and `dynamodb:TransactWriteItems`
    - `dynamodb:TransactWriteItems` is required by the approved answer-submission hot path, which atomically writes the response, conditionally updates the ability estimate, and updates the seen set in one transaction (a distinct IAM action not implied by `PutItem`/`UpdateItem`)
    - Resource scope exactly `${var.dynamodb_table_arn}` and `${var.dynamodb_table_arn}/index/*`; the table ARN covers base-table operations including `TransactWriteItems` (transaction writes base-table items), and `/index/*` is required for `Query` against GSI1/GSI2; no `Resource: "*"`
    - Do NOT grant `dynamodb:Scan`, `dynamodb:DeleteItem`, `dynamodb:BatchGetItem`, `dynamodb:BatchWriteItem`, `dynamodb:*`, or any table-management/admin action
    - No IAM user, no long-lived keys, no embedded credentials
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.3, 6.4, 6.5_

- [ ] 5. Implement the internal ALB, security groups, target group, and listener (`alb.tf`)
  - [ ] 5.1 Create the ALB and ECS security groups
    - `aws_security_group` ALB_SG in `var.vpc_id`: ingress from the AWS-managed CloudFront origin-facing prefix list on `var.alb_listener_port` (default 80), no `0.0.0.0/0`; egress to reach ECS tasks. Reference `var.alb_listener_port` for the rule port — do not independently hardcode the port
    - `aws_security_group` ECS_SG in `var.vpc_id`: ingress only SG-to-SG from ALB_SG on `var.container_port` (preserve the existing ALB -> ECS relationship; ALB -> ECS remains HTTP on the container port); egress open for private egress
    - Use standalone `aws_vpc_security_group_ingress_rule`/`egress_rule` resources; common tags
    - _Requirements: 2.3, 3.3, 10.2, 10.3, 13.2_

  - [ ] 5.2 Create the internal ALB and IP target group
    - `aws_lb` type `application`, `internal = true`, subnets `var.private_subnet_ids`, ALB_SG attached; ALB access logs disabled
    - `aws_lb_target_group` `target_type = "ip"`, health check on `var.health_check_path` and the traffic port; stickiness disabled
    - _Requirements: 2.1, 2.2, 2.4, 2.6, 2.7, 8.3, 10.4_

  - [ ] 5.3 Create the HTTP listener
    - `aws_lb_listener` with `port = var.alb_listener_port` (default 80), `protocol = "HTTP"`; default action forwards to the existing target group
    - No `ssl_policy`, no `certificate_arn`, no ACM certificate; create NO `aws_acm_certificate`, `aws_acm_certificate_validation`, `aws_route53_zone`, or `aws_route53_record`; hold no reference to 04-edge
    - _Requirements: 2.5, 2.8, 12.1, 12.2, 12.5_

- [ ] 6. Implement the ECS cluster, task definition, and service (`ecs.tf`)
  - [ ] 6.1 Create the ECS cluster and task definition
    - `aws_ecs_cluster` named `${local.name_prefix}-cluster`
    - `aws_ecs_task_definition` `requires_compatibilities = ["FARGATE"]`, `network_mode = "awsvpc"`, `cpu = var.task_cpu`, `memory = var.task_memory`
    - `execution_role_arn`/`task_role_arn` from the IAM roles; container image `${ecr_url}:${var.image_tag}` (immutable tag, not `latest` only)
    - Port mapping on `var.container_port`; `awslogs` driver -> App_Log_Group; secrets block only when `var.app_secret_arn != null`
    - No persistent volume/state (stateless)
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 3.8, 8.1_

  - [ ] 6.2 Create the ECS service registered with the target group
    - `aws_ecs_service` FARGATE, `network_configuration` subnets `var.private_subnet_ids`, ECS_SG, `assign_public_ip = false`
    - `load_balancer` block: target group ARN, container name, `var.container_port`
    - `desired_count = var.desired_count`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.4_

- [ ] 7. Implement the CloudFront VPC Origin (`vpc-origin.tf`)
  - [ ] 7.1 Create `modules/backend/vpc-origin.tf`
    - `aws_cloudfront_vpc_origin` targeting the internal ALB (reference `aws_lb.app.arn` directly within the module), `vpc_origin_endpoint_config` with `origin_protocol_policy = "http-only"` and `http_port = var.alb_listener_port`, matching the HTTP ALB listener; no `https-only`, no `https_port` requirement, no `origin_ssl_protocols`
    - Create NO `aws_cloudfront_distribution`/cache policy/origin-request policy; reference no 04-edge output
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 12.2, 12.4_

- [ ] 8. Implement ECS autoscaling (`autoscaling.tf`)
  - [ ] 8.1 Create `modules/backend/autoscaling.tf`
    - `aws_appautoscaling_target` on the ECS service, `min_capacity = var.min_capacity`, `max_capacity = var.max_capacity`
    - One target-tracking `aws_appautoscaling_policy` on average CPU at `var.cpu_target`; no extra policies; cost-conscious, no over-provisioning
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 9. Implement secrets documentation and conditional wiring (`secrets.tf`)
  - [ ] 9.1 Create `modules/backend/secrets.tf`
    - Documentation of the secrets policy; conditional wiring gated on `var.app_secret_arn` (default null -> zero secret resources in DEV)
    - When an ARN is supplied: scoped Execution_Role read access to exactly that ARN and a task-definition `secrets` reference
    - No secret value in source/tfvars/Dockerfile/Jenkinsfile; secret-bearing variable `sensitive = true`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 10. Implement module outputs (`outputs.tf`)
  - [ ] 10.1 Create `modules/backend/outputs.tf`
    - Expose ONLY `ecr_repository_url`, `alb_dns_name`, `vpc_origin_id`, `ecs_cluster_name`, `ecs_service_name`
    - Do NOT expose `alb_arn`, `vpc_origin_arn`, `alb_security_group_id`, or `ecs_security_group_id`
    - Each with a non-empty description; expose no secret values
    - _Requirements: 4.3, 12.4, 14.4_

- [ ] 11. Checkpoint - module self-contained
  - Confirm `modules/backend` parses on its own with exactly the ten `.tf` files, no `provider`/`backend` block, no network/data/edge resource creation, no ACM/Route 53 resources and no TLS/certificate input (the ALB listener is HTTP), the minimized output set, and no undefined references. Ask the user if questions arise.

- [ ] 12. Wire the module into the dev root
  - [ ] 12.1 Add dev-root variables and tfvars for the backend
    - Add `container_port`, `health_check_path`, `image_tag`, and any overridden sizing to `envs/dev/variables.tf` (typed, described) and `envs/dev/terraform.tfvars` (no secrets)
    - Do NOT declare `alb_listener_certificate_arn` or `origin_domain_name`; the DEV ALB listener is HTTP and needs no origin certificate, and there is no DNS/certificate-foundation wiring
    - _Requirements: 14.1, 14.5_

  - [ ] 12.2 Add the `module "backend"` block to `envs/dev/main.tf`
    - `source = "../../modules/backend"`; pass `vpc_id = module.network.vpc_id`, `private_subnet_ids = module.network.private_subnet_ids`, `dynamodb_table_name = module.data.dynamodb_table_name`, `dynamodb_table_arn = module.data.dynamodb_table_arn` (from module outputs, not literals)
    - Pass `app_name`, `environment`, the common `tags` map, `container_port`, `health_check_path`, `image_tag`
    - Do NOT pass `alb_listener_certificate_arn` or `origin_domain_name` to `module "backend"` — the DEV ALB listener is HTTP and there is no origin certificate/DNS foundation
    - Preserve the existing `module "network"` and `module "data"` blocks
    - _Requirements: 14.5, 10.1, 12.5_

  - [ ] 12.3 Re-export backend outputs in `envs/dev/outputs.tf`
    - Re-export `ecr_repository_url`, `alb_dns_name`, `vpc_origin_id`, `ecs_cluster_name`, `ecs_service_name` for CI/CD and 04-edge; keep existing network/data outputs
    - _Requirements: 4.3, 14.4_

- [ ] 13. Format and validate
  - [ ] 13.1 Run `terraform fmt -check -recursive` over `modules/backend` and `envs/dev` (zero diff)
    - _Requirements: 15.1_
  - [ ] 13.2 Init and validate the dev root
    - `terraform init`, then `terraform validate` reports 0 errors related to the backend module
    - _Requirements: 15.2_

- [ ] 14. Plan verification (no apply)
  - [ ] 14.1 Generate the plan JSON
    - `terraform plan -out=tfplan` then `terraform show -json tfplan > plan.json`
    - _Requirements: 15.5_

  - [ ] 14.2 Assert the ECR/ALB/target/listener invariants (Properties 1-5, 8, 9)
    - Exactly one `aws_ecr_repository`; ALB `internal == true` in the approved private subnets; target group `target_type == "ip"`; target-group stickiness disabled
    - HTTP listener: `protocol == "HTTP"`; `port == var.alb_listener_port` with default `alb_listener_port == 80`; no `ssl_policy`; no `certificate_arn`; no origin ACM certificate
    - VPC Origin: `origin_protocol_policy == "http-only"`; `http_port == var.alb_listener_port`; no `origin_ssl_protocols` requirement
    - Module interface: no `alb_listener_certificate_arn`; no `origin_domain_name`
    - Module boundary: the backend plan contains zero `aws_acm_certificate`, `aws_acm_certificate_validation`, `aws_route53_zone`, `aws_route53_record`, and `aws_cloudfront_distribution`
    - Security: ALB_SG ingress uses the CloudFront origin-facing managed prefix list on `var.alb_listener_port`; no `0.0.0.0/0` ALB ingress
    - Application-port consistency is asserted separately and only across the ECS task definition, target group, and ECS_SG (the ECS application/container port MUST NOT be required to equal the ALB listener port)
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 3.5, 4.4, 10.2, 12.1, 12.5_

  - [ ] 14.3 Assert the ECS/IAM/DynamoDB invariants (Properties 6, 7, 10, 11, 12)
    - ECS service `assign_public_ip = false` in private subnets; ECS_SG ingress only SG-to-SG from ALB_SG; exactly two IAM roles, neither with `AdministratorAccess`; Task_Role grants exactly the five actions `{GetItem, PutItem, UpdateItem, Query, TransactWriteItems}` on `${table_arn}` + `${table_arn}/index/*` with no `Scan`, `DeleteItem`, `BatchGetItem`, `BatchWriteItem`, `dynamodb:*`, or `Resource:"*"`; zero `aws_dynamodb_table`
    - _Requirements: 3.2, 3.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

  - [ ] 14.4 Assert the network-isolation, VPC-Origin, logging, secrets, autoscaling, naming, output-surface, and clean-slate invariants (Properties 13-22)
    - Zero `aws_vpc`/`aws_subnet`/`aws_route_table`/`aws_route`/`aws_nat_gateway`/`aws_vpc_endpoint`; exactly one `aws_cloudfront_vpc_origin` and zero `aws_cloudfront_distribution`; App_Log_Group finite retention and no S3 access-log bucket; zero secret resources with `app_secret_arn = null`; one autoscaling target with min <= max plus a target-tracking policy; every Name begins with the prefix; no hardcoded identifiers; no backend->edge reference; output set limited to the five with concrete consumers; N>0 add / 0 change / 0 destroy; no `moved` blocks; version pins intact
    - Confirm 0 to change and 0 to destroy. Do NOT apply.
    - _Requirements: 4.1, 4.2, 7.3, 8.2, 8.3, 9.1, 10.1, 11.2, 13.1, 13.5, 14.4, 15.3, 15.4, 15.5_

- [ ] 15. Final checkpoint - operator plan review and cross-module dependency confirmation
  - Present the reviewed clean-slate plan and invariant assertions (Properties 1-22). Private_Egress is resolved at the configuration/design level: the 01-network DEV configuration provides one NAT Gateway (for ECR/logs/STS/Secrets egress) plus S3 and DynamoDB Gateway endpoints — no interface endpoints, no endpoint SG. At the operator review, confirm this egress against the current 01-network plan and note that actual AWS runtime connectivity (image pull, log delivery) is verified only at apply/test time, not by `plan`/`validate`. Applying is gated on explicit operator confirmation — do NOT auto-apply. Ask the user before any `terraform apply`.

## Notes

- This is a clean-slate creation. `terraform plan` shows only creations against a fresh state. No `moved`
  blocks, no state migration.
- Upstream interfaces were inspected: 01-network exposes `vpc_id`, `public_subnet_ids`,
  `private_subnet_ids`, `nat_gateway_id` and NO security groups (backend owns ALB_SG/ECS_SG); 02-data
  exposes `dynamodb_table_name`, `dynamodb_table_arn`, `dynamodb_table_id` and NO GSI-name output (index
  ARNs derived as `${table_arn}/index/*`).
- Private egress is an integration requirement on 01-network, now RESOLVED at the configuration/design
  level: the 01-network DEV configuration provides one NAT Gateway (ECR/logs/STS/Secrets egress) plus S3
  and DynamoDB Gateway endpoints — no VPC interface endpoints and no endpoint security group. The backend
  adds no network resources. Actual AWS runtime connectivity is NOT yet verified and will be confirmed only
  when the infrastructure is planned/applied/tested.
- Edge connections: Viewer->CloudFront uses the default `*.cloudfront.net` domain and the CloudFront default
  viewer certificate (no custom alias/viewer ACM cert in DEV). CloudFront VPC Origin->ALB is HTTP
  (`var.alb_listener_port`, default 80) over the private VPC Origin path; DEV uses no ACM certificate for the
  ALB, no `alb_listener_certificate_arn`, and no `origin_domain_name`. 03-backend creates no ACM/Route 53
  resources and holds no reference to 04-edge. 04-edge consumes `module.backend.vpc_origin_id` and sets the
  distribution origin domain to the backend-exposed `alb_dns_name`. The backend exposes `alb_dns_name` and
  `vpc_origin_id` for 04-edge; dependency direction is backend -> edge only.
- Minimized outputs: only `ecr_repository_url`, `alb_dns_name`, `vpc_origin_id`, `ecs_cluster_name`,
  `ecs_service_name` are exposed (each has a concrete consumer). `alb_arn`, `vpc_origin_arn`,
  `alb_security_group_id`, and `ecs_security_group_id` are intentionally not exposed.
- No secrets in source/tfvars/Dockerfile/Jenkinsfile/repo; secrets wiring is gated on `var.app_secret_arn`
  (default null) so the DEV plan has zero secret resources.
- The module directory holds exactly ten `.tf` files; the `terraform {}` and `locals { name_prefix }`
  blocks live in `ecs.tf` (no `locals.tf`, no `versions.tf`).
- Applying is gated on operator confirmation (task 15); CI runs fmt/init/validate/plan and must fail on any
  non-zero exit, but does not auto-apply.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1", "4.1", "4.2", "5.1"] },
    { "id": 3, "tasks": ["5.2"] },
    { "id": 4, "tasks": ["5.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "7.1"] },
    { "id": 6, "tasks": ["8.1", "9.1", "10.1"] },
    { "id": 7, "tasks": ["11"] },
    { "id": 8, "tasks": ["12.1"] },
    { "id": 9, "tasks": ["12.2", "12.3"] },
    { "id": 10, "tasks": ["13.1"] },
    { "id": 11, "tasks": ["13.2"] },
    { "id": 12, "tasks": ["14.1"] },
    { "id": 13, "tasks": ["14.2", "14.3", "14.4"] },
    { "id": 14, "tasks": ["15"] }
  ]
}
```
