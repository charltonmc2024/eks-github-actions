# Requirements Document

## Introduction

This spec covers the Terraform backend module for the Erudition Solution development environment. The
Backend_Module owns the application runtime and its edge-facing entry point: the ECR repository for the
application image, an internal Application Load Balancer, the CloudFront VPC Origin that fronts that ALB,
the ECS Fargate cluster/task/service, the two IAM roles the tasks use, CloudWatch application logs,
minimal ECS autoscaling, and optional secrets integration. It is a reusable module at
`ecs-terraform/modules/backend/`, consumed by the Terraform root module at `ecs-terraform/envs/dev/`.

The Backend_Module sits between two existing upstream modules and one downstream module:

- **01-network (upstream)** owns the VPC, subnets, and route tables. The Backend_Module consumes
  `module.network.vpc_id` and `module.network.private_subnet_ids` and MUST NOT create or modify any VPC,
  subnet, route table, NAT Gateway, or VPC endpoint. The network module exposes **no security groups**, so
  the Backend_Module owns the ALB and ECS security groups.
- **02-data (upstream)** owns the single DynamoDB App_Table. The Backend_Module consumes
  `module.data.dynamodb_table_name` and `module.data.dynamodb_table_arn`, grants the application task role
  least-privilege access to that table and its indexes, and MUST NOT create another DynamoDB table.
- **04-edge (downstream)** owns the CloudFront distribution and the viewer-facing ACM certificate. The
  Backend_Module creates the CloudFront VPC Origin resource and exposes only the identifier 04-edge needs;
  it MUST NOT create a CloudFront distribution and MUST NOT depend on 04-edge (no circular dependency).

This is a clean-slate, brand-new deployment. The previous development infrastructure has been intentionally
deleted, so there is no existing state to preserve and there are no resources to migrate. Running
`terraform plan` against a clean state represents the CREATION of new development infrastructure. This spec
MUST NOT introduce `moved` blocks or any state-migration logic. This spec is DEV only; no staging or
production resources are created, and no `terraform apply` is performed as part of this spec.

Two connectivity facts drive the design and are stated up front because they cross module boundaries:

- **Private egress (integration requirement with 01-network) — RESOLVED at the configuration/design
  level.** ECS Fargate tasks run in private subnets with `assign_public_ip = false`. The 01-network DEV
  configuration now enables `enable_nat_gateway = true` and `enable_vpc_endpoints = true`, providing one
  NAT Gateway (with its EIP and a private `0.0.0.0/0` route) for general outbound traffic to ECR, CloudWatch
  Logs, and STS/Secrets Manager, plus S3 and DynamoDB Gateway endpoints for that same-Region traffic. The
  Backend_Module still adds no network resources; it consumes the egress 01-network provides. This resolves
  the architecture/configuration dependency; actual AWS runtime connectivity (image pull, log delivery) is
  NOT yet verified and will be confirmed only when the infrastructure is planned/applied/tested.
- **Edge TLS ownership (integration boundary with 04-edge).** Two independent connections. Viewer →
  CloudFront is HTTPS on the default `*.cloudfront.net` domain using the CloudFront default viewer
  certificate. CloudFront VPC Origin → internal ALB is HTTP over the private VPC Origin path on
  `var.alb_listener_port` (default 80). DEV uses no ACM certificate for the internal ALB and no
  `alb_listener_certificate_arn`; the Backend_Module creates no ACM or Route 53 resources.

## Glossary

- **Backend_Module**: The reusable Terraform module at `ecs-terraform/modules/backend/`
- **Dev_Root**: The Terraform root module and source of truth for the development environment at
  `ecs-terraform/envs/dev/`
- **Network_Module**: The existing module at `ecs-terraform/modules/network/` exposing `vpc_id`,
  `public_subnet_ids`, `private_subnet_ids`, and `nat_gateway_id`
