# Implementation Plan: 04-edge

## Overview

This plan builds a NEW reusable edge module at `ecs-terraform/modules/edge/` and wires it into the existing
deployment root at `ecs-terraform/envs/dev/`, alongside the already-implemented `module.network`,
`module.data`, and `module.backend`. The edge owns the platform's single public entry point and the static
frontend origin: one private S3 frontend bucket (public-access block, SSE-S3, OAC-scoped bucket policy), one
`aws_cloudfront_origin_access_control`, exactly one edge-owned `aws_cloudfront_vpc_origin` targeting the
internal ALB, and one `aws_cloudfront_distribution` with two origins (private-S3 via OAC and an API VPC
origin) and two behaviors (a default behavior to S3 and an ordered `/api/*` behavior to the VPC origin). It
creates no VPC, no subnet, no DynamoDB table, no ALB, and no ECS resource.

Because the VPC Origin now belongs to edge, this plan begins with a scoped upstream integration change to
03-backend: remove the backend-owned `aws_cloudfront_vpc_origin`, swap the backend `vpc_origin_id` output for
an `alb_arn` output, and fix the dev-root re-export. That change comes FIRST because edge consumes
`module.backend.alb_arn` to build its VPC Origin, and it preserves the dependency direction network/data →
backend → edge with no circular dependency (03-backend still never references edge).

The edge module directory contains exactly four `.tf` files: `cloudfront.tf`, `s3.tf`, `variables.tf`,
`outputs.tf`. The `terraform {}` version block and `locals { name_prefix }` block live at the top of the main
file (`cloudfront.tf`), with no separate `versions.tf`/`locals.tf`, matching the 02-data/03-backend pattern.
The module declares no `provider` and no `backend` block; it inherits the AWS provider (and the
`aws.us_east_1` alias, available for future ACM) from the Dev_Root.

Build order preserves the dependency direction and a bottom-up resource order: the 03-backend prerequisite
first; then an explicit provider-schema verification for the CloudFront VPC Origin / distribution attributes
against the installed `~> 6.62` provider (the design HCL is illustrative, not authoritative); then the edge
module foundation (variables, version/locals); then the S3 bucket + OAC + bucket policy and the edge-owned
VPC Origin; then the CloudFront distribution that ties both origins and behaviors together; then the
minimized outputs; then the dev-root wiring; then fmt/validate/plan and the plan-JSON invariant assertions.
This plan does NOT run `terraform apply`.

This is a clean-slate creation: `terraform plan` against a fresh state shows only creations (N to add, 0 to
change, 0 to destroy). There are NO `moved` blocks and NO state migration.

Edge connections (viewer HTTPS, HTTP origin hop): Viewer → CloudFront is HTTPS on the default
`*.cloudfront.net` domain using the CloudFront default viewer certificate (no custom alias, no viewer ACM
cert, no Route 53 in DEV); viewer HTTP is redirected to HTTPS on every behavior. CloudFront → private S3 is
SigV4-signed through the OAC. CloudFront → internal ALB is HTTP (`http-only`) over the edge-created VPC Origin
private path (`http_port = var.alb_http_port`, default 80), matching the internal ALB's HTTP listener. The
internal ALB stays private and edge creates no ALB/ECS/VPC/DynamoDB resource.

The module output surface is deliberately minimal (terraform.md steering): only `cloudfront_distribution_id`,
`cloudfront_domain_name`, and `frontend_bucket_name` are exposed, because each has a concrete downstream
consumer. The OAC id, bucket ARN, and distribution ARN are intentionally NOT exposed, and no output carries a
secret value.

CloudFront is the application's sole public ingress (Out of Scope): a CloudFront service outage can make both
the frontend and API unavailable even when the private S3 origin, internal ALB, ECS service, and DynamoDB
remain healthy. The private origins are intentionally not exposed as alternate public endpoints; alternate
public ingress, multi-CDN failover, and CloudFront service-outage failover are outside DEV scope.

This is Terraform IaC; property-based testing does not apply. Verification uses `terraform fmt`/`validate`/
`plan` and `terraform plan -json` invariant assertions mapping to the design's 21 Correctness Properties.
Applying to shared dev infrastructure is gated on operator confirmation — this plan does NOT auto-apply.

## Tasks

