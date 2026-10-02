# ---------------------------------------------------------------------------
# Bootstrap — Terraform Remote State Infrastructure
#
# Run this ONCE before using the main Terraform configuration.
# This config uses local state intentionally — it creates the S3 bucket
# that will store the main config's remote state.
#
# Usage:
#   cd bootstrap
#   AWS_PROFILE=charltonecs terraform init
#   AWS_PROFILE=charltonecs terraform apply
#
# After apply, copy the output bucket name into backend.config.
# Do NOT run terraform destroy on this config while remote state is in use.
# ---------------------------------------------------------------------------

terraform {
  required_version = "~>1.16.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.67.0"
    }
  }
  # Intentionally local state — this config bootstraps remote state for others.
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Project   = var.app_name
      ManagedBy = "Terraform"
      Owner     = "Charlton Cagigas"
      Purpose   = "terraform-state-bootstrap"
    }
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS CLI profile to use"
  type        = string
  default     = "charltonecs"
}

variable "app_name" {
  description = "Application name — used to name the state bucket"
  type        = string
  default     = "eruditiontx-app"
}

variable "environment" {
  description = "Environment — used to name the state bucket"
  type        = string
  default     = "eks-dev"
}

# ---------------------------------------------------------------------------
# S3 — Terraform state bucket
#
# Account ID is included in the bucket name to guarantee global uniqueness.
# ---------------------------------------------------------------------------
data "aws_caller_identity" "current" {}

locals {
  account_id   = data.aws_caller_identity.current.account_id
  state_bucket = "${var.app_name}-${var.environment}-tfstate-${local.account_id}"
}

resource "aws_s3_bucket" "tfstate" {
  bucket        = local.state_bucket
  force_destroy = false # Protect against accidental deletion of state

  tags = {
    Name = local.state_bucket
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# No public access to state — ever.
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------------------------------------------------------------------
# Outputs — copy the bucket name into backend.config
# ---------------------------------------------------------------------------
output "state_bucket_name" {
  description = "S3 bucket name for Terraform state — set as 'bucket' in backend.config"
  value       = aws_s3_bucket.tfstate.id
}

output "aws_region" {
  description = "AWS region where the state bucket was created"
  value       = var.aws_region
}