- **Data_Module**: The existing module at `ecs-terraform/modules/data/` exposing `dynamodb_table_name`,
  `dynamodb_table_arn`, and `dynamodb_table_id`
- **App_Repository**: The `aws_ecr_repository` that stores the application container image
- **Internal_ALB**: The internal `aws_lb` (scheme `internal`) placed in the private subnets
- **Target_Group**: The `aws_lb_target_group` with `target_type = "ip"` that the ECS service registers into
- **VPC_Origin**: The `aws_cloudfront_vpc_origin` resource that lets CloudFront reach the Internal_ALB
- **ECS_Cluster / ECS_Service / Task_Definition**: The Fargate cluster, long-running service, and task
  definition for the application container
- **Execution_Role**: The ECS task execution role AWS uses to pull the image and write logs (assumed by the
  ECS agent, not the application)
- **Task_Role**: The application task role the running container assumes to call AWS APIs (DynamoDB, and
  Secrets Manager if used)
- **ALB_SG / ECS_SG**: The ALB security group and ECS task security group, both owned by the Backend_Module
- **App_Log_Group**: The CloudWatch Logs log group receiving the application container logs
- **Private_Egress**: Outbound connectivity supplied by 01-network using the DEV NAT Gateway for general
  required outbound traffic (ECR, CloudWatch Logs, STS), plus S3 and DynamoDB Gateway endpoints for those
  services. No VPC interface endpoints or endpoint security group are part of the approved DEV model.
- **AP1..AP16**: The sixteen developer-defined DynamoDB access patterns defined in the 02-data design

## Requirements

### Requirement 1: ECR Application Repository

**User Story:** As a platform engineer, I want a single ECR repository for the application image with
cost-conscious DEV settings, so that CI/CD can push immutable image tags without incurring unnecessary
storage cost or hardcoding account-specific identifiers.

#### Acceptance Criteria

1. THE Backend_Module SHALL create exactly one `aws_ecr_repository` for the application image, named from
   `local.name_prefix` (for example `${var.app_name}-${var.environment}-app`).
2. THE Backend_Module SHALL set `image_scanning_configuration { scan_on_push = true }` on the repository.
3. THE Backend_Module SHALL create an `aws_ecr_lifecycle_policy` that expires untagged and superseded
   images so the DEV repository does not grow unbounded (cost-conscious retention).
4. THE Backend_Module SHALL expose the repository URL as an output and SHALL NOT hardcode any AWS account
   ID, repository ARN, or registry URL anywhere in the module.
5. THE Backend_Module SHALL make the image scanning and mutability settings derivable from module inputs
   where a DEV-versus-later difference is plausible, without introducing speculative variables.
6. THE Backend_Module SHALL NOT create more than one ECR repository.

### Requirement 2: Internal Application Load Balancer

**User Story:** As a platform engineer, I want an internal ALB in the private subnets that only CloudFront
can reach, so that application traffic flows CloudFront → VPC Origin → internal ALB → ECS without exposing
the ALB to the public internet.

#### Acceptance Criteria

1. THE Backend_Module SHALL create an `aws_lb` of type `application` with `internal = true`.
2. THE Backend_Module SHALL place the Internal_ALB in `module.network.private_subnet_ids` and SHALL NOT
   create any VPC, subnet, or route table.
3. THE Backend_Module SHALL create the ALB_SG and attach it to the Internal_ALB; the ALB_SG SHALL restrict
   ingress to the CloudFront VPC Origin path (via the AWS-managed CloudFront origin-facing prefix list) on
   the ALB listener port (`var.alb_listener_port`, default 80) and SHALL NOT use `0.0.0.0/0` ingress. The
   ALB-to-ECS hop remains HTTP on the container port.
4. THE Backend_Module SHALL create exactly one `aws_lb_target_group` with `target_type = "ip"` (required
   for Fargate awsvpc networking).