- [ ] 1. Upstream integration change in 03-backend (prerequisite, MUST precede edge implementation)
  - [ ] 1.1 Remove the backend-owned VPC Origin resource
    - Remove `aws_cloudfront_vpc_origin.app` from `ecs-terraform/modules/backend/vpc-origin.tf`; because that
      file holds only this resource, delete the `vpc-origin.tf` file
    - The VPC Origin is now owned by 04-edge; make no change to ALB, ECS, IAM, listener, target group, or
      security-group behavior
    - _Requirements: 8.2, 14.3_

  - [ ] 1.2 Swap the backend `vpc_origin_id` output for an `alb_arn` output
    - In `ecs-terraform/modules/backend/outputs.tf`, REMOVE the `vpc_origin_id` output (it referenced
      `aws_cloudfront_vpc_origin.app.id`, now deleted)
    - ADD an `alb_arn` output sourced from `aws_lb.app.arn` (the internal ALB ARN) with a description stating
      it is consumed by 04-edge to build the CloudFront VPC Origin
    - KEEP the existing `alb_dns_name` output unchanged (consumed by 04-edge as the API origin `domain_name`)
    - _Requirements: 8.2, 8.3, 14.1_

  - [ ] 1.3 Fix the dev-root re-export in `envs/dev/outputs.tf`
    - Remove the `output "vpc_origin_id"` re-export of `module.backend.vpc_origin_id` because that backend output no longer exists.
    - The VPC Origin is now an internal implementation detail of the 04-edge module and is not re-exported from the dev root.
    - Preserve the existing `ecr_repository_url`, `alb_dns_name`, `ecs_cluster_name`, `ecs_service_name`, and network/data re-exports.
    - _Requirements: 14.1, 17.5_

  - [ ] 1.4 Format and validate the backend module and dev root after the change (no apply)
    - Run `terraform fmt -check -recursive` over `modules/backend` and `envs/dev` (zero diff), then
      `terraform validate` on the dev root reports 0 errors from the removed VPC Origin / swapped output
    - Confirm this preserves the dependency direction network/data → backend → edge and introduces NO
      dependency from 03-backend back to edge and NO circular dependency (03-backend still references no edge
      output); the change is scoped to exactly three edits (remove VPC Origin resource, swap
      `vpc_origin_id` → `alb_arn` output, fix dev-root re-export). Do NOT apply
    - _Requirements: 14.1, 14.2, 14.3, 19.1, 19.2_

- [ ] 2. Verify the AWS provider `~> 6.62` schema for the CloudFront resources (before authoring edge)
  - [ ] 2.1 Confirm exact attribute/block names against the installed provider, not just the design HCL
    - Verify `aws_cloudfront_vpc_origin` and its `vpc_origin_endpoint_config` block attribute names:
      `name`, `arn`, `origin_protocol_policy`, `http_port`, `https_port`, and the `origin_ssl_protocols`
      block (`items`, `quantity`)
    - Verify the CloudFront distribution origin attachment `origin { vpc_origin_config { vpc_origin_id } }`
      and `origin_access_control_id`
    - Verify the managed-policy data sources `aws_cloudfront_cache_policy` and
      `aws_cloudfront_origin_request_policy` and the `aws_cloudfront_origin_access_control` schema
      (`origin_access_control_origin_type`, `signing_behavior`, `signing_protocol`)
    - Check via `terraform providers schema -json` (or the v6.62 registry docs); treat the illustrative
      design HCL as a guide, not authoritative
    - _Requirements: 6.1, 8.2, 8.3, 13.1, 13.3, 19.3_

- [ ] 3. Build the edge module foundation (version pin, locals, variables)
  - [ ] 3.1 Add the `terraform {}` version block and `locals { name_prefix }` at the top of `modules/edge/cloudfront.tf`
    - `required_version = "~> 1.16.0"`; AWS provider `~> 6.62`; comment why it lives in `cloudfront.tf` (no
      `versions.tf`); no major-version increment
    - `name_prefix = "${var.app_name}-${var.environment}"`; comment why it lives here (no `locals.tf`)
    - Declare NO `provider` block and NO `backend` block (inherit from the Dev_Root, including the
      `aws.us_east_1` alias for future ACM)
    - _Requirements: 16.1, 16.3, 16.4, 19.3_

  - [ ] 3.2 Create `modules/edge/variables.tf` with typed, described, validated inputs
    - Declare `app_name`, `environment` (string, non-empty validation) and `tags` (map(string), `default = {}`)
    - Declare `alb_arn` (string, validation non-empty) — the internal ALB ARN consumed from
      `module.backend.alb_arn`, used as the edge-created VPC Origin endpoint/target
    - Declare `alb_dns_name` (string, validation non-empty) — consumed from `module.backend.alb_dns_name`,
      used as the API origin `domain_name`
    - Declare `alb_http_port` (number, default 80) — http port for the edge-created VPC Origin, matching the
      internal ALB HTTP listener; a defaulted local knob, not passed from backend
    - Do NOT declare `aws_region`, `acm_certificate_arn`, or any hosted-zone / DNS-name input; provide a
      meaningful description on every variable; no hardcoded account IDs/ARNs/region/ids in defaults
    - _Requirements: 13.1, 16.5, 17.1, 17.2_

