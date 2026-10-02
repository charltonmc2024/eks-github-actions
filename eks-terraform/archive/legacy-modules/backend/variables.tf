# Module input variables for the backend module.
#
# The module is environment-independent: it accepts typed, validated inputs and
# derives all resource names from local.name_prefix. No AWS account IDs, ARNs,
# region strings, subnet IDs, security-group IDs, or ECR URLs are declared here.
# Region is NOT a module input — it comes from the AWS provider configured in
# envs/dev/providers.tf, which this module inherits from the calling root.
#
# DEV runs HTTP end to end from the CloudFront VPC Origin to the internal ALB, so
# no TLS/certificate input is declared (no listener_certificate_arn).

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

variable "vpc_id" {
  description = "VPC ID from module.network.vpc_id where the ALB and ECS security groups are created."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs from module.network.private_subnet_ids for the internal ALB and ECS tasks."
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "private_subnet_ids must contain at least two subnet IDs for ALB and ECS multi-AZ placement."
  }
}

variable "dynamodb_table_name" {
  description = "DynamoDB App_Table name from module.data.dynamodb_table_name (consumed only; no table is created)."
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB App_Table ARN from module.data.dynamodb_table_arn. Index ARNs are derived as the table ARN plus /index/* (consumed only)."
  type        = string
}

variable "container_port" {
  description = "Container port used consistently by the task definition, target group, and ECS security group ingress."
  type        = number
  default     = 3000

  validation {
    condition     = var.container_port >= 1 && var.container_port <= 65535
    error_message = "container_port must be within the valid TCP port range of 1–65535."
  }
}

variable "health_check_path" {
  description = "HTTP path the ALB target group uses for container health checks."
  type        = string
  default     = "/"
}

variable "image_tag" {
  description = "Immutable application image tag supplied at deploy time (e.g. a Git SHA or build number); not solely 'latest'."
  type        = string
}

variable "task_cpu" {
  description = "Fargate task CPU units (cost-conscious DEV default)."
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate task memory in MiB (cost-conscious DEV default)."
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of running ECS service tasks (cost-conscious DEV default)."
  type        = number
  default     = 1
}

variable "min_capacity" {
  description = "Autoscaling floor: minimum number of ECS service tasks."
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Autoscaling ceiling: maximum number of ECS service tasks."
  type        = number
  default     = 2
}

variable "cpu_target" {
  description = "Target-tracking average CPU utilization percentage for ECS service autoscaling."
  type        = number
  default     = 60
}

variable "log_retention_days" {
  description = "Explicit CloudWatch Logs retention in days for the application log group (cost-conscious DEV default)."
  type        = number
  default     = 14
}

variable "image_tag_mutability" {
  description = "ECR repository image tag mutability (MUTABLE for DEV, tunable to IMMUTABLE)."
  type        = string
  default     = "MUTABLE"
}

variable "alb_listener_port" {
  description = "HTTP listener port on the internal ALB, also used as the CloudFront VPC Origin http_port."
  type        = number
  default     = 80
}

variable "app_secret_arn" {
  description = "Optional Secrets Manager or SSM Parameter Store ARN to inject into the container. Default null leaves the DEV plan free of secret resources."
  type        = string
  default     = null
  sensitive   = true
}