5. THE Backend_Module SHALL create an `aws_lb_listener` on the ALB with `protocol = "HTTP"` on a
   configurable port (`var.alb_listener_port`, default 80), forwarding to the target group. DEV terminates
   viewer TLS at CloudFront and uses the private VPC Origin path for the CloudFront-to-ALB hop, so the ALB
   listener uses no `ssl_policy`, no `certificate_arn`, and no ACM certificate.
6. THE Target_Group health check SHALL use a configurable path (`var.health_check_path`) and the container
   traffic port, so the ALB only routes to healthy tasks.
7. THE Backend_Module SHALL NOT enable target-group stickiness (sticky sessions) unless a documented
   application requirement is recorded in this spec; no such requirement exists, so stickiness stays
   disabled and the application remains stateless.
8. THE Backend_Module SHALL NOT declare an `alb_listener_certificate_arn` input or any TLS/certificate
   input, because the DEV internal ALB listener is HTTP and requires no certificate. THE Backend_Module
   SHALL NOT create `aws_acm_certificate`, `aws_acm_certificate_validation`, `aws_route53_zone`, or
   `aws_route53_record`, and SHALL NOT reference 04-edge for any certificate.

### Requirement 3: ECS Fargate Cluster, Task, and Service

**User Story:** As a platform engineer, I want the application to run as a stateless ECS Fargate service in
private subnets registered behind the internal ALB, so that the container scales horizontally and never
receives a public IP.

#### Acceptance Criteria

1. THE Backend_Module SHALL create an `aws_ecs_cluster` and an `aws_ecs_service` with `launch_type`
   `FARGATE` (or an equivalent capacity-provider strategy) running an `aws_ecs_task_definition` with
   `network_mode = "awsvpc"`.
2. THE ECS_Service network configuration SHALL place tasks in `module.network.private_subnet_ids` with
   `assign_public_ip = false`.
3. THE ECS_Service SHALL attach the ECS_SG, whose only ingress SHALL be from the ALB_SG on the container
   port (security-group-to-security-group), so tasks are never reachable directly from any CIDR.
4. THE ECS_Service SHALL register with the Target_Group via `load_balancer` configuration on the container
   name and the configurable container port.
5. THE container port SHALL be configurable via `var.container_port` and SHALL be used consistently by the
   task definition port mapping, the Target_Group, and the ECS_SG ingress rule.
6. THE Task_Definition SHALL reference the application image by an immutable tag supplied at deploy time
   (for example a Git SHA or build number) via `var.image_tag`, and SHALL NOT rely solely on `latest`.
7. THE Task_Definition CPU and memory SHALL be configurable via typed variables with cost-conscious DEV
   defaults, and the module SHALL NOT over-provision.
8. THE application SHALL remain stateless; the Backend_Module SHALL NOT create any persistent volume or
   local state store, because persistent state belongs to the DynamoDB App_Table.

### Requirement 4: CloudFront VPC Origin

**User Story:** As a platform engineer, I want the CloudFront VPC Origin created in the backend so
CloudFront can reach the internal ALB, while the CloudFront distribution stays in 04-edge, so ownership is
clear and no circular dependency exists.

#### Acceptance Criteria

1. THE Backend_Module SHALL create the `aws_cloudfront_vpc_origin` resource in `vpc-origin.tf`, targeting
   the Internal_ALB.
2. THE Backend_Module SHALL NOT create any `aws_cloudfront_distribution`, cache policy, or origin request
   policy; those belong to 04-edge.
3. THE Backend_Module SHALL expose exactly the outputs 04-edge requires to attach the VPC Origin to a
   distribution (for example the VPC Origin id/ARN and the ALB DNS name), and SHALL NOT consume any 04-edge
   output.
4. THE VPC Origin toward the Internal_ALB SHALL use `origin_protocol_policy = "http-only"` and
   `http_port = var.alb_listener_port` (default 80), consistent with the HTTP ALB listener, per
   Requirement 12. It SHALL NOT set `https-only` and SHALL NOT require `origin_ssl_protocols`.