- [ ] 4. Implement the private S3 frontend bucket, encryption, OAC, and bucket policy (`s3.tf`)
  - [ ] 4.1 Create the private `aws_s3_bucket`
    - `aws_s3_bucket` named from `local.name_prefix` (for example `${local.name_prefix}-frontend`); common
      tags merged; not public; no static website hosting enabled
    - _Requirements: 5.1, 5.4, 16.1, 16.2_

  - [ ] 4.2 Apply the public-access block (all four flags true)
    - `aws_s3_bucket_public_access_block` with `block_public_acls`, `block_public_policy`,
      `ignore_public_acls`, and `restrict_public_buckets` all `true`
    - _Requirements: 5.2, 5.5_

  - [ ] 4.3 Enable server-side encryption at rest (SSE-S3)
    - `aws_s3_bucket_server_side_encryption_configuration` with `sse_algorithm = "AES256"` (SSE-S3); no
      customer-managed KMS key
    - _Requirements: 18.1, 18.2_

  - [ ] 4.4 Create the Origin Access Control (not legacy OAI)
    - `aws_cloudfront_origin_access_control` with `origin_access_control_origin_type = "s3"`,
      `signing_behavior = "always"`, `signing_protocol = "sigv4"`
    - Create no `aws_cloudfront_origin_access_identity` (no OAI)
    - _Requirements: 6.1, 6.3_

  - [ ] 4.5 Create the OAC-scoped bucket policy
    - `aws_s3_bucket_policy` granting `s3:GetObject` ONLY to the CloudFront service principal
      (`cloudfront.amazonaws.com`), scoped by the distribution ARN via the `AWS:SourceArn` condition
    - No `Principal: "*"`, no `0.0.0.0/0`, no public read; Terraform sequences OAC + bucket → distribution →
      bucket policy from the distribution-ARN reference (no cycle, no explicit `depends_on`)
    - _Requirements: 5.3, 5.5_

- [ ] 5. Implement the edge-owned CloudFront VPC Origin and distribution (`cloudfront.tf`)
  - [ ] 5.1 Create the single edge-owned `aws_cloudfront_vpc_origin`
    - Exactly one `aws_cloudfront_vpc_origin` (for example `aws_cloudfront_vpc_origin.api`) whose
      `vpc_origin_endpoint_config` targets the internal ALB via `var.alb_arn`, with
      `origin_protocol_policy = "http-only"` and `http_port = var.alb_http_port`
    - Use the exact schema names confirmed in task 2; `https_port` and the `origin_ssl_protocols` block are
      REQUIRED by the installed AWS provider schema (`~> 6.62`) even under `origin_protocol_policy = "http-only"`,
      so set both (`https_port = 443`, `origin_ssl_protocols` = `["TLSv1.2"]`) — they carry no traffic while
      HTTP-only is selected; create no ALB and no ECS resource; the internal ALB stays private
    - _Requirements: 8.2, 10.2, 13.2_

  - [ ] 5.2 Add the managed cache and origin-request policy data sources (no hardcoded IDs)
    - `data "aws_cloudfront_cache_policy"` for CachingOptimized and CachingDisabled; `data
      "aws_cloudfront_origin_request_policy"` for AllViewerExceptHostHeader; resolve ids from the data
      sources, never hardcoded
    - _Requirements: 9.1, 13.1, 13.3_

  - [ ] 5.3 Create the single `aws_cloudfront_distribution` with both origins and both behaviors
    - Exactly one `aws_cloudfront_distribution`, `enabled = true`, the only internet-facing resource
    - S3_Origin: `domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name` (regional domain, not a
      website endpoint) secured by `origin_access_control_id = aws_cloudfront_origin_access_control.<name>.id`
    - API origin: `domain_name = var.alb_dns_name` with
      `vpc_origin_config { vpc_origin_id = aws_cloudfront_vpc_origin.api.id }` (the edge-created VPC Origin)
    - `default_cache_behavior` → S3_Origin, CachingOptimized cache policy,
      `viewer_protocol_policy = "redirect-to-https"`, read methods (`GET`, `HEAD`, optionally `OPTIONS`)
    - `ordered_cache_behavior` `path_pattern = "/api/*"` → API origin, CachingDisabled cache policy,
      AllViewerExceptHostHeader origin-request policy, `viewer_protocol_policy = "redirect-to-https"`,
      methods `GET`/`HEAD`/`OPTIONS`/`PUT`/`POST`/`PATCH`/`DELETE`; evaluated before the default
    - `viewer_certificate { cloudfront_default_certificate = true }`; set no `aliases`; create no ACM;
      set no `web_acl_id` for DEV; Origin Shield disabled on every origin; create no Shield resource; create
      no Route 53 resource; common tags merged
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 7.1, 7.2, 7.3, 7.4, 8.1, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 10.1, 12.1, 12.2, 15.2, 18.3_

