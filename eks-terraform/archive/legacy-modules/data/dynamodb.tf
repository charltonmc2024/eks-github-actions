# dynamodb.tf

# A version-constraint block is technically necessary, so it is permitted here rather
# than creating a separate versions.tf (project standard: no organizational-only files).
terraform {
  required_version = "~> 1.16.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.67.0, < 7.0.0"
    }
  }
}

# name_prefix lives here rather than in a separate locals.tf (project standard).
locals {
  name_prefix = "${var.app_name}-${var.environment}"
}

# Single-table design: every application entity is stored in this one table.
# Item types are distinguished by PK/SK patterns and an application-level entityType
# attribute. See schema.tf for the full entity/key model and access-pattern mapping.
resource "aws_dynamodb_table" "app" {
  name = "${local.name_prefix}-app"

  # On-demand billing: pay only for actual request volume. No provisioned throughput
  # anywhere on the table or its GSIs, so no read_capacity/write_capacity is declared. (cost note)
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "PK"
  range_key = "SK"

  # AWS provider v6.67: the GSIs declare their keys with key_schema blocks (attribute_name
  # + key_type), which replaces the deprecated GSI-level hash_key/range_key. The table's own
  # primary key still uses the top-level hash_key/range_key arguments (PK = HASH, SK = RANGE):
  # provider 6.67 does not accept a top-level key_schema block for the table itself.

  # Only the six key attributes are declared; every non-key field is schemaless and
  # written by the application at runtime (see schema.tf).
  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  attribute {
    name = "GSI1SK"
    type = "S"
  }
  attribute {
    name = "GSI2PK"
    type = "S"
  }
  attribute {
    name = "GSI2SK"
    type = "S"
  }

  # GSI1 — item-bank index. Keys populated only on item PARAMS items:
  #   GSI1PK = "SKILL#<skillId>#<gradeLevel>"
  #   GSI1SK = "DIFF#<zero-padded-difficulty>#<itemId>"
  # Serves AP4 (candidate items by skill+grade, difficulty BETWEEN band) and
  # AP15 (item-bank admin over the full difficulty range). Projection ALL so the
  # adaptive engine gets full item parameters without a follow-up read.
  global_secondary_index {
    name = "GSI1"
    key_schema {
      attribute_name = "GSI1PK"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "GSI1SK"
      key_type       = "RANGE"
    }
    projection_type = "ALL"
    # No non_key_attributes with projection_type ALL.
    # No read_capacity/write_capacity: table is PAY_PER_REQUEST.
  }

  # GSI2 — teacher-reporting index. Keys populated only on Result items:
  #   GSI2PK = "ASSIGN#<assignmentId>"
  #   GSI2SK = "RESULT#<studentId>"
  # Serves AP10 (all results for one assignment). INCLUDE projection limits index
  # storage and write amplification to exactly the reporting fields. (cost note)
  global_secondary_index {
    name = "GSI2"
    key_schema {
      attribute_name = "GSI2PK"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "GSI2SK"
      key_type       = "RANGE"
    }
    projection_type    = "INCLUDE"
    non_key_attributes = ["studentId", "score", "completedAt", "masteryBySkill"]
  }

  # Point-in-time recovery is the baseline recovery mechanism. PITR is cost-bearing. (cost note)
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # AWS-owned encryption: enabled, no kms_key_arn. Lowest-cost secure option for dev.
  server_side_encryption {
    enabled = true
  }

  # Off by default in dev so the table can be torn down freely; the same variable can
  # protect a table in another environment later with no module source change.
  deletion_protection_enabled = var.deletion_protection_enabled

  tags = merge(var.tags, { Name = "${local.name_prefix}-app" })
}