5. THE dependency direction SHALL be backend → edge (edge consumes backend outputs), with zero references
   from backend to edge, so no circular dependency is possible.

### Requirement 5: DynamoDB Integration (Consume Only)

**User Story:** As a platform engineer, I want the ECS application task role to have exactly the DynamoDB
permissions the 16 access patterns require and nothing more, so least privilege is enforced and no second
table is created.

#### Acceptance Criteria

1. THE Backend_Module SHALL consume `module.data.dynamodb_table_name` and `module.data.dynamodb_table_arn`
   as inputs and SHALL NOT create, modify, or duplicate any `aws_dynamodb_table`.
2. THE Task_Role policy SHALL grant exactly the five DynamoDB actions the developer-defined access
   patterns use: `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:Query`, and
   `dynamodb:TransactWriteItems`. `dynamodb:TransactWriteItems` is required by the approved
   answer-submission hot path, which atomically performs the response write, the ability-estimate update
   (with its conditional concurrency check), and the seen-set update in a single transaction; it is a
   distinct IAM action that `dynamodb:PutItem`/`dynamodb:UpdateItem` do not imply. The policy SHALL NOT
   grant `dynamodb:Scan`, `dynamodb:DeleteItem`, `dynamodb:BatchGetItem`, `dynamodb:BatchWriteItem`,
   `dynamodb:*`, or any table-management/admin action, because no access pattern (AP1–AP16) requires
   them.
3. THE Task_Role policy resource scope SHALL be exactly the App_Table ARN plus its index ARNs
   (`${table_arn}` and `${table_arn}/index/*`), derived from `module.data.dynamodb_table_arn`, and SHALL
   NOT use `Resource: "*"`.
4. THE Backend_Module SHALL NOT hardcode any DynamoDB table name, table ARN, or account ID; all values
   SHALL derive from the Data_Module outputs passed in through the Dev_Root.

### Requirement 6: IAM Roles and Least Privilege

**User Story:** As a platform engineer, I want separate, least-privilege execution and task roles, so the
ECS agent and the application each hold only the permissions they need and no long-lived credentials exist.

#### Acceptance Criteria

1. THE Backend_Module SHALL create two distinct IAM roles: the Execution_Role (assumed by
   `ecs-tasks.amazonaws.com` for image pull and log writes) and the Task_Role (assumed by the running
   application container).
2. THE Execution_Role SHALL attach only the permissions required to pull from ECR and write to the
   App_Log_Group (for example the AWS-managed `AmazonECSTaskExecutionRolePolicy`, plus read access to any
   consumed secret), and SHALL NOT attach `AdministratorAccess`.
3. THE Task_Role SHALL carry only the scoped DynamoDB permissions from Requirement 5 (and, only if
   Requirement 7 applies, scoped read access to a specific secret), and SHALL NOT attach
   `AdministratorAccess` or unnecessary wildcard permissions.
4. THE Backend_Module SHALL NOT create any IAM user or long-lived access key, and SHALL NOT embed AWS
   credentials in Terraform, task definitions, or environment variables.
5. THE trust policies SHALL restrict `sts:AssumeRole` to the ECS service principals only.

### Requirement 7: Secrets Integration (Conditional)

**User Story:** As a platform engineer, I want secrets integrated only when a concrete application need
exists, so that no empty or speculative secret resources are created and no secret value ever lives in
source control.

#### Acceptance Criteria

1. THE Backend_Module SHALL NOT store any secret value in Terraform source, tfvars, the task definition,
   the Dockerfile, the Jenkinsfile, or any committed file.
2. WHERE the application has a concrete secret requirement, THE Backend_Module SHALL inject the secret into
   the container via the task definition `secrets` block referencing a Secrets Manager or SSM Parameter
   Store ARN passed in as a variable, and SHALL grant the Execution_Role (and/or Task_Role) read access
   scoped to exactly that ARN.
