# Input variables for the dev deployment root. These mirror the network
# module's inputs so values flow from terraform.tfvars through the root into
# the module call. The module's `tags` map is not mirrored here: the root
# assembles the common tag set (Project, Environment, ManagedBy, Owner) in
# main.tf, deriving the Owner value from `var.owner`.

variable "app_name" {
  description = "Application name used as the base for derived resource names (e.g. erudition)."
  type        = string
}

variable "environment" {
  description = "Environment identifier used as the base for derived resource names (e.g. dev)."
  type        = string
}

variable "aws_region" {
  description = "AWS region the development infrastructure is deployed into."
  type        = string
}

variable "owner" {
  description = "Owner identifier applied as the Owner key in the common tag set (e.g. a team name)."
  type        = string
}

variable "vpc_cidr" {
  description = "IPv4 CIDR block for the VPC (/16 to /28)."
  type        = string
}

variable "public_subnet_cidr1" {
  description = "IPv4 CIDR block for the first public subnet, in the first availability zone."
  type        = string
}

variable "public_subnet_cidr2" {
  description = "IPv4 CIDR block for the second public subnet, in the second availability zone."
  type        = string
}

variable "private_subnet_cidr1" {
  description = "IPv4 CIDR block for the first private subnet, in the first availability zone."
  type        = string
}

variable "private_subnet_cidr2" {
  description = "IPv4 CIDR block for the second private subnet, in the second availability zone."
  type        = string
}

variable "enable_nat_gateway" {
  description = "When true, provision a NAT Gateway (and its Elastic IP) and add a default route from the private route table; disabled by default to avoid recurring cost in development."
  type        = bool
  default     = false
}

variable "enable_vpc_endpoints" {
  description = "When true, provision the S3 gateway VPC endpoint; disabled by default."
  type        = bool
  default     = false
}

# The data/backend (DynamoDB, ECS) inputs that lived here were removed with the
# legacy module calls.

# Inputs for module "ecr" (image registry).

variable "ecr_repository_suffix" {
  description = "Suffix appended after the app_name-environment prefix to form the ECR repository name."
  type        = string
  default     = "landing"
}

variable "ecr_untagged_image_expiry_days" {
  description = "Days after which untagged ECR images are expired. Caution: untagged images can still be referenced by digest, so this is a cost control, not a guaranteed-safe deletion."
  type        = number
  default     = 7
}

variable "ecr_max_tagged_images" {
  description = "Maximum number of most-recent tagged (commit-SHA) ECR images to retain; an approximate rollback window, not a guaranteed rollback depth."
  type        = number
  default     = 10
}

# Inputs for module "eks" (cluster + node group).

variable "kubernetes_version" {
  description = "Kubernetes minor version for the EKS control plane and node group (e.g. \"1.31\")."
  type        = string
  default     = "1.31"
}

variable "admin_public_cidr" {
  description = "Your current public IP as a /32 CIDR, allowed to reach the EKS public API endpoint for local kubectl. Required; update when your IP changes. Never widen to 0.0.0.0/0."
  type        = string
}

variable "operator_principal_arn" {
  description = "IAM user/role ARN granted cluster-admin via an EKS access entry so you can run kubectl locally. Required; no default."
  type        = string
}

variable "node_instance_type" {
  description = "EC2 instance type for the managed node group (default t3.small fits system pods + two Next.js replicas + rollout surge)."
  type        = string
  default     = "t3.small"
}

variable "node_desired_size" {
  description = "Desired node count. Default 1 for lowest cost."
  type        = number
  default     = 1
}

variable "node_min_size" {
  description = "Minimum node count."
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum node count. Default 2 allows a rolling-update surge node."
  type        = number
  default     = 2
}

# Inputs for module "cicd" (GitHub OIDC + IAM role).

variable "github_owner" {
  description = "GitHub organization or user that owns the repository (OIDC trust is scoped to it)."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name the workflow runs in (OIDC trust is scoped to it)."
  type        = string
}

variable "github_branch" {
  description = "Optional branch to further restrict OIDC trust (e.g. \"main\"); empty allows any ref in the repo."
  type        = string
  default     = ""
}
