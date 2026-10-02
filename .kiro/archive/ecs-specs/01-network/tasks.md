# Implementation Plan: 01-network

## Overview

This plan builds a NEW reusable network module at `ecs-terraform/modules/network/` and a NEW
deployment root at `ecs-terraform/envs/dev/` that creates fresh development infrastructure from
scratch. The module owns ONLY VPC-layer infrastructure: the VPC, public and private subnets, the
Internet Gateway, the public and private route tables, an optional NAT Gateway, optional S3/DynamoDB
Gateway endpoints, and the networking outputs downstream modules consume. It creates NO security
groups — the ALB/ECS security groups and the CloudFront → ALB → ECS relationship belong to the
future `03-backend` module.

The NAT Gateway and the S3/DynamoDB Gateway endpoints default to off at the module level so the module
stays reusable, but for the DEV environment they are ENABLED (`enable_nat_gateway = true`,
`enable_vpc_endpoints = true`): DEV provisions exactly ONE public NAT Gateway plus S3 and DynamoDB
Gateway endpoints so private ECS Fargate tasks reach S3/DynamoDB through the endpoints and all other
outbound traffic egresses via the single NAT Gateway, while workloads stay private
(`assign_public_ip = false`). The single (non-AZ-redundant) NAT Gateway is a deliberate DEV
cost/availability tradeoff.

The previous dev infrastructure has been intentionally deleted — there is no existing state and no
resources to preserve. `envs/dev` is the Terraform root module and the single source of truth for
the development environment, so `terraform plan` against a clean state shows only creations
(0 to destroy, 0 to change).

Build order is bottom-up: the module is assembled file-by-file (foundation → resources → outputs),
then the dev root is scaffolded and wired, and finally the whole thing is formatted, validated, and
plan-verified against the design's Correctness Properties.

This is Terraform Infrastructure as Code. Per the design, property-based testing does not apply;
verification uses `terraform fmt`/`validate`/`plan` and plan-JSON assertions against the design's Correctness Properties. Applying to
shared dev infrastructure is a high-risk operation gated on operator confirmation — this plan does
NOT auto-apply.

## Tasks

- [x] 1. Build module foundation (versions, variables, locals)
  - [x] 1.1 Create `modules/network/versions.tf`
    - Pin `required_version = "~> 1.16.0"` and AWS provider `~> 6.62`
    - Do not perform any major version upgrade
    - _Requirements: 13.1_

  - [x] 1.2 Create `modules/network/variables.tf` with all typed, described, validated inputs
    - Declare `app_name`, `environment` (string, reject empty via validation)
    - Declare `aws_region` (string, non-empty description)
    - Declare `vpc_cidr`, `public_subnet_cidr1/2`, `private_subnet_cidr1/2` (string, validate `can(cidrhost(var.x, 0))`)
    - Declare `enable_nat_gateway`, `enable_vpc_endpoints` (bool, `default = false`)
    - Declare `tags` (map(string), `default = {}`)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 1.3 Create `modules/network/locals.tf`
    - Define `local.name_prefix = "${var.app_name}-${var.environment}"` as the single naming base
    - Do not repeat name-derivation logic inline elsewhere
    - _Requirements: 12.1, 12.3_

- [x] 2. Implement module VPC and Internet Gateway
  - [x] 2.1 Create `modules/network/vpc.tf`
    - `aws_vpc.main` with `cidr_block = var.vpc_cidr`, `enable_dns_support = true`, `enable_dns_hostnames = true`
    - Tags: `merge(var.tags, { Name = "${local.name_prefix}-vpc" })`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 12.2, 12.5_

  - [x] 2.2 Create `modules/network/igw.tf`
    - `aws_internet_gateway.main` attached to `aws_vpc.main.id`
    - Tags: `merge(var.tags, { Name = "${local.name_prefix}-igw" })`
    - _Requirements: 4.1, 4.2, 12.2, 12.5_

- [x] 3. Implement module subnets
  - [x] 3.1 Create `modules/network/public_subnet.tf`
    - `aws_subnet.public1` in `"${var.aws_region}a"` (cidr `public_subnet_cidr1`, `map_public_ip_on_launch = true`)
    - `aws_subnet.public2` in `"${var.aws_region}b"` (cidr `public_subnet_cidr2`, `map_public_ip_on_launch = true`)
    - Unique Name tags `"${local.name_prefix}-public-subnet-1"` / `"-public-subnet-2"`, merge `var.tags`
    - `aws_route_table_association.public_1` and `public_2`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 12.2, 12.5_

  - [x] 3.2 Create `modules/network/private_subnet.tf`
    - `aws_subnet.private1` in `"${var.aws_region}a"` (cidr `private_subnet_cidr1`, `map_public_ip_on_launch = false`)
    - `aws_subnet.private2` in `"${var.aws_region}b"` (cidr `private_subnet_cidr2`, `map_public_ip_on_launch = false`)
    - Tags with unique `-private-subnet-1` / `-private-subnet-2` names, merged `var.tags`
    - `aws_route_table_association.private_1` and `private_2` against the private route table
    - _Requirements: 3.1, 3.2, 3.3, 12.2, 12.5_

