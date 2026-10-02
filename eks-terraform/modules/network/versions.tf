# Pin compatible Terraform and AWS provider versions so the module resolves
# predictably across environments. No major version upgrades are performed here.
terraform {
  required_version = "~> 1.16.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.67.0, < 7.0.0"
    }
  }
}