3. WHERE no concrete secret requirement exists in DEV, THE Backend_Module SHALL create no secret resource
   and SHALL gate any secrets wiring behind a variable (for example `var.app_secret_arn`, default `null`)
   so the default DEV plan contains zero secret resources.
4. THE Backend_Module SHALL mark any secret-bearing variable `sensitive = true` and provide no default
   secret value.

### Requirement 8: CloudWatch Application Logging

**User Story:** As a platform engineer, I want ECS application logs shipped to a CloudWatch log group with a
defined DEV retention, so logs are observable and cost is bounded, without inventing an ALB access-log
bucket whose ownership is undefined.

#### Acceptance Criteria

1. THE Backend_Module SHALL create an `aws_cloudwatch_log_group` (the App_Log_Group) named from
   `local.name_prefix` and SHALL configure the task definition `awslogs` (or `awsfirelens`) driver to ship
   application logs to it.
2. THE App_Log_Group SHALL set an explicit `retention_in_days` from a variable with a cost-conscious DEV
   default (for example 14 days), and SHALL NOT use unlimited retention.
3. THE Backend_Module SHALL NOT create an S3 ALB access-log bucket; ALB access logging SHALL be disabled in
   DEV, and IF access logging is required later THE ownership of the access-log bucket SHALL belong to a
   dedicated logging/observability module, not to the Backend_Module.
4. THE App_Log_Group SHALL carry the common tag set.

### Requirement 9: ECS Autoscaling (Minimal, Cost-Conscious)

**User Story:** As a platform engineer, I want minimal ECS autoscaling tuned for DEV, so the service can
scale under load without over-provisioning idle capacity.

#### Acceptance Criteria

1. THE Backend_Module SHALL register an `aws_appautoscaling_target` for the ECS_Service with configurable
   `min_capacity` and `max_capacity`, defaulting to small DEV values (for example min 1, max 2).
2. THE Backend_Module SHALL define at least one target-tracking `aws_appautoscaling_policy` (for example
   average CPU utilization at a configurable target) and SHALL NOT define more scaling policies than DEV
   needs.
3. THE default desired count and scaling bounds SHALL be cost-conscious and SHALL NOT over-provision
   compute for the development environment.
4. THE autoscaling min/max/target values SHALL be exposed as typed variables so they can be tuned without
   editing module source.

### Requirement 10: Networking Consumption and ECS Isolation

**User Story:** As a platform engineer, I want the backend to consume only the network identifiers it needs
and keep ECS tasks unreachable from the internet, so no network resources are duplicated and tasks stay
private.

#### Acceptance Criteria

1. THE Backend_Module SHALL consume `module.network.vpc_id` and `module.network.private_subnet_ids` as
   typed inputs and SHALL NOT create or modify any VPC, subnet, route table, NAT Gateway, or VPC endpoint.
2. THE ALB_SG and ECS_SG SHALL be created in `var.vpc_id`.
3. THE ECS_SG ingress SHALL come only from the ALB_SG (security-group-to-security-group) on the container
   port; the Backend_Module SHALL NOT grant the ECS_SG ingress from any public CIDR.
4. THE Internal_ALB and ECS tasks SHALL reside only in the private subnets; the Backend_Module SHALL NOT
   place either in public subnets and SHALL NOT assign public IPs to tasks.

### Requirement 11: Private Egress Integration with 01-network

**User Story:** As a platform engineer, I want the backend spec to explicitly analyze and declare how
private Fargate tasks reach the AWS APIs they depend on, so the connectivity requirement is resolved by
01-network rather than silently added to the backend.

#### Acceptance Criteria

1. THE Backend_Module SHALL document that private ECS Fargate tasks require outbound reachability to ECR
   (`ecr.api`, `ecr.dkr`), S3 (for ECR image layers), CloudWatch Logs (`logs`), and — only if Requirement 7
   applies — Secrets Manager or SSM plus STS.
