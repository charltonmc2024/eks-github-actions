# Input variables for the cicd module (GitHub OIDC + least-privilege IAM role).

variable "app_name" {
  description = "Application name used as the base for derived resource names (e.g. erudition)."
  type        = string

  validation {
    condition     = length(trimspace(var.app_name)) > 0
    error_message = "app_name must not be empty."
  }
}

variable "environment" {
  description = "Environment identifier used as the base for derived resource names (e.g. eks-dev)."
  type        = string

  validation {
    condition     = length(trimspace(var.environment)) > 0
    error_message = "environment must not be empty."
  }
}

variable "github_owner" {
  description = "GitHub organization or user that owns the repository (the OIDC trust is scoped to this). Configuration, not a secret."
  type        = string

  validation {
    condition     = length(trimspace(var.github_owner)) > 0
    error_message = "github_owner must not be empty."
  }
}

variable "github_repo" {
  description = "GitHub repository name the workflow runs in. The OIDC role trust policy is restricted to this repo."
  type        = string

  validation {
    condition     = length(trimspace(var.github_repo)) > 0
    error_message = "github_repo must not be empty."
  }
}

variable "github_branch" {
  description = "Optional branch to further restrict the OIDC trust (e.g. \"main\"). Empty string allows any ref in the repo."
  type        = string
  default     = ""
}

variable "create_oidc_provider" {
  description = "Whether to create the GitHub OIDC IAM identity provider. Set false if the account already has one (only one provider per issuer URL is allowed per account)."
  type        = bool
  default     = true
}

variable "ecr_repository_arn" {
  description = "ARN of the ECR repository the workflow pushes to (from the ecr module). The push/pull permissions are scoped to this ARN."
  type        = string
}

variable "eks_cluster_arn" {
  description = "ARN of the EKS cluster (from the eks module). Scopes the role's eks:DescribeCluster permission."
  type        = string
}

variable "tags" {
  description = "Common tags applied to CI/CD IAM resources."
  type        = map(string)
  default     = {}
}