- [x] 4. Implement module route tables
  - [x] 4.1 Create `modules/network/public_route_table.tf`
    - `aws_route_table.public_route_table` with a single `0.0.0.0/0` → IGW route, no extra routes
    - `aws_route_table_association` for `public1` and `public2`
    - Tags: `merge(var.tags, { Name = "${local.name_prefix}-public-route-table" })`
    - _Requirements: 5.1, 5.2, 5.3, 12.2, 12.5_

  - [x] 4.2 Create `modules/network/private_route_table.tf`
    - `aws_route_table.private_route_table` with NO inline default route block
    - Tags: `merge(var.tags, { Name = "${local.name_prefix}-private-route-table" })`
    - _Requirements: 6.1, 6.4, 6.5, 12.2, 12.5_

- [x] 5. Implement conditional NAT Gateway
  - [x] 5.1 Create `modules/network/natgw.tf` with count-based EIP, NAT, and private route
    - `aws_eip.eip` with `count = var.enable_nat_gateway ? 1 : 0`, `domain = "vpc"`, tag `-nat-eip`
    - `aws_nat_gateway.natgw` with `count = ... ? 1 : 0`, placed in `aws_subnet.public1`, `depends_on = [aws_internet_gateway.main]`, tag `-natgw`
    - `aws_route.private_nat` with `count = ... ? 1 : 0`, `0.0.0.0/0` → `aws_nat_gateway.natgw[0].id` on the private route table
    - When disabled, no EIP/NAT/route and the private route table has no `0.0.0.0/0` route
    - For DEV (`enable_nat_gateway = true`) this provisions exactly ONE public NAT Gateway + EIP and the private `0.0.0.0/0` → NAT route; the NAT is outbound-only and not AZ-redundant
    - _Requirements: 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 12.2_

- [x] 6. Implement conditional VPC gateway endpoints
  - [x] 6.1 Create `modules/network/endpoints.tf`
    - `aws_vpc_endpoint.s3` (Gateway) `count = var.enable_vpc_endpoints ? 1 : 0`, service `com.amazonaws.${var.aws_region}.s3`, associated with public + private route tables, tag `-s3-endpoint`
    - `aws_vpc_endpoint.dynamodb` (Gateway) same count/associations, service `com.amazonaws.${var.aws_region}.dynamodb`, tag `-dynamodb-endpoint`
    - When disabled, zero endpoint resources exist
    - For DEV (`enable_vpc_endpoints = true`) both Gateway endpoints exist; their prefix-list routes are more specific than the `0.0.0.0/0` NAT route, so S3/DynamoDB traffic uses the endpoints rather than the NAT path
    - Gateway endpoints only — no S3/DynamoDB interface endpoint and no endpoint security group
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 12.2, 12.5_

- [x] 7. Implement module outputs
  - [x] 7.1 Create `modules/network/outputs.tf`
    - `vpc_id`, `public_subnet_ids`, `private_subnet_ids`
    - `nat_gateway_id = var.enable_nat_gateway ? aws_nat_gateway.natgw[0].id : null` (count-guarded); resolves to a non-null NAT id in DEV
    - Every output carries a non-empty description
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8. Checkpoint - module self-contained
  - Ensure the module directory parses on its own (`terraform fmt` clean, no undefined references). Ask the user if questions arise.

- [x] 9. Scaffold the dev deployment root
  - [x] 9.1 Create `envs/dev/versions.tf`
    - Terraform `~> 1.16.0` + AWS provider `~> 6.62` pins matching the module
    - _Requirements: 13.2_

  - [x] 9.2 Create `envs/dev/providers.tf`
    - AWS provider with `region = var.aws_region` and `default_tags`; no credentials in config
    - Default-region provider only (the `aws.us_east_1` alias is deferred to the edge module)
    - _Requirements: 11.1_

  - [x] 9.3 Create `envs/dev/backend.tf`
    - `backend "s3" {}` block configured at init; targets the dev state key `ecs-dev/terraform.tfstate` produced by bootstrap, initialized as a fresh/empty state
    - Do not create the backend bucket from this state
    - _Requirements: 11.7_

  - [x] 9.4 Create `envs/dev/variables.tf`
    - Mirror module inputs with explicit types, non-empty descriptions, correctly-typed defaults (bool for enables, string for CIDRs/names); add `owner`
    - _Requirements: 11.4_

  - [x] 9.5 Create `envs/dev/terraform.tfvars`
    - `app_name = "eruditiontx-app"`, `environment = "ecs-dev"`, `aws_region = "us-east-1"`
    - `enable_nat_gateway = true`, `enable_vpc_endpoints = true`, plus CIDRs (DEV enables NAT + gateway endpoints)
    - _Requirements: 11.5_

