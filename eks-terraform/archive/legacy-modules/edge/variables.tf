# Input variables for the reusable edge module. Every input is explicitly typed
# and described; validation catches misconfiguration at plan/validate time rather
# than surfacing cryptic errors during apply.
#
# The module is environment-independent and consumes only what it needs from the
# Dev_Root: the app/environment naming inputs, common tags, and the internal ALB
# identifiers exposed by the backend module (alb_arn, alb_dns_name). Region comes
# from the AWS provider configured in envs/dev/providers.tf (inherited), so there
# is NO aws_region input. There are deliberately NO Route 53, hosted-zone,
# domain-name, ACM certificate, WAF, VPC Origin id, subnet, or security-group
# inputs: DEV uses the default *.cloudfront.net domain, and the CloudFront VPC
# Origin is created inside this module from var.alb_arn rather than passed in.
# No generated AWS identifier is hardcoded here.

variable "app_name" {
  description = "Application name used as the first segment of the resource name prefix."
  type        = string

  validation {
    condition     = length(trimspace(var.app_name)) > 0
    error_message = "app_name must be a non-empty, non-whitespace string."
  }
}

variable "environment" {
  description = "Environment name used as the second segment of the resource name prefix (e.g. ecs-dev)."
  type        = string

  validation {
    condition     = length(trimspace(var.environment)) > 0
    error_message = "environment must be a non-empty, non-whitespace string."
  }
}

variable "tags" {
  description = "Common tags applied to taggable resources (e.g. Project, Environment, ManagedBy, Owner)."
  type        = map(string)
  default     = {}
}

variable "alb_arn" {
  description = "ARN of the internal ALB from module.backend.alb_arn, used as the endpoint/target of the edge-created CloudFront VPC Origin (consumed only; no ALB is created)."
  type        = string

  validation {
    condition     = length(trimspace(var.alb_arn)) > 0
    error_message = "alb_arn must be a non-empty string (the internal ALB ARN from module.backend.alb_arn)."
  }
}

variable "alb_dns_name" {
  description = "DNS name of the internal ALB from module.backend.alb_dns_name, used as the CloudFront API origin domain_name (consumed only)."
  type        = string

  validation {
    condition     = length(trimspace(var.alb_dns_name)) > 0
    error_message = "alb_dns_name must be a non-empty string (the internal ALB DNS name from module.backend.alb_dns_name)."
  }
}

variable "alb_http_port" {
  description = "HTTP port the CloudFront VPC Origin uses to reach the internal ALB, matching the ALB HTTP listener port."
  type        = number
  default     = 80

  validation {
    condition     = var.alb_http_port >= 1 && var.alb_http_port <= 65535
    error_message = "alb_http_port must be within the valid TCP port range of 1-65535."
  }
}
