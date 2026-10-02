# Implementation Plan: 02-data

## Overview

This plan builds a NEW reusable data module at `ecs-terraform/modules/data/` and wires it into the
existing deployment root at `ecs-terraform/envs/dev/`. The module owns a **single DynamoDB table**
that stores every Erudition Solution entity under a single-table design: item types are distinguished
by their `PK`/`SK` key patterns and an application-level `entityType` attribute, and the key structure
is driven by the 16 developer-defined access patterns (AP1–AP16), not by an entity-to-table mapping.

This design **supersedes and replaces the withdrawn `userId` partition-key / `EmailIndex` model
entirely** — nothing from it is carried forward. This is a brand-new, clean-slate deployment: the
previous development infrastructure was intentionally deleted, so there is no existing state and no
resources to migrate. There are NO `moved` blocks and NO migration logic; `terraform plan` against a
fresh state shows only creations (N to add, 0 to change, 0 to destroy). No reference is made to any
old flat-root DynamoDB resources.

Build order is bottom-up: the module foundation (variables, then the `terraform {}` and `locals {}`
blocks inside `dynamodb.tf`), then the single table with its two GSIs, then the three
documentation-only files (`schema.tf`, `kms.tf`, `backup.tf`), then outputs. The dev root is then
wired to call the module, and finally the whole thing is formatted, validated, and plan-verified
against the design's testable invariants (A–R).

The module directory contains **exactly six** `.tf` files — `dynamodb.tf`, `schema.tf`, `kms.tf`,
`backup.tf`, `variables.tf`, `outputs.tf`. There is NO `locals.tf` and NO `versions.tf`: the
`terraform { required_version, required_providers }` block and the `locals { name_prefix }` block both
live inside `dynamodb.tf`.

This is Terraform Infrastructure as Code. Per the design, property-based testing does not apply — the
design has no Correctness Properties that quantify over function inputs; verification uses
`terraform fmt`/`validate`/`plan` and plan-JSON invariant assertions. Applying to shared dev
infrastructure is a high-risk operation gated on operator confirmation — this plan does NOT auto-apply.

## Tasks

- [ ] 1. Build module foundation (variables, version pin, locals)
  - [ ] 1.1 Create `modules/data/variables.tf` with all typed, described, validated inputs
    - Declare `app_name` (string, description, validation `length(trimspace(var.app_name)) > 0` rejecting empty/whitespace)
    - Declare `environment` (string, description, validation `length(trimspace(var.environment)) > 0` rejecting empty/whitespace)
    - Declare `tags` (map(string), non-empty description, `default = {}`)
    - Declare `enable_point_in_time_recovery` (bool, non-empty description, `default = true`)
    - Declare `deletion_protection_enabled` (bool, non-empty description, `default = false`)
    - Do NOT declare an `aws_region` variable — the module consumes no region; region comes from the AWS provider in `envs/dev/providers.tf`
    - Declare no speculative variables; no hardcoded account IDs, ARNs, KMS key IDs, or resource names in defaults
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 19.4, 19.5_

  - [ ] 1.2 Add the `terraform {}` version-constraint block at the top of `modules/data/dynamodb.tf`
    - `required_version = "~> 1.16.0"`; `required_providers { aws = { source = "hashicorp/aws", version = "~> 6.62" } }`
    - Place this block inside `dynamodb.tf` (no separate `versions.tf`); comment why it lives here
    - Do not perform any major version increment of Terraform or the AWS provider
    - _Requirements: 12.3, 20.5_

  - [ ] 1.3 Add the `locals { name_prefix }` block in `modules/data/dynamodb.tf`
    - `name_prefix = "${var.app_name}-${var.environment}"` as the single naming base
    - Place inside `dynamodb.tf` (no separate `locals.tf`); do not compute the prefix inline elsewhere
    - _Requirements: 12.4, 19.1, 19.3_