- [ ] 6. Implement the minimal module outputs (`outputs.tf`)
  - [ ] 6.1 Create `modules/edge/outputs.tf`
    - Expose ONLY `cloudfront_distribution_id` (`aws_cloudfront_distribution.this.id`),
      `cloudfront_domain_name` (`aws_cloudfront_distribution.this.domain_name`, the default
      `*.cloudfront.net` domain), and `frontend_bucket_name` (`aws_s3_bucket.frontend.bucket`)
    - Do NOT expose the OAC id, the bucket ARN, or the distribution ARN; each output has a non-empty
      description; expose no secret value
    - _Requirements: 2.4, 17.3, 17.4_

- [ ] 7. Checkpoint - module self-contained
  - Confirm `modules/edge` parses on its own with exactly the four `.tf` files (`cloudfront.tf`, `s3.tf`,
    `variables.tf`, `outputs.tf`), no `provider`/`backend` block, no ALB/ECS/VPC/DynamoDB/Route53/ACM/Shield
    resource, one distribution + one OAC + one VPC Origin, the minimized output set, and no undefined
    references. Ask the user if questions arise.

- [ ] 8. Wire the edge module into the dev root
  - [ ] 8.1 Add the `module "edge"` block to `envs/dev/main.tf`
    - `source = "../../modules/edge"`; pass `app_name`, `environment`, the common `tags` map, and
      `alb_arn = module.backend.alb_arn`, `alb_dns_name = module.backend.alb_dns_name` (from module outputs,
      never literals)
    - Preserve the existing `module "network"`, `module "data"`, and `module "backend"` blocks; DEV uses the
      `alb_http_port` default, so no new secret tfvars are required for edge wiring
    - _Requirements: 14.1, 17.5, 16.5_

  - [ ] 8.2 Re-export edge outputs in `envs/dev/outputs.tf`
    - Re-export `cloudfront_domain_name` (and, as useful, `cloudfront_distribution_id` and
      `frontend_bucket_name`) from `module.edge` for operators/CI-CD; keep the existing network/data/backend
      re-exports
    - _Requirements: 2.4, 17.3_

- [ ] 9. Format and validate
  - [ ] 9.1 Run `terraform fmt -check -recursive` over `modules/edge` and `envs/dev` (zero diff)
    - _Requirements: 19.1_
  - [ ] 9.2 Init and validate the dev root
    - `terraform init`, then `terraform validate` reports 0 errors related to the edge module. If `init`
      cannot reach the backend (deleted remote state), validate module-locally with `-backend=false`; do NOT
      create state infrastructure to work around it
    - _Requirements: 19.2_

