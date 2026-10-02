# Module input variables for the data module.
#
# The module is environment-independent: it accepts typed, validated inputs and
# derives all resource names from them. No AWS account IDs, ARNs, region strings,
# KMS key IDs, or resource-name literals are declared here. Region is NOT a module
# input — it comes from the AWS provider configured in envs/dev/providers.tf, which
# this module inherits from the calling root.

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

variable "enable_point_in_time_recovery" {
  description = "Enable DynamoDB point-in-time recovery on the App_Table (cost-bearing)."
  type        = bool
  default     = true
}

variable "deletion_protection_enabled" {
  description = "Enable DynamoDB deletion protection on the App_Table. Off by default so dev tables can be torn down freely."
  type        = bool
  default     = false
}
