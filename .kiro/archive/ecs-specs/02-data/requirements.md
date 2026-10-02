# Requirements Document

## Introduction

This spec covers the Terraform data module for the Erudition Solution development environment. The module
consolidates the persistent application data layer — a single DynamoDB table, its composite key schema and
secondary indexes, encryption and recovery configuration, and its data-model documentation — into a
reusable module at `ecs-terraform/modules/data/`, consumed by the Terraform root module at
`ecs-terraform/envs/dev/`.

The DynamoDB schema for this platform is a **single-table design**. Unlike a relational design that maps
each entity to its own table, the Erudition Solution application stores every entity — students, teachers,
classes, enrollments, assignments, adaptive sessions, responses, ability estimates, mastery records,
results, item content, item parameters, and audit records — in **one** DynamoDB table. The table's key
structure is driven by the 16 developer-defined access patterns the application executes, not by an
entity-to-table mapping. This design allows the application to satisfy every read pattern with a `Query` or
`GetItem` against the primary key or a secondary index, avoiding table scans and hot-path filter
expressions entirely.

This is a clean-slate, brand-new deployment. The previous development infrastructure has been intentionally
deleted, so there is no existing state to preserve and there are no resources to migrate. This spec
**supersedes any earlier `userId` partition-key and `EmailIndex` design entirely**; that design is
withdrawn and MUST NOT be carried forward. The `envs/dev` root module is the Terraform root module and the
source of truth for the development environment. Running `terraform plan` against a clean state represents
the CREATION of new development infrastructure, not a migration of existing resources. This spec MUST NOT
introduce `moved` blocks or any state-migration logic, and MUST NOT assume that any previously-defined
DynamoDB resources still exist.

The table uses a composite primary key of `PK` (partition key) and `SK` (sort key). Two global secondary
indexes serve access patterns that the primary key cannot: `GSI1` serves the item-bank candidate-selection
hot path (every answered question) and item-bank administration, and `GSI2` serves teacher reporting of
class results for an assignment. Billing uses `PAY_PER_REQUEST` (on-demand) mode so the development
environment incurs cost only for actual request volume rather than reserved capacity. Data protection uses
DynamoDB server-side encryption plus point-in-time recovery (PITR) as the baseline backup and recovery
mechanism; AWS Backup infrastructure is intentionally not introduced because PITR satisfies the development
recovery requirement at lower cost and complexity.

For the development environment, table encryption uses AWS-owned encryption, which is the lowest-cost
secure option and requires no key management. A customer-managed KMS key (CMK) is intentionally NOT created
for development, because no concrete current requirement justifies the additional per-key cost and
operational overhead. The `kms.tf` file remains documentation-only for now.

DynamoDB is a regional, fully-managed AWS service and does not run inside the VPC, so the data module has
no dependency on the network module. Downstream modules (for example the backend/ECS module) may consume
the data module's outputs; the IAM permissions that grant ECS tasks access to the table, and every
application-level DynamoDB operation and transaction, belong to the backend/application design, not to this
module. The bootstrap configuration remains separate and is responsible for creating the Terraform
remote-state infrastructure used by the development environment.

## Glossary

- **Data_Module**: The reusable Terraform module at `ecs-terraform/modules/data/`
- **Dev_Root**: The Terraform root module and source of truth for the development environment at
  `ecs-terraform/envs/dev/`
- **App_Table**: The single `aws_dynamodb_table` resource created by the Data_Module that stores all
  persistent application data for the Erudition Solution platform under a single-table design
- **Single_Table_Design**: A DynamoDB modeling approach in which every application entity is stored in one
  table, with item types distinguished by their `PK`/`SK` key patterns and an `entityType` attribute,
  rather than mapped one-entity-per-table
- **PK**: The App_Table partition key attribute (`hash_key`), a String; encodes the entity's partition
  (e.g. `STUDENT#<sid>`, `SESSION#<sessId>`, `ITEM#<itemId>`)
- **SK**: The App_Table sort key attribute (`range_key`), a String; encodes the item within a partition
  (e.g. `PROFILE`, `RESP#<seq>`, `ASSIGN#<due>#<assignId>`)
- **Composite_Key**: The `PK` + `SK` pair that forms the App_Table primary key
- **GSI**: Global Secondary Index — a DynamoDB index with its own partition (and optional sort) key that
  enables query patterns the base table key cannot serve
- **GSI1**: The item-bank global secondary index keyed by `GSI1PK` + `GSI1SK`; serves candidate-item
  selection (AP4) and item-bank administration (AP15). Only item PARAMS items carry `GSI1` keys.
- **GSI2**: The teacher-reporting global secondary index keyed by `GSI2PK` + `GSI2SK`; serves class results
  for an assignment (AP10). Only Result items carry `GSI2` keys.
- **Key_Attribute**: An attribute that participates in the table primary key or a secondary-index key;
  DynamoDB (and therefore Terraform) requires each such attribute be declared. The App_Table has exactly
  six: `PK`, `SK`, `GSI1PK`, `GSI1SK`, `GSI2PK`, `GSI2SK`, all of type String.
- **Application_Item_Field**: A non-key attribute written on items at runtime by the application (e.g.
  `studentId`, `score`, `theta`, `completedAt`, `masteryBySkill`, `entityType`); DynamoDB is schemaless for
  non-key attributes, so these are documented but NOT declared as Terraform `attribute` blocks
- **Access_Pattern (AP)**: One of the 16 developer-defined read/write operations the application performs;
  each AP is served by the primary key or a secondary index without a scan or hot-path filter
- **Projection**: The set of item attributes copied into a GSI. `GSI1` uses projection `ALL`; `GSI2` uses
  projection `INCLUDE` with a specific set of non-key attribute names