- [ ] 10. Plan verification (no apply)
  - [ ] 10.1 Generate the plan JSON
    - `terraform plan -out=tfplan` against a fresh state, then `terraform show -json tfplan > plan.json`;
      confirm N>0 to add, exactly 0 to change, exactly 0 to destroy, and no `moved` blocks. Do NOT apply
    - _Requirements: 19.4, 19.5_

  - [ ] 10.2 Assert the distribution / behavior / certificate invariants (Properties 1-5)
    - Exactly one `aws_cloudfront_distribution`, `enabled = true`, the only internet-facing resource (no
      public LB, no public IP, no S3 website endpoint) (P1)
    - `default_cache_behavior.target_origin_id` == the S3_Origin id, which references the bucket regional
      domain via `origin_access_control_id` (P2)
    - Exactly one `ordered_cache_behavior` with `path_pattern == "/api/*"` targeting the API VPC origin, with
      caching disabled (CachingDisabled or TTLs all 0) (P3)
    - Every behavior `viewer_protocol_policy == "redirect-to-https"` (P4)
    - `viewer_certificate.cloudfront_default_certificate == true`, no `aliases`, zero `aws_acm_certificate`
      and zero `aws_acm_certificate_validation` (P5)
    - _Requirements: 1.1, 1.2, 1.3, 5.4, 6.2, 7.1, 7.4, 8.1, 8.5, 9.1, 10.1, 18.3, 2.1, 2.2, 4.1, 4.2, 4.3_

  - [ ] 10.3 Assert the S3 / OAC / VPC-Origin / no-upstream-resource invariants (Properties 6-11)
    - Zero `aws_route53_zone` and zero `aws_route53_record`; no hosted-zone/DNS input (P6)
    - `aws_s3_bucket_public_access_block` all four flags true and no static website hosting (P7)
    - Bucket policy grants `s3:GetObject` only to the CloudFront service principal scoped by the distribution
      ARN via `AWS:SourceArn`; no `Principal: "*"`, no `0.0.0.0/0`, no public read (P8)
    - Exactly one `aws_cloudfront_origin_access_control` (type `s3`, `always`, `sigv4`) and zero
      `aws_cloudfront_origin_access_identity` (P9)
    - Zero `aws_lb`, `aws_ecs_cluster`, `aws_ecs_service`, `aws_ecs_task_definition`, `aws_vpc`,
      `aws_subnet`, `aws_dynamodb_table` (P10)
    - Exactly one edge-owned `aws_cloudfront_vpc_origin` whose endpoint targets the ALB via `var.alb_arn`
      with `origin_protocol_policy == "http-only"`; the API origin `vpc_origin_config.vpc_origin_id`
      references the edge-created VPC Origin and `domain_name == var.alb_dns_name`, both from references, not
      literals (P11)
    - _Requirements: 3.1, 3.2, 3.3, 5.2, 5.3, 5.4, 5.5, 6.1, 6.3, 8.2, 8.3, 11.1, 13.2, 14.3_

  - [ ] 10.4 Assert the isolation / Shield / no-hardcoding / acyclic / naming / output / encryption / clean-slate invariants (Properties 12-21)
    - Edge creates no compute and no VPC workload; the only internet path is Internet → CloudFront →
      VPC_Origin_Api → internal ALB → ECS (P12)
    - No Shield Standard resource and Origin Shield disabled on every origin (P13)
    - No literal account IDs/ARNs (including the ALB ARN)/VPC/subnet/SG ids/ECR URL/distribution id/bucket
      id; `var.alb_arn`/`var.alb_dns_name` from variables; managed-policy ids from data sources (P14)
    - Edge source references only `var.alb_arn`/`var.alb_dns_name` upstream, no direct 01-network/02-data/
      03-backend resource reference; Dev_Root passes both from `module.backend` outputs (P15)
    - Every resource name and `Name` tag begins with `local.name_prefix`; `var.tags` merged into every
      taggable resource (P16)
    - Module exposes exactly `cloudfront_distribution_id`, `cloudfront_domain_name`, `frontend_bucket_name`;
      no OAC id, no bucket ARN, no secret (P17)
    - Frontend_Bucket SSE-S3 at rest and no customer-managed KMS key (P18)
    - No Route 53 resource, no custom viewer alias, no custom ACM, and no speculative/empty
      forward-compatibility resource in the DEV plan (P19)
    - Terraform `~> 1.16.0` and AWS provider `~> 6.62` pins, no major increment, no `provider`/`backend`
      block (P20)
    - N>0 to add, 0 to change, 0 to destroy, no `moved` blocks (P21). Do NOT apply
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 13.1, 13.2, 13.3, 14.1, 14.2, 15.1, 15.2, 15.3, 16.1, 16.2, 16.3, 17.3, 17.4, 17.5, 18.1, 18.2, 19.3, 19.4, 19.5_

- [ ] 11. Final checkpoint - operator plan review
  - Present the reviewed clean-slate plan and the invariant assertions (Properties 1-21), including the
    03-backend prerequisite change (VPC Origin ownership moved to edge; `vpc_origin_id` → `alb_arn` output;
    dependency direction network/data → backend → edge stays acyclic). Note that `plan`/`validate` do not
    test runtime connectivity — actual HTTPS delivery on the default domain, private-S3 serving through OAC,
    and `/api/*` reaching ECS through the VPC Origin are confirmed only at apply/test time. Also note that
    CloudFront is the sole public ingress, so a CloudFront outage can make the app unavailable even when
    origins are healthy. Applying is gated on explicit operator confirmation — do NOT auto-apply. Ask the
    user before any `terraform apply`.