- [x] 10. Wire the module into the dev root
  - [x] 10.1 Create `envs/dev/main.tf`
    - `module "network"` with `source = "../../modules/network"`
    - Pass all inputs: `app_name`, `environment`, `aws_region`, `vpc_cidr`, all four subnet CIDRs, `enable_nat_gateway`, `enable_vpc_endpoints`
    - Pass a `tags` map with `Project`, `Environment`, `ManagedBy`, `Owner` (non-empty values)
    - _Requirements: 11.1, 11.2, 11.3, 11.6_

- [x] 11. Re-export outputs from the dev root
  - [x] 11.1 Create `envs/dev/outputs.tf`
    - Re-export `module.network.vpc_id`, `public_subnet_ids`, `private_subnet_ids`, `nat_gateway_id`
    - _Requirements: 10.1, 11.6_

- [x] 12. Format and validate
  - [x] 12.1 Run `terraform fmt -recursive` over module and dev root
    - Ensure zero diff for `ecs-terraform/modules/network/` and `ecs-terraform/envs/dev/`
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 12.2 Init and validate the dev root against the fresh dev state
    - `terraform init -backend-config=...` pointed at the bucket/key/region/lockfile produced by bootstrap (`ecs-dev/terraform.tfstate`), starting from a fresh/empty state
    - `terraform validate` reports no errors
    - _Requirements: 13.5_

- [x] 13. Plan verification (no apply)
  - [x] 13.1 Generate and inspect the plan JSON (against the DEV configuration: both toggles `true`)
    - `terraform plan -out=tfplan` then `terraform show -json tfplan > plan.json`
    - Assert Property 1 (fresh plan is all-create): against a clean state, every resource in `resource_changes[].change.actions` is `["create"]` only — 0 destroy, 0 update, 0 replace
    - Assert Property 2 (DEV NAT enabled, exactly one): exactly one `aws_nat_gateway` and one `aws_eip` in `module.network` (one zonal NAT, not per-AZ)
    - Assert Property 3 (DEV gateway endpoints enabled): exactly two `aws_vpc_endpoint` resources — S3 and DynamoDB, both `vpc_endpoint_type = "Gateway"` — associated with the private route table
    - Assert Property 4 (routing): private RT has `0.0.0.0/0` → NAT (`aws_route.private_nat` present) and public RT has `0.0.0.0/0` → IGW; S3/DynamoDB gateway prefix routes are more specific and take precedence
    - Assert Property 5 (outputs resolve): `vpc_id`, `public_subnet_ids`, and `private_subnet_ids` are non-null; `nat_gateway_id` is a non-null NAT id in DEV
    - Assert Property 6 (no interface endpoints, no endpoint SG): zero interface `aws_vpc_endpoint` resources and zero `aws_security_group` resources in `module.network`
    - _Requirements: 11.7, 7.8, 7.9, 8.6, 8.7, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x]* 13.2 Run the disabled-path sanity plan (module reusability, Property 9)
    - One-off `terraform plan` (not applied) with `enable_nat_gateway = false` and `enable_vpc_endpoints = false`
    - Confirm the module retains its `default = false` behavior: no NAT/EIP, no private `0.0.0.0/0` route, zero VPC endpoints, and `nat_gateway_id = null` — proving the module stays disableable for other environments
    - _Requirements: 6.3, 7.1, 7.5, 8.1, 8.4, 9.6, 9.7_

- [~] 14. Final checkpoint - operator plan review before apply
  - Present the reviewed clean-slate creation plan and invariant assertions to the operator. Applying to shared dev infrastructure is high-risk and gated on explicit operator confirmation — do NOT auto-apply. Ask the user before any `terraform apply`.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster path; 13.2 is a confidence check on the conditional (enabled) code paths.
- This is a clean-slate creation: `terraform plan` shows only creations against a fresh, empty state. There are no `moved` blocks and no state migration — the previous dev infrastructure was deleted and nothing is preserved.
- The network module creates no security groups. The ALB/ECS security groups and the CloudFront → ALB → ECS traffic relationship belong to the future `03-backend` module.
- This feature is Terraform IaC, so there are no property-based (code) test tasks. The design's `## Correctness Properties` section (Properties 1–9) is verified against the DEV configuration via `terraform fmt`/`validate`/`plan` and plan-JSON assertions rather than executable tests.
- No AWS account IDs, ARNs, VPC/subnet IDs, or ECR URLs are hardcoded — all values come from variables, locals, references, data sources, or module outputs.
- The module stays environment-independent; all dev-specific values live in `envs/dev/terraform.tfvars`.
- Applying is gated on operator confirmation (task 14); CI runs fmt/init/validate/plan and must fail on any non-zero exit, but does not auto-apply.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "9.1", "9.3", "9.5"] },
    { "id": 1, "tasks": ["2.1", "2.2", "9.2", "9.4"] },
    { "id": 2, "tasks": ["4.1", "4.2"] },
    { "id": 3, "tasks": ["3.1", "3.2", "5.1", "6.1"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["10.1", "11.1"] },
    { "id": 6, "tasks": ["12.1"] },
    { "id": 7, "tasks": ["12.2"] },
    { "id": 8, "tasks": ["13.1", "13.2"] }
  ]
}
```