- **PITR**: Point-In-Time Recovery — the DynamoDB feature that provides continuous backups and restore to
  any second within the retention window
- **SSE**: Server-Side Encryption — DynamoDB encryption of data at rest
- **AWS_Owned_Encryption**: DynamoDB SSE using an AWS-owned key, which incurs no key-management cost and is
  the encryption method for the development environment
- **CMK**: Customer-Managed KMS Key — a KMS key created and controlled by this account; intentionally NOT
  created for the development environment
- **billing_mode**: The DynamoDB capacity mode; for the development environment this is `PAY_PER_REQUEST`
- **name_prefix**: The derived local value `"${var.app_name}-${var.environment}"` used as a consistent
  naming base for all resources

---

## Requirements

### Requirement 1: Single DynamoDB Application Table

**User Story:** As a platform engineer, I want one DynamoDB table for the entire Erudition Solution
application under a single-table design, so that every application entity is stored durably in one managed
store and every access pattern can be served by the table key or a secondary index.

#### Acceptance Criteria

1. THE Data_Module SHALL create exactly one `aws_dynamodb_table` resource (`App_Table`) representing the
   persistent application data store for all entities.
2. THE Data_Module SHALL set the App_Table `name` to a value derived from `local.name_prefix` in the form
   `"${local.name_prefix}-app"`, and SHALL NOT hardcode the final table name as a literal string.
3. THE Data_Module SHALL set the App_Table `hash_key` to the string `"PK"`.
4. THE Data_Module SHALL set the App_Table `range_key` to the string `"SK"`.
5. THE Data_Module SHALL NOT create a separate `aws_dynamodb_table` for students, teachers, sessions,
   responses, ability estimates, mastery records, results, item content, item parameters, classes,
   enrollments, assignments, or audit records; all such entities SHALL reside in the single App_Table.
6. THE Data_Module SHALL NOT create any table, index, or attribute for a "Messages" entity or a "Test
   Analysis" entity, because neither has a developer-defined access pattern.
7. THE Data_Module SHALL tag the App_Table with a `Name` tag whose value equals the App_Table `name`
   derived from `local.name_prefix`, plus the four common tag keys Project, Environment, ManagedBy, and
   Owner.
8. THE Data_Module SHALL set each of the App_Table required tag values (Name, Project, Environment,
   ManagedBy, Owner) to a non-empty string of 1 to 256 characters.
9. IF any of the App_Table required tag values (Name, Project, Environment, ManagedBy, Owner) resolves to
   an empty string, THEN THE Data_Module SHALL fail Terraform validation with an error indicating the
   missing tag value.

---

### Requirement 2: Composite Primary Key and Key Attributes

**User Story:** As a platform engineer, I want the table declared with a `PK`/`SK` composite key and only
the six key attributes, so that DynamoDB's schemaless non-key fields are not incorrectly declared in
Terraform.

#### Acceptance Criteria

1. THE Data_Module SHALL declare an `attribute` block named `"PK"` of type `"S"` (String) so the partition
   key is defined.
2. THE Data_Module SHALL declare an `attribute` block named `"SK"` of type `"S"` (String) so the sort key
   is defined.
3. THE Data_Module SHALL declare an `attribute` block named `"GSI1PK"` of type `"S"` (String) so the GSI1
   partition key is defined.
4. THE Data_Module SHALL declare an `attribute` block named `"GSI1SK"` of type `"S"` (String) so the GSI1
   sort key is defined.
5. THE Data_Module SHALL declare an `attribute` block named `"GSI2PK"` of type `"S"` (String) so the GSI2
   partition key is defined.
6. THE Data_Module SHALL declare an `attribute` block named `"GSI2SK"` of type `"S"` (String) so the GSI2
   sort key is defined.
7. THE Data_Module SHALL declare exactly six `attribute` blocks on the App_Table — `PK`, `SK`, `GSI1PK`,
   `GSI1SK`, `GSI2PK`, `GSI2SK` — because Terraform requires an `attribute` block only for attributes that
   participate in the table key or a secondary-index key.
8. THE Data_Module SHALL NOT declare an `attribute` block for any Application_Item_Field (for example
   `studentId`, `score`, `theta`, `completedAt`, `masteryBySkill`, `entityType`), because DynamoDB is
   schemaless for non-key attributes.
9. IF a non-key Application_Item_Field is declared as an `attribute` block on the App_Table, THEN THE
   Data_Module SHALL be considered non-compliant and the review SHALL flag the extra attribute.

---

### Requirement 3: GSI1 — Item-Bank Index

**User Story:** As a platform engineer, I want a global secondary index that serves candidate-item
selection and item-bank administration, so that the adaptive engine can find items by skill, grade, and
difficulty band on the every-answer hot path without scanning the table.

#### Acceptance Criteria

1. THE Data_Module SHALL create exactly one `global_secondary_index` on the App_Table named `"GSI1"`.
2. THE Data_Module SHALL set the GSI1 `hash_key` to the string `"GSI1PK"`, matching a declared `GSI1PK`
   attribute of type `"S"`.
3. THE Data_Module SHALL set the GSI1 `range_key` to the string `"GSI1SK"`, matching a declared `GSI1SK`
   attribute of type `"S"`.
4. THE Data_Module SHALL set the GSI1 `projection_type` to `"ALL"` unless the design establishes a
   narrower projection that still serves access patterns AP4 and AP15, in which case the narrower
   projection SHALL be justified in the design document.
5. WHERE the GSI1 `projection_type` is `"ALL"`, THE Data_Module SHALL NOT declare any `non_key_attributes`
   on GSI1.