2. THE Backend_Module SHALL NOT create VPC interface endpoints, Gateway endpoints, or a NAT Gateway; it
   SHALL record Private_Egress as an integration requirement on 01-network.
3. THE spec SHALL record the resolved DEV egress model provided by 01-network: one NAT Gateway carries
   general outbound traffic to ECR (`ecr.api`, `ecr.dkr`), CloudWatch Logs (`logs`), STS, and (if secrets
   are used) Secrets Manager/SSM, while S3 (ECR image layers) and DynamoDB (application traffic) use their
   respective Gateway endpoints. No VPC interface endpoints and no endpoint security group are used.
4. THE Backend_Module SHALL NOT assume public internet connectivity exists from private subnets.
5. THE spec SHALL record that Private_Egress is now provided by the 01-network DEV configuration
   (`enable_nat_gateway = true`, `enable_vpc_endpoints = true`), resolving the cross-module dependency at
   the configuration/design level. Actual AWS runtime connectivity (image pull, log delivery) is NOT yet
   verified and will be confirmed only when the infrastructure is planned/applied/tested.

### Requirement 12: Edge TLS and VPC Origin Boundary

**User Story:** As a platform engineer, I want the CloudFront-to-ALB and viewer TLS ownership defined before
implementation, so no ACM ARN is hardcoded and no circular dependency between 03-backend and 04-edge is
created.

#### Acceptance Criteria

1. THE Backend_Module SHALL NOT create any ACM certificate, hosted zone, or DNS validation record
   (`aws_acm_certificate`, `aws_acm_certificate_validation`, `aws_route53_zone`, `aws_route53_record`), and
   SHALL NOT declare or consume any certificate ARN; the DEV backend requires no ACM certificate.
2. THE VPC Origin SHALL communicate with the Internal_ALB over HTTP on `var.alb_listener_port`
   (default 80) via the private VPC Origin path, matching the HTTP ALB listener (Requirement 2.5). Viewer
   TLS is a separate, independent connection: for DEV the CloudFront distribution SHALL continue to use the
   default `*.cloudfront.net` domain and the CloudFront default viewer certificate, with no custom viewer
   alias required. The ALB-to-ECS hop remains HTTP on the container port.
3. FOR DEV, viewer TLS SHALL use the CloudFront default certificate with the default `*.cloudfront.net`
   distribution domain; no custom viewer alias or viewer ACM certificate is required for DEV. 04-edge owns
   the CloudFront viewer-TLS configuration but SHALL NOT create or require a viewer ACM certificate for the
   current DEV configuration. The DEV backend uses no origin-side ACM certificate at all: the CloudFront VPC
   Origin reaches the internal ALB over HTTP on the private path, so there is no origin certificate to match
   or own. A future environment may introduce a custom CloudFront viewer domain with a separate viewer ACM
   certificate in `us-east-1` as part of 04-edge, but that is outside the current DEV scope.
4. THE Backend_Module SHALL expose the VPC Origin identifier/ARN and ALB DNS name as outputs for 04-edge to
   consume, keeping the dependency direction backend → edge only.
5. FOR DEV there is no origin TLS certificate and no `origin_domain_name` contract. The CloudFront VPC
   Origin reaches the internal ALB over HTTP on the private path, so 03-backend requires no ACM certificate,
   no `alb_listener_certificate_arn`, no DNS/certificate foundation, and no controlled origin hostname (for
   example `api-origin.<domain>`). 04-edge SHALL consume `module.backend.vpc_origin_id` to attach the VPC
   Origin and SHALL set the distribution origin domain to the ALB DNS name exposed by 03-backend; no
   `origin_domain_name` value is minted or passed. The dependency direction network/data → backend → edge is
   preserved, and 03-backend holds no reference to 04-edge.

### Requirement 13: Naming, Tagging, and Provider Conventions

**User Story:** As a platform engineer, I want backend resources named from a single prefix and tagged
consistently, so resources are identifiable and the module stays environment-independent.