- [ ] 2. Implement the single App_Table in `dynamodb.tf`
  - [ ] 2.1 Declare `aws_dynamodb_table.app` core: name, billing, composite key
    - `name = "${local.name_prefix}-app"` (derived, never a hardcoded literal)
    - `billing_mode = "PAY_PER_REQUEST"` with a cost comment; no `read_capacity`/`write_capacity` anywhere
    - `hash_key = "PK"`, `range_key = "SK"`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.2, 6.3, 6.4, 18.1, 17.1, 17.5_

  - [ ] 2.2 Declare exactly the six key `attribute` blocks
    - `PK`, `SK`, `GSI1PK`, `GSI1SK`, `GSI2PK`, `GSI2SK`, each `type = "S"`
    - Declare NO application-field attribute (`studentId`, `score`, `theta`, `completedAt`, `masteryBySkill`, `entityType`, …)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ] 2.3 Add the GSI1 item-bank index block
    - `name = "GSI1"`, `hash_key = "GSI1PK"`, `range_key = "GSI1SK"`, `projection_type = "ALL"`
    - No `non_key_attributes`; no `read_capacity`/`write_capacity`
    - Comment the encoding: keys on item PARAMS items only, `GSI1PK = "SKILL#<skillId>#<gradeLevel>"`, `GSI1SK = "DIFF#<zero-padded-difficulty>#<itemId>"`, serving AP4 and AP15
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.1_

  - [ ] 2.4 Add the GSI2 teacher-reporting index block
    - `name = "GSI2"`, `hash_key = "GSI2PK"`, `range_key = "GSI2SK"`, `projection_type = "INCLUDE"`
    - `non_key_attributes = ["studentId", "score", "completedAt", "masteryBySkill"]` — exactly these four, none added/renamed
    - No `read_capacity`/`write_capacity`; do not declare the four projected names as top-level attribute blocks
    - Comment the encoding: keys on Result items only, `GSI2PK = "ASSIGN#<assignmentId>"`, `GSI2SK = "RESULT#<studentId>"`, serving AP10; INCLUDE projection is a cost note
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.4, 18.4_

  - [ ] 2.5 Add PITR, encryption, deletion protection, and tags on the table
    - `point_in_time_recovery { enabled = var.enable_point_in_time_recovery }` with a cost-bearing comment
    - `server_side_encryption { enabled = true }` with NO `kms_key_arn` (AWS-owned encryption)
    - `deletion_protection_enabled = var.deletion_protection_enabled`
    - `tags = merge(var.tags, { Name = "${local.name_prefix}-app" })`
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 17.4, 18.2, 18.5, 19.2_

- [ ] 3. Write `schema.tf` documentation (no resources)
  - [ ] 3.1 Document the full 17-entity PK/SK chart and the three labeled categories
    - Enumerate `PK`/`SK` for all 17 documented entities (Student profile through Audit record)
    - Label (a) Terraform-declared Key_Attributes (`PK`, `SK`, `GSI1PK`, `GSI1SK`, `GSI2PK`, `GSI2SK`), (b) Terraform-managed indexes (`GSI1`, `GSI2`), (c) schemaless Application_Item_Fields
    - Declare no resource in `schema.tf`
    - _Requirements: 10.1, 10.2, 10.7_

  - [ ] 3.2 Document GSI encodings, the difficulty rule, and key conventions
    - GSI1: `GSI1PK = "SKILL#<skillId>#<gradeLevel>"`, `GSI1SK = "DIFF#<zero-padded-difficulty>#<itemId>"`, PARAMS items only
    - GSI2: `GSI2PK = "ASSIGN#<assignmentId>"`, `GSI2SK = "RESULT#<studentId>"`, Result items only, INCLUDE `studentId`/`score`/`completedAt`/`masteryBySkill`
    - Difficulty rule `"DIFF#" + zero-pad((b + 3.0) * 100, width 4)` with worked examples `b=-3.0 → DIFF#0000`, `b=0.0 → DIFF#0300`, `b=+3.0 → DIFF#0600`; state lexical order equals numeric order
    - Conventions: `#` separates segments, numerics zero-padded to fixed width, timestamps ISO-8601, `entityType` is an application convention not a Terraform-declared key
    - _Requirements: 10.3, 10.4, 10.5, 10.6_

  - [ ] 3.3 Document the 16 access-pattern traceability mapping
    - Map AP1–AP16 each to exactly one serving construct (base `PK`/`SK`, `GSI1`, or `GSI2`) with its operation and key condition
    - State that every AP is served by `Query`/`GetItem`/`PutItem`/`UpdateItem` with no table `Scan` and no read-path filter
    - State that range reads (AP4, AP6, AP8, AP11, AP12, AP14, AP15) use `begins_with`/`BETWEEN` on the sort key
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 4. Write `kms.tf` documentation (no resources)
  - [ ] 4.1 Document the dev AWS-owned encryption rationale
    - Explain why dev uses AWS-owned encryption (lowest-cost, no key management) and under what concrete requirement a CMK would be introduced
    - Declare no `aws_kms_key` and no `aws_kms_alias`
    - _Requirements: 7.3, 7.4, 18.2_