6. THE Data_Module SHALL document that GSI1 keys are populated only on item PARAMS items, using the pattern
   `GSI1PK = "SKILL#<skillId>#<gradeLevel>"` and `GSI1SK = "DIFF#<zero-padded-difficulty>#<itemId>"`, so
   that candidate items can be queried by skill and grade and range-filtered by a difficulty band (AP4) and
   scanned across a wide difficulty range for administration (AP15).
7. WHERE the App_Table `billing_mode` is `"PAY_PER_REQUEST"`, THE Data_Module SHALL NOT declare
   `read_capacity` or `write_capacity` on GSI1.

---

### Requirement 4: GSI2 — Teacher-Reporting Index

**User Story:** As a platform engineer, I want a global secondary index that serves class results for an
assignment with a projection limited to reporting fields, so that teacher reporting is efficient and the
index copies only the attributes the report needs.

#### Acceptance Criteria

1. THE Data_Module SHALL create exactly one `global_secondary_index` on the App_Table named `"GSI2"`.
2. THE Data_Module SHALL set the GSI2 `hash_key` to the string `"GSI2PK"`, matching the top-level App_Table
   `attribute` block `GSI2PK` of type `"S"`.
3. THE Data_Module SHALL set the GSI2 `range_key` to the string `"GSI2SK"`, matching the top-level App_Table
   `attribute` block `GSI2SK` of type `"S"`.
4. THE Data_Module SHALL set the GSI2 `projection_type` to `"INCLUDE"`.
5. THE Data_Module SHALL set the GSI2 `non_key_attributes` list to exactly the four non-key attribute names
   `studentId`, `score`, `completedAt`, and `masteryBySkill` (in any order), and SHALL NOT include any
   additional, duplicate, or renamed non-key attribute in the GSI2 projection.
6. THE Data_Module SHALL document, in a comment adjacent to the GSI2 definition, that GSI2 keys are populated
   only on Result items using the pattern `GSI2PK = "ASSIGN#<assignmentId>"` and
   `GSI2SK = "RESULT#<studentId>"`, so that a teacher can query all results for a single assignment (AP10).
7. THE Data_Module SHALL NOT declare any of the GSI2 projection `non_key_attributes` names (`studentId`,
   `score`, `completedAt`, `masteryBySkill`) as top-level App_Table `attribute` blocks, because they are
   non-key projected attributes rather than key attributes.
8. WHERE the App_Table `billing_mode` is `"PAY_PER_REQUEST"`, THE Data_Module SHALL NOT declare
   `read_capacity` or `write_capacity` on GSI2.

---

### Requirement 5: Exactly Two Secondary Indexes

**User Story:** As a platform engineer, I want only the two secondary indexes that developer-defined access
patterns require, so that the table carries no speculative or cost-bearing index.

#### Acceptance Criteria

1. THE Data_Module SHALL create exactly two `global_secondary_index` blocks on the App_Table: `GSI1` and
   `GSI2`.
2. THE Data_Module SHALL NOT create any `local_secondary_index` on the App_Table.
3. THE Data_Module SHALL NOT create any `global_secondary_index` other than `GSI1` and `GSI2` in the
   development environment.
4. IF a secondary index is proposed that is not required by one of the 16 documented access patterns, THEN
   THE Data_Module SHALL be considered non-compliant and the review SHALL flag the extra index.

---

### Requirement 6: Billing Mode

**User Story:** As a platform engineer, I want the table to use on-demand billing in development, so that
the environment incurs cost only for actual request volume and no reserved throughput is provisioned.

#### Acceptance Criteria

1. THE Data_Module SHALL set the App_Table `billing_mode` argument to the exact string value
   `"PAY_PER_REQUEST"`.
2. THE Data_Module SHALL NOT declare a `read_capacity` argument on the App_Table, on GSI1, or on GSI2.
3. THE Data_Module SHALL NOT declare a `write_capacity` argument on the App_Table, on GSI1, or on GSI2.
4. WHERE GSIs are defined on the App_Table, THE Data_Module SHALL apply the table-level
   `"PAY_PER_REQUEST"` billing mode to those GSIs without specifying per-GSI provisioned throughput
   arguments.

---

### Requirement 7: Encryption at Rest

**User Story:** As a platform engineer, I want the table encrypted at rest using the lowest-cost secure
option in development, so that data is protected without incurring unnecessary key-management cost.

#### Acceptance Criteria

1. THE Data_Module SHALL enable DynamoDB server-side encryption on the App_Table such that the App_Table
   `server_side_encryption` block has `enabled = true`.
2. THE Data_Module SHALL configure the App_Table to use AWS-owned encryption in the development
   environment, and SHALL NOT reference a `kms_key_arn` on the App_Table `server_side_encryption` block.
3. THE Data_Module SHALL create zero `aws_kms_key` and zero `aws_kms_alias` resources in the development
   environment, such that `terraform plan` shows no KMS resource additions, modifications, or deletions.
4. THE Data_Module SHALL keep `kms.tf` documentation-only, containing comments that explain why the
   development environment uses AWS-owned encryption and under what concrete security or compliance
   requirement a customer-managed KMS key would be introduced, and containing no `aws_kms_key` or
   `aws_kms_alias` resource.

---

### Requirement 8: Point-In-Time Recovery and Backup

**User Story:** As a platform engineer, I want point-in-time recovery as the baseline backup mechanism, so
that the table can be restored after accidental writes or deletes without introducing separate backup
infrastructure.

#### Acceptance Criteria

1. THE Data_Module SHALL expose a variable `enable_point_in_time_recovery` of type `bool` with a non-empty
   description and a default value of `true`.
2. WHEN `var.enable_point_in_time_recovery` is `true`, THE Data_Module SHALL enable point-in-time recovery
   on the App_Table such that the resulting App_Table point-in-time recovery status is enabled.