#### Acceptance Criteria

1. THE Backend_Module SHALL define `local.name_prefix = "${var.app_name}-${var.environment}"` and derive
   every resource name and `Name` tag from it, computing the prefix inline nowhere else.
2. THE Backend_Module SHALL merge `var.tags` (Project, Environment, ManagedBy, Owner) into every taggable
   resource.
3. THE Backend_Module SHALL declare no `provider` block and no `backend` block; it SHALL inherit the AWS
   provider from the Dev_Root.
4. THE Backend_Module SHALL use snake_case for all Terraform identifiers.
5. THE Backend_Module SHALL NOT hardcode account IDs, ARNs, region strings, subnet IDs, security-group IDs,
   or ECR URLs; all such values SHALL derive from variables, locals, resource references, data sources, or
   module outputs.

### Requirement 14: Module Inputs and Outputs

**User Story:** As a platform engineer, I want typed, validated inputs and a minimal output surface, so the
Dev_Root wires the backend from upstream module outputs and 04-edge/CI can consume what they need.

#### Acceptance Criteria

1. THE Backend_Module SHALL declare typed, described inputs including at least `app_name`, `environment`,
   `tags`, `vpc_id`, `private_subnet_ids`, `dynamodb_table_name`, `dynamodb_table_arn`, `container_port`,
   `health_check_path`, `image_tag`, `alb_listener_port` (default 80), task `cpu`/`memory`, autoscaling
   min/max/target, and `log_retention_days`.
2. THE Backend_Module SHALL declare the optional input `app_secret_arn` (default `null`,
   `sensitive = true`) that leaves the DEV plan free of secret resources by default, and SHALL declare no
   TLS/certificate input (no `alb_listener_certificate_arn`); it SHALL create no ACM certificate or DNS
   resource.
3. THE Backend_Module SHALL validate that `container_port` is within 1–65535 and that `private_subnet_ids`
   contains at least two subnet IDs.
4. THE Backend_Module SHALL expose only outputs with a concrete downstream consumer: `ecr_repository_url`
   (CI/CD), `alb_dns_name` and `vpc_origin_id` (04-edge distribution origin), and `ecs_cluster_name` /
   `ecs_service_name` (CI/CD deploy). It SHALL NOT expose `alb_security_group_id`, `ecs_security_group_id`,
   `alb_arn`, or `vpc_origin_arn` (no downstream consumer). Outputs SHALL expose no secret values.
5. THE Dev_Root SHALL pass `vpc_id`, `private_subnet_ids`, `dynamodb_table_name`, and `dynamodb_table_arn`
   from the network and data module outputs rather than from literals.

### Requirement 15: Terraform Quality and Clean-Slate Plan

**User Story:** As a platform engineer, I want the module and dev root to format, initialize, validate, and
plan as a clean-slate creation, so CI passes and the plan shows no destruction.

#### Acceptance Criteria

1. WHEN `terraform fmt -check -recursive` is run against `ecs-terraform/modules/backend/` and
   `ecs-terraform/envs/dev/`, THE configuration SHALL produce zero formatting diff and exit 0.
2. WHEN `terraform validate` is run against the Dev_Root after a successful `terraform init`, THE Dev_Root
   SHALL exit 0 with no errors related to the backend module.
3. THE Backend_Module SHALL pin Terraform and the AWS provider consistent with the existing project pins
   (Terraform `~> 1.16.0`, AWS provider `~> 6.62`) and SHALL NOT introduce a major version increment.
4. THE Backend_Module and Dev_Root SHALL contain no `moved` block or state-migration logic.
5. WHEN `terraform plan` is run against a fresh state, THE Dev_Root SHALL produce a backend plan with N>0
   resources to add, exactly 0 to change, and exactly 0 to destroy. No `terraform apply` is performed.

## Out of Scope