- [ ] 5. Write `backup.tf` documentation (no resources)
  - [ ] 5.1 Document PITR as the baseline recovery mechanism
    - Explain that PITR (configured in `dynamodb.tf`) is the baseline and that AWS Backup is intentionally not created for dev; include a cost note
    - Declare no `aws_backup_vault`, `aws_backup_plan`, or `aws_backup_selection`
    - _Requirements: 8.4, 8.5, 18.3_

- [ ] 6. Implement module outputs in `outputs.tf`
  - [ ] 6.1 Create `modules/data/outputs.tf`
    - `dynamodb_table_name = aws_dynamodb_table.app.name`, `dynamodb_table_arn = ...arn`, `dynamodb_table_id = ...id`
    - Each output has a non-empty description and `sensitive = false`
    - Declare no GSI-name output (no downstream consumer yet); expose no secret values
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6, 14.7_

- [ ] 7. Checkpoint - module self-contained
  - Ensure all tests pass, ask the user if questions arise. Confirm `modules/data` parses on its own with exactly the six `.tf` files and no undefined references (no network-module reference, no backend/provider block).

- [ ] 8. Prepare dev root variables and tfvars
  - [ ] 8.1 Ensure `envs/dev/variables.tf` declares every variable the dev root and `module "data"` call reference
    - Add any missing declarations — `tags`, `enable_point_in_time_recovery`, and `deletion_protection_enabled` (bool, non-empty description, `default = false`)
    - Each: explicit `type`, 1–512-char `description`, correctly-typed default (bool for `enable_point_in_time_recovery`/`deletion_protection_enabled`, string for names/region); confirm `app_name`, `environment`, `aws_region`, `owner` present and typed
    - Keep `aws_region` at the dev-root level for the provider even though it is not passed to `module "data"`
    - _Requirements: 15.4, 15.9_

  - [ ] 8.2 Set data values in `envs/dev/terraform.tfvars`
    - Set `enable_point_in_time_recovery` and `deletion_protection_enabled = false`; confirm `app_name = "eruditiontx-app"`, `environment = "ecs-dev"`, `aws_region = "us-east-1"`
    - _Requirements: 15.5, 15.9_

- [ ] 9. Wire the module into the dev root
  - [ ] 9.1 Add the `module "data"` block to `envs/dev/main.tf`
    - `source = "../../modules/data"`; pass `app_name`, `environment`, `enable_point_in_time_recovery`, and `deletion_protection_enabled = var.deletion_protection_enabled` each referencing a Dev_Root variable
    - Pass a `tags` map with `Project = var.app_name`, `Environment = var.environment`, `ManagedBy = "Terraform"`, `Owner = var.owner`
    - Do NOT pass `aws_region` (the module consumes no region; region comes from the provider in `envs/dev/providers.tf`)
    - Pass `deletion_protection_enabled` explicitly so the environment-level choice is visible in the dev root
    - _Requirements: 15.1, 15.2, 15.3, 15.7, 15.9_

  - [ ] 9.2 Re-export the data outputs in `envs/dev/outputs.tf`
    - Re-export `module.data.dynamodb_table_name`, `...dynamodb_table_arn`, `...dynamodb_table_id`
    - _Requirements: 15.6_

- [ ] 10. Format and validate
  - [ ] 10.1 Run `terraform fmt -check -recursive` over module and dev root
    - Ensure zero diff for `ecs-terraform/modules/data/` and `ecs-terraform/envs/dev/`
    - _Requirements: 20.1, 20.2, 20.3_

  - [ ] 10.2 Init and validate the dev root against the fresh dev state
    - `terraform init` (S3 backend, dev state key `ecs-dev/terraform.tfstate`), starting from a fresh/empty state
    - `terraform validate` reports 0 errors related to the data module
    - _Requirements: 16.6, 20.4_