3. IF `var.enable_point_in_time_recovery` is `false`, THEN THE Data_Module SHALL disable point-in-time
   recovery on the App_Table such that the resulting App_Table point-in-time recovery status is disabled.
4. THE Data_Module SHALL NOT create any `aws_backup_vault`, `aws_backup_plan`, or `aws_backup_selection`
   resource, so that point-in-time recovery remains the only recovery mechanism for the development
   environment.
5. THE Data_Module SHALL keep `backup.tf` documentation-only, containing comments that explain that PITR is
   the baseline recovery mechanism for development and that AWS Backup resources are intentionally not
   created, and containing no `aws_backup_*` resource.
6. IF `var.enable_point_in_time_recovery` is assigned any value other than `true` or `false`, THEN THE
   Data_Module SHALL fail Terraform validation before creating or modifying the App_Table, and SHALL return
   an error indicating that the variable accepts only boolean values.

---

### Requirement 9: Deletion Protection Gating

**User Story:** As a platform engineer, I want deletion protection to be configurable and off by default in
development, so that development tables can be torn down freely while the same module can protect a table in
another environment later without creating that environment now.

#### Acceptance Criteria

1. THE Data_Module SHALL expose a variable named `deletion_protection_enabled` of type `bool` with a
   non-empty description and a default value of `false`.
2. WHEN the `deletion_protection_enabled` variable resolves to `false`, THE Data_Module SHALL set the
   App_Table `deletion_protection_enabled` argument to `false` so the development table can be destroyed via
   `terraform destroy` without a protection error.
3. WHERE the `deletion_protection_enabled` variable resolves to `true`, THE Data_Module SHALL set the
   App_Table `deletion_protection_enabled` argument to `true` using only the existing variable, without any
   change to module source code.
4. IF the `deletion_protection_enabled` variable receives a value that is null or cannot be interpreted as
   a boolean, THEN THE Data_Module SHALL fail validation before apply and produce an error indicating the
   variable requires a boolean value, leaving existing infrastructure unchanged.

---

### Requirement 10: Single-Table Schema Documentation

**User Story:** As a platform engineer, I want the full single-table entity and key model documented
alongside the Terraform code, so that reviewers understand every entity's `PK`/`SK` pattern, which
attributes DynamoDB requires versus which the application writes at runtime, and how key encodings sort.

#### Acceptance Criteria

1. THE Data_Module SHALL include a `schema.tf` file that is documentation-only (comments), describing the
   single-table data model, and SHALL NOT declare any resource in `schema.tf`.
2. THE `schema.tf` documentation SHALL enumerate the `PK` and `SK` pattern for every documented entity,
   including at minimum: Student profile (`STUDENT#<sid>` / `PROFILE`), Enrollment (`STUDENT#<sid>` /
   `ENROLL#<classId>`), Assignment student view (`STUDENT#<sid>` / `ASSIGN#<due>#<assignId>`), Mastery per
   skill (`STUDENT#<sid>` / `MASTERY#<skillId>`), Result (`STUDENT#<sid>` /
   `RESULT#<completedAt>#<assignId>`), Session meta (`SESSION#<sessId>` / `META`), Ability estimate
   (`SESSION#<sessId>` / `ABILITY`), Response (`SESSION#<sessId>` / `RESP#<seq>`), Seen-items set
   (`SESSION#<sessId>` / `SEEN`), Item content (`ITEM#<itemId>` / `CONTENT`), Item parameters
   (`ITEM#<itemId>` / `PARAMS`), Class (`CLASS#<cid>` / `META`), Class roster entry (`CLASS#<cid>` /
   `STUDENT#<sid>`), Class assignment (`CLASS#<cid>` / `ASSIGN#<assignId>`), Teacher profile
   (`TEACHER#<tid>` / `PROFILE`), Teacher's classes (`TEACHER#<tid>` / `CLASS#<cid>`), and Audit record
   (`AUDIT#<sid>` / `<timestamp>#<actorId>`).
3. THE `schema.tf` documentation SHALL describe the GSI1 key encoding as
   `GSI1PK = "SKILL#<skillId>#<gradeLevel>"` and `GSI1SK = "DIFF#<zero-padded-difficulty>#<itemId>"`,
   populated only on item PARAMS items.
4. THE `schema.tf` documentation SHALL describe the GSI2 key encoding as `GSI2PK = "ASSIGN#<assignmentId>"`
   and `GSI2SK = "RESULT#<studentId>"`, populated only on Result items, with an INCLUDE projection of
   `studentId`, `score`, `completedAt`, and `masteryBySkill`.
5. THE `schema.tf` documentation SHALL describe the difficulty encoding rule as
   `"DIFF#" + zero-pad((b + 3.0) * 100, width 4)`, giving worked examples `b = -3.0 → DIFF#0000`,
   `b = 0.0 → DIFF#0300`, and `b = +3.0 → DIFF#0600`, and SHALL state that this zero-padded string encoding
   makes lexical string sort order equal numeric difficulty order.
6. THE `schema.tf` documentation SHALL state the key-construction conventions: the `#` character separates
   key segments, sortable numeric values are zero-padded to a fixed width, timestamps use ISO-8601 format
   so they sort correctly as strings, and every item carries an `entityType` attribute as an application
   convention that is NOT a Terraform-declared key attribute.
7. THE `schema.tf` documentation SHALL distinguish among three labeled categories: (a) the DynamoDB
   Key_Attributes declared in Terraform (`PK`, `SK`, `GSI1PK`, `GSI1SK`, `GSI2PK`, `GSI2SK`), (b) the
   Terraform-managed indexes (`GSI1`, `GSI2`), and (c) the schemaless Application_Item_Field values written
   by the application at runtime, naming representative fields in each category.

