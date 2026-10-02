# Input variables for the reusable ECR module. Every input is explicitly typed
# and described; validation catches misconfiguration at plan/validate time.

variable "app_name" {
  description = "Application name used as the base for the repository name (e.g. erudition)."
  type        = string

  validation {
    condition     = length(trimspace(var.app_name)) > 0
    error_message = "app_name must not be empty."
  }
}

variable "environment" {
  description = "Environment identifier used as the base for the repository name (e.g. dev)."
  type        = string

  validation {
    condition     = length(trimspace(var.environment)) > 0
    error_message = "environment must not be empty."
  }
}

variable "repository_suffix" {
  description = "Suffix appended after the app_name-environment prefix to form the repository name (e.g. suffix \"landing\" => erudition-dev-landing)."
  type        = string
  default     = "landing"

  validation {
    # ECR repo names: lowercase alphanumerics plus _ . / - separators, 2-256 chars.
    condition     = can(regex("^[a-z0-9]+([._/-][a-z0-9]+)*$", var.repository_suffix))
    error_message = "repository_suffix must be lowercase alphanumeric with optional _ . / - separators."
  }
}

variable "untagged_image_expiry_days" {
  description = "Number of days after which UNTAGGED images are expired by the lifecycle policy. Caution: an untagged image can still be referenced by digest (…@sha256:…) by a running Deployment or a moved tag, so expiry is a cost control, not a guaranteed-safe deletion. Keep this window comfortably longer than any digest references you rely on."
  type        = number
  default     = 7

  validation {
    condition     = var.untagged_image_expiry_days >= 1 && var.untagged_image_expiry_days <= 3650
    error_message = "untagged_image_expiry_days must be between 1 and 3650."
  }
}

variable "max_tagged_images" {
  description = "Maximum number of most-recent TAGGED (commit-SHA) images to retain; older tagged images are expired. This is an APPROXIMATE rollback window, not a guaranteed rollback depth (image count does not map one-to-one to releases, and a lifecycle policy can expire an image a live Deployment still references). Set it generously relative to how far back you might roll back."
  type        = number
  default     = 10

  validation {
    condition     = var.max_tagged_images >= 1 && var.max_tagged_images <= 10000
    error_message = "max_tagged_images must be between 1 and 10000."
  }
}

variable "tags" {
  description = "Common tags applied to the ECR repository (e.g. Project, Environment, ManagedBy, Owner)."
  type        = map(string)
  default     = {}
}
