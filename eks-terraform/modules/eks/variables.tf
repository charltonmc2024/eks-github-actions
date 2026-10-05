# Input variables for the reusable EKS module. Every input is explicitly typed
# and described; validation catches misconfiguration at plan/validate time.

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

variable "kubernetes_version" {
  description = "Kubernetes minor version for the EKS control plane and node group (e.g. \"1.35\"). Keep on a supported (standard) version to avoid extended-support control-plane pricing."
  type        = string
  default     = "1.35"

  validation {
    condition     = can(regex("^1\\.(2[5-9]|3[0-9])$", var.kubernetes_version))
    error_message = "kubernetes_version must look like 1.25 .. 1.39."
  }
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets (from the network module) where EKS nodes run. The control plane ENIs are also placed across these subnets."
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "private_subnet_ids must contain at least two subnets in different AZs."
  }
}

variable "admin_public_cidr" {
  description = "A single /32 CIDR (your current public IP) allowed to reach the EKS public API endpoint for local kubectl. Required and intentionally has no default; update it when your IP changes. Do NOT widen this to 0.0.0.0/0."
  type        = string

  validation {
    condition     = can(cidrhost(var.admin_public_cidr, 0)) && endswith(var.admin_public_cidr, "/32")
    error_message = "admin_public_cidr must be a valid single-host CIDR ending in /32 (e.g. 203.0.113.5/32)."
  }
}

variable "operator_principal_arn" {
  description = "IAM principal ARN (your IAM user or role) granted cluster-admin via an EKS access entry so you can run kubectl locally. Required; no default so it is never silently wrong."
  type        = string

  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]{12}:(user|role)/.+", var.operator_principal_arn))
    error_message = "operator_principal_arn must be an IAM user or role ARN."
  }
}

variable "node_instance_type" {
  description = "EC2 instance type for the managed node group. Default t3.small (2 vCPU / 2 GiB) fits CNI/kube-proxy/CoreDNS system pods plus two Next.js replicas with headroom for a rolling-update surge pod. See node_capacity notes in the module README/design."
  type        = string
  default     = "t3.small"
}

variable "node_desired_size" {
  description = "Desired number of nodes in the managed node group. Default 1 for lowest cost; a single node co-locates both app replicas (no node-failure HA) but still supports a RollingUpdate because max can scale out."
  type        = number
  default     = 1

  validation {
    condition     = var.node_desired_size >= 1
    error_message = "node_desired_size must be at least 1."
  }
}

variable "node_min_size" {
  description = "Minimum number of nodes in the managed node group."
  type        = number
  default     = 1

  validation {
    condition     = var.node_min_size >= 1
    error_message = "node_min_size must be at least 1."
  }
}

variable "node_max_size" {
  description = "Maximum number of nodes in the managed node group. Default 2 gives the autoscaler/node group room to add a node for a rolling update or brief pressure."
  type        = number
  default     = 2

  validation {
    condition     = var.node_max_size >= var.node_min_size
    error_message = "node_max_size must be >= node_min_size."
  }
}

variable "enabled_cluster_log_types" {
  description = "EKS control-plane log types to enable. Each enabled type ships logs to CloudWatch at cost; keep minimal for dev. Empty list disables control-plane logging."
  type        = list(string)
  default     = ["api", "audit", "authenticator"]
}

variable "tags" {
  description = "Common tags applied to EKS resources (e.g. Project, Environment, ManagedBy, Owner)."
  type        = map(string)
  default     = {}
}
