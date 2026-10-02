# Pin Terraform and the AWS provider to the same versions as the network module
# so the dev root and its modules resolve a single compatible provider set.
terraform {
  required_version = "~> 1.16.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.67.0"
    }
  }
}