---

### Requirement 11: Access-Pattern Traceability

**User Story:** As a platform engineer, I want each of the 16 developer-defined access patterns mapped to
the key or index that serves it, so that reviewers can confirm no access pattern requires a table scan or a
hot-path filter expression.

#### Acceptance Criteria

1. THE Data_Module documentation SHALL map each of the following 16 access patterns to the primary key or
   secondary index that serves it: AP1 session state — Query `PK = SESSION#<id>`; AP2 write response —
   PutItem `PK = SESSION#<id>`, `SK = RESP#<seq>`; AP3 read/update ability — Get/Update
   `PK = SESSION#<id>`, `SK = ABILITY` (strongly consistent); AP4 candidate items — Query GSI1
   `GSI1PK = SKILL#<s>#<g>`, `GSI1SK` BETWEEN a difficulty band; AP5 one item — Query `PK = ITEM#<id>`
   returning CONTENT and PARAMS; AP6 all responses in order — Query `PK = SESSION#<id>`, `SK` begins_with
   `RESP#`; AP7 student profile — GetItem `PK = STUDENT#<id>`, `SK = PROFILE`; AP8 student's assignments
   newest first — Query `PK = STUDENT#<id>`, `SK` begins_with `ASSIGN#`, `ScanIndexForward = false`; AP9
   students in a class — Query `PK = CLASS#<id>`, `SK` begins_with `STUDENT#`; AP10 class results for an
   assignment — Query GSI2 `GSI2PK = ASSIGN#<id>`; AP11 student's results over time — Query
   `PK = STUDENT#<id>`, `SK` begins_with `RESULT#`; AP12 mastery by skill — Query `PK = STUDENT#<id>`, `SK`
   begins_with `MASTERY#`; AP13 teacher's classes — Query `PK = TEACHER#<id>`, `SK` begins_with `CLASS#`;
   AP14 class's assignments — Query `PK = CLASS#<id>`, `SK` begins_with `ASSIGN#`; AP15 item bank admin —
   Query GSI1 over a difficulty range spanning the full defined difficulty band (minimum to maximum
   `GSI1SK` value); AP16 audit trail — Query `PK = AUDIT#<studentId>`.
2. THE Data_Module documentation SHALL map all 16 access patterns (AP1 through AP16) with no access pattern
   left unmapped, and each mapped access pattern SHALL identify exactly one serving construct that is one of:
   the base table primary key (`PK`/`SK`), `GSI1`, or `GSI2`.
3. THE Data_Module SHALL define no key or secondary index whose sole purpose is an access pattern not
   present in the 16 documented access patterns (AP1 through AP16).
4. THE Data_Module documentation SHALL state that every one of the 16 documented access patterns is served
   by exactly one of the operations `Query`, `GetItem`, `PutItem`, or `UpdateItem` acting on `PK`/`SK` or a
   GSI key, and that no documented access pattern relies on a table `Scan` operation or on a filter
   expression to select items on a read path.
5. WHERE an access pattern requires a range read within a partition (AP4, AP6, AP8, AP11, AP12, AP14, AP15),
   THE Data_Module documentation SHALL specify that the range is expressed using a sort-key range condition
   (`begins_with` or `BETWEEN`) and SHALL NOT use a filter expression to define that range.
6. IF any of the 16 access patterns cannot be mapped to a `PK`/`SK` or GSI key condition without a table
   `Scan` or a read-path filter expression, THEN THE Data_Module documentation SHALL identify that access
   pattern by its AP identifier and record it as an unresolved design gap so that reviewers detect the
   missing key or index during review.

---

### Requirement 12: Module Structure

**User Story:** As a platform engineer, I want the data module organized into exactly the descriptive files
this design requires, so that the configuration is readable while Terraform still loads it as a single
module and no speculative organizational files are added.

#### Acceptance Criteria

1. THE Data_Module SHALL reside at the path `ecs-terraform/modules/data/` and SHALL be a self-contained
   Terraform module that declares no `backend` block, receiving any required provider configuration from
   the calling root module.
2. THE Data_Module directory SHALL contain exactly these six `.tf` files: `dynamodb.tf`, `schema.tf`,
   `kms.tf`, `backup.tf`, `variables.tf`, and `outputs.tf`, and SHALL NOT contain a separate `locals.tf` or
   `versions.tf` file added merely for organization.
3. WHERE Terraform and AWS provider version constraints are needed, THE Data_Module SHALL place a single
   `terraform { required_version = ...; required_providers { ... } }` block inside `dynamodb.tf`, because a
   version-constraint block is technically necessary and is therefore permitted in that file.
4. WHERE a `name_prefix` derivation is needed, THE Data_Module SHALL place the `locals` block inside
   `dynamodb.tf` rather than in a separate `locals.tf` file.
5. THE Data_Module SHALL add a `.tf` file beyond the six named files only where the additional file is
   technically necessary, and SHALL NOT add one purely for organizational preference.
6. THE Data_Module SHALL remain environment-independent, containing no hardcoded literal values for AWS
   account IDs, ARNs, region identifiers, resource names, generated resource identifiers, or ownership
   tags, deriving all such values from input variables, locals, resource references, or data sources.

---

### Requirement 13: Module Variables

**User Story:** As a platform engineer, I want the data module to declare all inputs as typed, described
variables with validation where appropriate, so that misconfigured module calls fail at plan time with
informative errors.

#### Acceptance Criteria

1. THE Data_Module SHALL declare a variable `app_name` of type `string` with a non-empty description and a
   validation rule that rejects an empty or whitespace-only value.