- [ ] 11. Plan verification (no apply)
  - [ ] 11.1 Generate the plan JSON
    - `terraform plan -out=tfplan` then `terraform show -json tfplan > plan.json`
    - _Requirements: 20.7_

  - [ ] 11.2 Assert the single-table, key, attribute, and index invariants (A–H)
    - A: exactly one `aws_dynamodb_table`, no per-entity table
    - B: `billing_mode == "PAY_PER_REQUEST"`, no `read_capacity`/`write_capacity` on table/GSI1/GSI2
    - C: `hash_key == "PK"`, `range_key == "SK"`
    - D: exactly six `attribute` blocks (`PK`, `SK`, `GSI1PK`, `GSI1SK`, `GSI2PK`, `GSI2SK`), each type `"S"`
    - E: no `attribute` block for any application field (`studentId`, `score`, `theta`, `completedAt`, `masteryBySkill`, `entityType`)
    - F: exactly `GSI1` and `GSI2`; no local secondary index; no third GSI
    - G: GSI1 keys `GSI1PK`/`GSI1SK`, projection `ALL`, no `non_key_attributes`
    - H: GSI2 keys `GSI2PK`/`GSI2SK`, projection `INCLUDE`, `non_key_attributes` exactly the four names
    - _Requirements: 1.1, 1.5, 2.1, 2.7, 2.8, 3.1, 3.4, 3.5, 4.1, 4.4, 4.5, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

  - [ ] 11.3 Assert the protection, encryption, and absence invariants (I–M)
    - I: table PITR enabled flag `== var.enable_point_in_time_recovery`
    - J: `server_side_encryption.enabled == true`, no `kms_key_arn`
    - K: zero `aws_kms_key` and zero `aws_kms_alias`
    - L: zero `aws_backup_vault`/`aws_backup_plan`/`aws_backup_selection`
    - M: zero `aws_vpc`/`aws_subnet`/`aws_route_table`/`aws_route`/`aws_security_group`/`aws_vpc_endpoint`
    - _Requirements: 7.1, 7.2, 7.3, 8.2, 8.3, 8.4, 16.5_

  - [ ] 11.4 Assert the tagging, naming, deletion-protection, clean-slate, and module-file invariants (N–R)
    - N: table carries `Project`/`Environment`/`ManagedBy`/`Owner` (non-empty) plus `Name`
    - O: table `name` and every `Name` tag begin with `"${var.app_name}-${var.environment}"`
    - P: `deletion_protection_enabled == var.deletion_protection_enabled`, passed explicitly by the dev root and set to `false` in `terraform.tfvars`
    - Q: against a fresh state, N>0 to add, 0 to change, 0 to destroy, no `moved` blocks
    - R: `modules/data` contains exactly `dynamodb.tf`, `schema.tf`, `kms.tf`, `backup.tf`, `variables.tf`, `outputs.tf`; no `locals.tf`/`versions.tf`
    - Confirm 0 to change and 0 to destroy. Do NOT apply.
    - _Requirements: 1.7, 1.8, 9.2, 9.3, 12.2, 15.8, 19.1, 19.2, 19.3, 20.6, 20.7_

- [ ] 12. Final checkpoint - operator plan review before apply
  - Ensure all tests pass, ask the user if questions arise. Present the reviewed clean-slate creation plan and invariant assertions (A–R) to the operator. Applying to shared dev infrastructure is high-risk and gated on explicit operator confirmation — do NOT auto-apply. Ask the user before any `terraform apply`.

## Notes

- This is a clean-slate creation that **supersedes the withdrawn `userId`/`EmailIndex` model entirely**; nothing from that model is carried forward. `terraform plan` shows only creations against a fresh, empty state. There are NO `moved` blocks and NO state migration — the previous dev infrastructure was deleted and nothing is preserved, and no old flat-root DynamoDB resource is referenced.
- This feature is Terraform IaC, so there are no property-based test tasks — the design has no Correctness Properties that quantify over function inputs. Verification is done via `terraform fmt`/`validate`/`plan` and plan-JSON invariant assertions (A–R).
- No AWS account IDs, ARNs, KMS key IDs, region strings, or generated resource identifiers are hardcoded — all values come from variables, locals, resource references, or module outputs. No file under `modules/data` contains the literals `eruditiontx-app`, `ecs-dev`, or `us-east-1`.
- The module stays environment-independent and consumes no `aws_region` (region comes from the dev-root AWS provider); all dev-specific values live in `envs/dev/terraform.tfvars`, and `deletion_protection_enabled` is passed explicitly from the dev root (set to `false` for dev) rather than relying on the module default.
- The module directory holds exactly six `.tf` files; the `terraform {}` version block and `locals { name_prefix }` block live inside `dynamodb.tf` (no `locals.tf`, no `versions.tf`).
- Applying is gated on operator confirmation (task 12); CI runs fmt/init/validate/plan and must fail on any non-zero exit, but does not auto-apply.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1"] },
    { "id": 4, "tasks": ["2.2"] },
    { "id": 5, "tasks": ["2.3", "2.4"] },
    { "id": 6, "tasks": ["2.5"] },
    { "id": 7, "tasks": ["3.1", "3.2", "3.3", "4.1", "5.1", "6.1", "8.1", "8.2"] },
    { "id": 8, "tasks": ["9.1", "9.2"] },
    { "id": 9, "tasks": ["10.1"] },
    { "id": 10, "tasks": ["10.2"] },
    { "id": 11, "tasks": ["11.1"] },
    { "id": 12, "tasks": ["11.2", "11.3", "11.4"] }
  ]
}
```