The following belong to other specs and MUST NOT be implemented by the Backend_Module: the CloudFront
distribution, cache/origin-request policies, the S3 frontend bucket, Route 53, and the viewer ACM
certificate (all 04-edge); the VPC, subnets, route tables, NAT Gateway, and VPC endpoints (01-network); the
DynamoDB table (02-data); Jenkins pipeline definitions (repository `Jenkinsfile`); and WAF, GuardDuty,
CloudTrail, AWS Config, SNS, and CloudWatch alarms/dashboards (06-observability). Creating VPC interface
endpoints or a NAT Gateway inside the backend module is explicitly out of scope; that is an integration
requirement on 01-network. Staging and production environments are out of scope, and no `terraform apply`
is performed.

## Cross-Module Dependencies and Open Questions

These were analyzed against the actual upstream module interfaces before
finalizing this spec. Items 1–4 are resolved decisions, and item 5 is a tracked
assumption. Item 1 (private egress) is resolved at the configuration/design
level by the 01-network DEV configuration; actual AWS runtime connectivity is
verified only when the infrastructure is planned/applied/tested.

1. **Private egress (integration dependency on 01-network).**
   RESOLVED (configuration/design level) — The 01-network DEV configuration now
   sets `enable_nat_gateway = true` and `enable_vpc_endpoints = true`, and the
   existing network implementation provides exactly one NAT Gateway (with its
   EIP and a private `0.0.0.0/0` route to the NAT), an S3 Gateway endpoint, and
   a DynamoDB Gateway endpoint. No VPC interface endpoints and no endpoint
   security group are used.

   The resolved DEV connectivity model is: ECR (`ecr.api`/`ecr.dkr`), CloudWatch
   Logs, STS, and Secrets Manager/SSM egress via the NAT Gateway; S3 (including
   ECR image-layer S3 traffic) via the S3 Gateway endpoint; DynamoDB application
   traffic via the DynamoDB Gateway endpoint.

   The Backend_Module MUST NOT create NAT Gateways, VPC endpoints, route
   tables, or other network resources. These remain owned by 01-network.

   NOT YET VERIFIED: no `terraform plan`/`apply` has been run for this change,
   so actual AWS runtime connectivity (image pull, log delivery) will be
   confirmed only when the infrastructure is eventually planned/applied/tested.
2. **Edge TLS (two independent connections).** RESOLVED. Viewer→CloudFront uses the default
   `*.cloudfront.net` domain and the CloudFront default viewer certificate for DEV (no custom alias).
   CloudFront VPC Origin→internal ALB uses HTTP on the private VPC Origin path (`var.alb_listener_port`,
   default 80); DEV uses no ACM certificate for the ALB, no `alb_listener_certificate_arn`, no
   `origin_domain_name`, and no DNS/certificate foundation. 03-backend creates no ACM, Route 53, or
   CloudFront distribution resources and holds no reference to 04-edge. 04-edge consumes
   `module.backend.vpc_origin_id` and sets the distribution origin domain to the ALB DNS name exposed by
   03-backend; the ALB → ECS hop remains HTTP on the container port (Requirements 2, 4, 12).
3. **CloudFront ↔ ALB security ownership.** RESOLVED — backend owns ALB_SG and ECS_SG; ALB_SG ingress is
   scoped to the VPC Origin path (not `0.0.0.0/0`); ECS_SG ingress is SG-to-SG from ALB_SG (Requirements 2,
   10).
4. **ALB access logs.** RESOLVED — disabled in DEV; if needed later the S3 bucket is owned by a
   logging/observability module (Requirement 8.3).
5. **Data GSI ARNs (assumption).** 02-data exposes `dynamodb_table_arn` but no explicit GSI-name output.
   The backend derives index ARNs as `${dynamodb_table_arn}/index/*`, which is stable for DynamoDB and does
   not require a new 02-data output. If a tighter per-index scope is later required, a GSI-name output would
   be requested from 02-data at that time.