2. THE Data_Module SHALL declare a variable `environment` of type `string` with a non-empty description and
   a validation rule that rejects an empty or whitespace-only value.
3. THE Data_Module SHALL declare a variable `tags` of type `map(string)` with a non-empty description and
   `default = {}`, allowing the caller to supply the common tag set (Project, Environment, ManagedBy,
   Owner).
4. THE Data_Module SHALL declare a variable `enable_point_in_time_recovery` of type `bool` with a non-empty
   description and a default of `true`.
5. THE Data_Module SHALL declare a variable `deletion_protection_enabled` of type `bool` with a non-empty
   description and a default of `false`.
6. THE Data_Module SHALL NOT hardcode AWS account IDs, ARNs, KMS key IDs, generated resource identifiers,
   or environment-specific resource names in variable defaults or resource arguments.
7. THE Data_Module SHALL declare additional variables only where a concrete configuration need in this spec
   consumes them, and SHALL NOT introduce speculative variables.
8. THE Data_Module SHALL NOT declare an `aws_region` variable or otherwise consume a region value, because
   region selection belongs to the AWS provider configured in `envs/dev/providers.tf`; the module inherits
   the provider from the Dev_Root and SHALL NOT configure its own provider or region.

---

### Requirement 14: Module Outputs

**User Story:** As a platform engineer, I want the data module to expose only the identifiers downstream
modules need, so that the backend module can reference the table without hardcoding any names or ARNs.

#### Acceptance Criteria

1. THE Data_Module SHALL output `dynamodb_table_name` containing the App_Table name as a non-empty string
   derived from the DynamoDB table resource reference, with a description string of at least 1 character.
2. THE Data_Module SHALL output `dynamodb_table_arn` containing the App_Table ARN as a non-empty string
   derived from the DynamoDB table resource reference, with a description string of at least 1 character.
3. THE Data_Module SHALL output `dynamodb_table_id` containing the App_Table ID as a non-empty string
   derived from the DynamoDB table resource reference, with a description string of at least 1 character.
4. WHERE a downstream component requires a GSI name to build an IAM resource ARN or query, THE Data_Module
   SHALL output the required GSI name (`GSI1` and/or `GSI2`) as a non-empty string with a description of at
   least 1 character.
5. IF no downstream component requires a GSI name, THEN THE Data_Module SHALL declare no output exposing
   GSI names.
6. THE Data_Module SHALL restrict its declared outputs to `dynamodb_table_name`, `dynamodb_table_arn`,
   `dynamodb_table_id`, and any conditionally-required GSI name outputs, and SHALL declare no output
   containing secret or sensitive values.
7. THE Data_Module SHALL set the `sensitive` attribute to false for every output that exposes a non-secret
   identifier.

---

### Requirement 15: Dev Root Integration

**User Story:** As a platform engineer, I want the `envs/dev` root module to call the data module with
values from `terraform.tfvars`, so that the dev data layer is created from a single source of truth.

#### Acceptance Criteria

1. THE Dev_Root SHALL contain exactly one `module "data"` block in `envs/dev/main.tf` whose `source`
   argument equals the relative path `../../modules/data`.
2. THE Dev_Root SHALL pass the arguments `app_name`, `environment`, `tags`,
   `enable_point_in_time_recovery`, and `deletion_protection_enabled` into the `module "data"` block,
   where each argument value references a corresponding Dev_Root input variable rather than a literal.
   THE Dev_Root SHALL NOT pass `aws_region` into the `module "data"` block, because the module does not
   consume a region; region selection belongs to the AWS provider configured in `envs/dev/providers.tf`.
   THE Dev_Root SHALL pass `deletion_protection_enabled` explicitly rather than relying on the data
   module's default, because deletion protection is an environment-level configuration choice that
   MUST be visible in the dev root.
3. THE Dev_Root SHALL pass a `tags` map into the `module "data"` block that contains the keys `Project`,
   `Environment`, `ManagedBy`, and `Owner`, each mapped to a string value of length 1 to 256 characters.
4. THE Dev_Root SHALL declare the input variables referenced by the `module "data"` block in
   `envs/dev/variables.tf`, where each declaration includes an explicit `type`, a `description` of length 1
   to 512 characters, and a default value whose type matches the declared `type`.
5. THE Dev_Root SHALL supply the following values in `envs/dev/terraform.tfvars`:
   `app_name = "eruditiontx-app"`, `environment = "ecs-dev"`, `aws_region = "us-east-1"`, and
   `deletion_protection_enabled = false`, so that the development table can be destroyed freely and the
   environment-level deletion-protection choice is explicit in the dev root.
6. THE Dev_Root SHALL re-export the data module's outputs (at minimum `dynamodb_table_name`,
   `dynamodb_table_arn`, and `dynamodb_table_id`) as Dev_Root outputs so downstream modules and operators
   can consume them.
7. IF a `terraform validate` is executed against `envs/dev` and any required data-module argument in the
   `module "data"` block is absent or references an undeclared variable, THEN THE Dev_Root SHALL fail
   validation with an error indicating the missing argument or undeclared variable.
8. THE Data_Module SHALL contain no literal occurrences of the strings `eruditiontx-app`, `ecs-dev`, or
   `us-east-1` in any file under `modules/data`, so that all development-specific values are supplied by
   `envs/dev/terraform.tfvars`.
9. THE Dev_Root SHALL declare a `deletion_protection_enabled` input variable of type `bool` with a
   non-empty description in `envs/dev/variables.tf`, and SHALL pass it into the `module "data"` block
   in `envs/dev/main.tf`, so the environment-level deletion-protection choice is set explicitly in the
   dev root rather than inherited silently from the data module default.

---

### Requirement 16: Module Boundary and Dependency Direction