## Notes

- This is a clean-slate creation. `terraform plan` shows only creations against a fresh state. No `moved`
  blocks, no state migration (R19.4, R19.5).
- Task 1 is a scoped upstream integration change to 03-backend and MUST run before edge implementation,
  because edge consumes `module.backend.alb_arn` to build its own VPC Origin. It is limited to exactly three
  edits: remove `aws_cloudfront_vpc_origin.app` (delete `vpc-origin.tf`, which holds only that resource),
  swap the backend `vpc_origin_id` output for an `alb_arn` output (sourced from `aws_lb.app.arn`, keeping
  `alb_dns_name`), and remove the dev-root `vpc_origin_id` re-export. It changes no ALB/ECS/IAM/listener/
  target-group/security-group behavior and introduces no dependency from 03-backend back to edge, so the
  dependency direction network/data → backend → edge stays acyclic (R8.2, R14.1, R14.2, R14.3, Cross-Module
  item 6).
- The illustrative HCL in `design.md` is a guide, not authoritative. Task 2 verifies the exact
  `aws_cloudfront_vpc_origin` / `vpc_origin_endpoint_config` / distribution `vpc_origin_config` / OAC /
  managed-policy-data-source schema against the installed AWS provider `~> 6.62` before edge resources are
  authored.
- Edge connections: Viewer → CloudFront is HTTPS on the default `*.cloudfront.net` domain using the
  CloudFront default viewer certificate (no custom alias/viewer ACM cert/Route 53 in DEV); viewer HTTP is
  redirected to HTTPS on every behavior. CloudFront → private S3 is SigV4-signed via OAC. CloudFront →
  internal ALB is HTTP (`http-only`, `http_port = var.alb_http_port`, default 80) over the edge-created VPC
  Origin private path; the internal ALB stays private and edge creates no ALB/ECS resource (R8, R10).
- The edge module directory holds exactly four `.tf` files; the `terraform {}` and `locals { name_prefix }`
  blocks live in `cloudfront.tf` (no `locals.tf`, no `versions.tf`). The module declares no `provider`/
  `backend` block and inherits the provider (and the `aws.us_east_1` alias for future ACM) from the Dev_Root
  (R16.3, R19.3).
- Minimized outputs: only `cloudfront_distribution_id`, `cloudfront_domain_name`, and `frontend_bucket_name`
  are exposed (each has a concrete consumer). The OAC id, bucket ARN, and distribution ARN are intentionally
  not exposed, and no output carries a secret value (R17.3, R17.4).
- No hardcoded AWS identifiers: `alb_arn`/`alb_dns_name` come from `module.backend` outputs and managed-policy
  ids come from `aws_cloudfront_cache_policy`/`aws_cloudfront_origin_request_policy` data sources (R13).
- This is Terraform IaC; there are NO executable property-based tests. Verification is `terraform fmt`
  (`-check -recursive`), `terraform init`/`terraform validate`, and `terraform plan` plus `terraform plan
  -json` assertions mapping each of the 21 Correctness Properties to concrete plan-JSON checks. If `init`
  cannot reach the backend (deleted remote state), validate module-locally with `-backend=false`; do NOT
  create state infrastructure to work around it. Runtime connectivity is verified only at apply/test time,
  not by `plan`/`validate` (R19.1, R19.2, R19.5).
- CloudFront is the application's sole public ingress. A CloudFront outage can make both frontend and API
  unavailable even when the private origins are healthy; alternate public ingress and CDN failover are out
  of DEV scope (Out of Scope).
- Applying is gated on operator confirmation (task 11); CI runs fmt/init/validate/plan and must fail on any
  non-zero exit, but does not auto-apply.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1"] },
    { "id": 3, "tasks": ["3.1", "3.2"] },
    { "id": 4, "tasks": ["4.1", "4.4"] },
    { "id": 5, "tasks": ["4.2", "4.3", "5.1", "5.2"] },
    { "id": 6, "tasks": ["5.3"] },
    { "id": 7, "tasks": ["4.5", "6.1"] },
    { "id": 8, "tasks": ["8.1"] },
    { "id": 9, "tasks": ["8.2"] },
    { "id": 10, "tasks": ["9.1"] },
    { "id": 11, "tasks": ["9.2"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["10.2", "10.3", "10.4"] }
  ]
}
```
