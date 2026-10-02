# Default-region AWS provider for the dev root.
# Credentials are supplied by the environment (IAM role / profile / env vars),
# never hardcoded here. The aws.us_east_1 alias for ACM/CloudFront is deferred
# to the edge module and is intentionally not declared for the network spec.
provider "aws" {
  region = var.aws_region

  # Common tags applied to every taggable resource. These complement the
  # explicit per-resource Name tags and the var.tags passed into modules.
  default_tags {
    tags = {
      Project     = var.app_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = var.owner
    }
  }
}