**User Story:** As a platform engineer, I want the data module scoped to owning only the table and its
data-model concerns and independent of the network module, so that responsibilities stay clear and no
circular dependency is possible.

#### Acceptance Criteria

1. THE Data_Module SHALL own only the DynamoDB table, its primary key and GSI definitions, its PITR
   configuration, its encryption configuration, its deletion-protection configuration, its schema/data-model
   documentation, and its data-related outputs.
2. THE Data_Module SHALL NOT define IAM roles, IAM policies, or IAM policy attachments that grant ECS tasks
   or any other workload access to the App_Table, because those permissions belong to the backend/IAM
   design.
3. THE Data_Module SHALL NOT define ECS, ECR, ALB, CloudFront, S3, Route 53, or any application
   business-logic resource, and SHALL NOT perform application-level DynamoDB operations or transactions.
4. THE Data_Module SHALL NOT reference any output, resource, or variable of the network module, and SHALL
   NOT accept any input variable whose value is sourced from a network-module output.
5. THE Data_Module SHALL create zero `aws_vpc`, `aws_subnet`, `aws_route_table`, `aws_route`,
   `aws_security_group`, and `aws_vpc_endpoint` resources.
6. WHEN `terraform validate` is run against a configuration containing only the data module, THE
   Data_Module SHALL exit with code 0 and report zero errors, demonstrating it plans without the network
   module present.
7. WHERE a later module (for example the backend module) needs the table, THE dependency direction SHALL be
   data → backend, and the Data_Module SHALL contain zero references to any consumer module, avoiding
   circular dependencies.

---

### Requirement 17: Security and Least Privilege

**User Story:** As a platform engineer, I want the data layer private and free of embedded secrets, so that
access is granted only through IAM and no credentials live in the Terraform configuration.

#### Acceptance Criteria

1. THE Data_Module SHALL create the App_Table with no resource-based policy granting access to principal
   `"*"`, such that the table is reachable only through AWS IAM-authorized API calls.
2. THE Data_Module SHALL NOT store application secrets, credentials, or connection strings as plaintext
   literals in Terraform configuration, input variable defaults, locals, or the table definition.
3. WHEN any input variable is defined to accept a secret, credential, or connection string, THE Data_Module
   SHALL declare that variable with `sensitive = true` and provide no default value.
4. THE Data_Module SHALL enable encryption at rest for the App_Table (per Requirement 7) so that all stored
   data is encrypted.
5. THE Data_Module SHALL create only AWS resources traceable to a stated requirement in this specification,
   and SHALL NOT create any AWS resource that is not referenced by a stated requirement.

---

### Requirement 18: Cost Consciousness

**User Story:** As a platform engineer, I want the data module to prefer the lowest-cost secure options in
development, so that recurring charges stay minimal and any cost-bearing resource is documented.

#### Acceptance Criteria

1. THE Data_Module SHALL use `PAY_PER_REQUEST` billing mode (per Requirement 6) rather than provisioned
   capacity for the development environment.
2. THE Data_Module SHALL use AWS-owned encryption (per Requirement 7) rather than creating a customer-managed
   KMS key that incurs a recurring per-key charge.
3. THE Data_Module SHALL NOT create AWS Backup vaults, backup plans, or backup selections (per
   Requirement 8), relying on point-in-time recovery as the baseline recovery mechanism.
4. THE Data_Module SHALL set the GSI2 projection to `INCLUDE` with only the four attributes teacher
   reporting requires (per Requirement 4), rather than projecting `ALL`, to limit index storage and write
   amplification cost.
5. THE Data_Module SHALL include, in Terraform comments adjacent to each resource or feature that
   introduces a recurring cost (including PITR), a note identifying the item as cost-bearing so reviewers
   can assess cost impact.

---

### Requirement 19: Naming and Tagging Consistency

**User Story:** As a platform engineer, I want all data resources to use a consistent naming scheme derived
from a single `local.name_prefix` value and to carry common tags, so that resources are easy to identify
and costs can be attributed.

#### Acceptance Criteria

1. THE Data_Module SHALL define a local value `name_prefix` computed as
   `"${var.app_name}-${var.environment}"` and SHALL use it as the base for the App_Table name and every
   resource `Name` tag.
2. THE Data_Module SHALL merge `var.tags` into each taggable resource's tag map such that the
   caller-supplied common tags (Project, Environment, ManagedBy, Owner) are present on every taggable
   resource, and SHALL NOT override any caller-supplied tag key with a module-internal value except the
   resource-specific `Name` tag.
3. THE Data_Module SHALL derive all resource names solely by referencing `local.name_prefix` and SHALL NOT
   compute `"${var.app_name}-${var.environment}"` inline in any resource definition.
4. IF `var.app_name` is an empty string or contains only whitespace, THEN THE Data_Module SHALL fail
   variable validation with an error indicating that `app_name` is invalid before creating or modifying any
   resource.
5. IF `var.environment` is an empty string or contains only whitespace, THEN THE Data_Module SHALL fail
   variable validation with an error indicating that `environment` is invalid before creating or modifying
   any resource.
6. THE Data_Module SHALL use snake_case for the identifiers of all Terraform resources, variables, locals,
   and outputs defined within the module.

---

### Requirement 20: Terraform Quality and Clean-Slate Plan

**User Story:** As a platform engineer, I want the module and dev root to pass Terraform formatting,
initialization, validation, and planning as a clean-slate creation, so that CI passes and the plan shows no
destruction.

#### Acceptance Criteria

1. WHEN `terraform fmt -recursive` is run against `ecs-terraform/modules/data/`, THE Data_Module SHALL
   produce zero formatting diff and the command SHALL exit with code 0.
