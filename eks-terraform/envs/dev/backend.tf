# ---------------------------------------------------------------------------
# Terraform Remote State Backend (Dev Root)
#
# The S3 state bucket and lock configuration are created by the separate
# bootstrap configuration (out of scope for this root). Never create the
# backend bucket from this state — that would be a circular dependency.
#
# Backend settings are supplied at init time via -backend-config so that no
# account-specific bucket name is hardcoded here. The dev state is stored
# under the key produced by bootstrap: eks-dev/terraform.tfstate
#
# One-time setup:
#   1. Provision remote state via the bootstrap configuration.
#   2. terraform init -backend-config=backend.config
#
# On first init this root starts from a fresh, empty state, so the first
# plan/apply creates all development infrastructure from scratch.
# ---------------------------------------------------------------------------

terraform {
  backend "s3" {}
}