2. IF `terraform fmt -check -recursive` is run against `ecs-terraform/modules/data/` and one or more files
   are not correctly formatted, THEN THE Data_Module CI check SHALL exit with a non-zero code and indicate
   which files require formatting.
3. WHEN `terraform fmt -recursive` is run against `ecs-terraform/envs/dev/`, THE Dev_Root SHALL produce
   zero formatting diff and the command SHALL exit with code 0.
4. WHEN `terraform validate` is run against the Dev_Root after a successful `terraform init`, THE Dev_Root
   SHALL exit with code 0 and report 0 errors related to the data module.
5. THE Data_Module SHALL pin Terraform with a `required_version` constraint and pin the AWS provider with a
   `~>` constraint consistent with the existing project provider version, and SHALL NOT introduce a major
   version increment of either Terraform or the AWS provider relative to the existing project pins.
6. THE Data_Module and Dev_Root SHALL NOT contain any `moved` block or state-migration logic, because this
   is a clean-slate creation.
7. WHEN `terraform plan` is run against an empty state after a successful `terraform init`, THE Dev_Root
   SHALL produce a plan for the data module reporting a count of N resources to add where N is greater than
   0, exactly 0 resources to change, and exactly 0 resources to destroy.

---

## Out of Scope

The following belong to later specs and MUST NOT be implemented by the data module: ECS, ECR, ALB,
CloudFront, S3 frontend, Route 53, Jenkins, WAF, GuardDuty, CloudTrail, and AWS Config. IAM permissions
that grant ECS tasks access to the DynamoDB table, and all application-level DynamoDB operations and
transactions, belong to the backend/application design, not to this module. Separate per-entity tables, a
"Messages" entity, and a "Test Analysis" entity are explicitly excluded because they either contradict the
single-table design or have no developer-defined access pattern. Customer-managed KMS keys and AWS Backup
resources are excluded from the development environment; `kms.tf` and `backup.tf` remain documentation-only.
Staging and production environments are out of scope.

---

## Correctness Properties

These are testable infrastructure invariants for the data module. Because this feature is declarative
Terraform IaC, these properties are verified with `terraform validate`, `terraform plan`, analysis of
`terraform plan -json` output, or AWS configuration inspection after deployment — not with property-based
application tests. Property-based testing does not apply to declarative IaC. Each property is an assertion
over the plan or the deployed resource.

1. **Single-table invariant**: The plan contains exactly one `aws_dynamodb_table` resource and no
   per-entity DynamoDB table.
2. **Billing-mode invariant**: The App_Table `billing_mode` in the plan equals `"PAY_PER_REQUEST"`, and no
   `read_capacity`/`write_capacity` is present on the table, GSI1, or GSI2.
3. **Composite-key invariant**: The App_Table `hash_key` equals `"PK"` and `range_key` equals `"SK"`.
4. **Six-attribute invariant**: The App_Table declares exactly six `attribute` blocks — `PK`, `SK`,
   `GSI1PK`, `GSI1SK`, `GSI2PK`, `GSI2SK` — each of type `"S"`, and declares no `attribute` block for any
   application item field.
5. **Two-GSI invariant**: The plan declares exactly two global secondary indexes: `GSI1` (keys `GSI1PK` /
   `GSI1SK`, projection `ALL`) and `GSI2` (keys `GSI2PK` / `GSI2SK`, projection `INCLUDE`), and no local
   secondary index.
6. **GSI2-projection invariant**: The GSI2 projection type is `INCLUDE` and its `non_key_attributes` list
   equals exactly `studentId`, `score`, `completedAt`, `masteryBySkill` with no additional attributes.
7. **PITR-matches-config invariant**: The App_Table PITR enabled flag in the plan equals the value of
   `var.enable_point_in_time_recovery`.
8. **Encryption invariant**: The App_Table has server-side encryption enabled in the plan/deployed
   configuration.
9. **No-CMK invariant**: In the development environment the plan contains zero `aws_kms_key` and zero
   `aws_kms_alias` resources.
10. **No-AWS-Backup invariant**: The plan contains zero `aws_backup_vault`, `aws_backup_plan`, and
    `aws_backup_selection` resources.
11. **No-network-resources invariant**: The data module plan contains no `aws_vpc`, `aws_subnet`,
    `aws_route_table`, `aws_route`, `aws_security_group`, or `aws_vpc_endpoint` resources.
12. **Required-tags invariant**: The App_Table carries the tag keys `Project`, `Environment`, `ManagedBy`,
    and `Owner`, each with a non-empty value, plus a `Name` tag.
13. **Naming-prefix invariant**: The App_Table name and every `Name` tag value begin with
    `"${var.app_name}-${var.environment}"`, and no two distinct resources share the same `Name` tag value.
14. **Deletion-protection-matches-config invariant**: The App_Table `deletion_protection_enabled` argument
    in the plan equals the value of `var.deletion_protection_enabled`. The Dev_Root passes this value
    explicitly from its own `deletion_protection_enabled` variable, which is set to `false` in
    `envs/dev/terraform.tfvars` for the development environment, so the planned value is `false` and does
    not rely on the data module default.
15. **No-hardcoded-identifiers invariant**: The module source contains no literal AWS account IDs, ARNs,
    KMS key IDs, or environment-specific resource names; all such values derive from variables, locals, or
    resource references.
16. **Clean-slate invariant**: A `terraform plan` for the data module against a fresh, empty state shows
    only resource creations — 0 to change and 0 to destroy — with no `moved` blocks.
17. **Module-file invariant**: The `modules/data` directory contains exactly the six files `dynamodb.tf`,
    `schema.tf`, `kms.tf`, `backup.tf`, `variables.tf`, and `outputs.tf`, with no `locals.tf` or
    `versions.tf` added for organization.
