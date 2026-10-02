# Input variables for the reusable network module. Every input is explicitly
# typed and described; validation catches misconfiguration at plan/validate
# time rather than surfacing cryptic errors during apply.

variable "app_name" {
  description = "Application name used as the base for derived resource names (e.g. erudition)."
  type        = string

  validation {
    condition     = length(trimspace(var.app_name)) > 0
    error_message = "app_name must not be empty."
  }
}

variable "environment" {
  description = "Environment identifier used as the base for derived resource names (e.g. dev)."
  type        = string

  validation {
    condition     = length(trimspace(var.environment)) > 0
    error_message = "environment must not be empty."
  }
}

variable "aws_region" {
  description = "AWS region the network resources are created in; also used to derive availability zones and VPC endpoint service names."
  type        = string
}

variable "vpc_cidr" {
  description = "IPv4 CIDR block for the VPC (/16 to /28)."
  type        = string

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_cidr1" {
  description = "IPv4 CIDR block for the first public subnet, in the first availability zone."
  type        = string

  validation {
    condition     = can(cidrhost(var.public_subnet_cidr1, 0))
    error_message = "public_subnet_cidr1 must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_cidr2" {
  description = "IPv4 CIDR block for the second public subnet, in the second availability zone."
  type        = string

  validation {
    condition     = can(cidrhost(var.public_subnet_cidr2, 0))
    error_message = "public_subnet_cidr2 must be a valid IPv4 CIDR block."
  }
}

variable "private_subnet_cidr1" {
  description = "IPv4 CIDR block for the first private subnet, in the first availability zone."
  type        = string

  validation {
    condition     = can(cidrhost(var.private_subnet_cidr1, 0))
    error_message = "private_subnet_cidr1 must be a valid IPv4 CIDR block."
  }
}

variable "private_subnet_cidr2" {
  description = "IPv4 CIDR block for the second private subnet, in the second availability zone."
  type        = string

  validation {
    condition     = can(cidrhost(var.private_subnet_cidr2, 0))
    error_message = "private_subnet_cidr2 must be a valid IPv4 CIDR block."
  }
}

variable "enable_nat_gateway" {
  description = "When true, provision a NAT Gateway (and its Elastic IP) and add a default route from the private route table, giving private EKS nodes outbound egress. Disabling it removes that egress: the toggle alone does NOT make private nodes functional — a NAT-free design must supply another working path (e.g. VPC interface endpoints for ECR/STS/Logs plus the S3 gateway endpoint). For the current dev setup this is expected to be true."
  type        = bool
  default     = false
}

variable "enable_vpc_endpoints" {
  description = "When true, provision the S3 gateway VPC endpoint so private subnets reach S3 (which backs ECR image layers) without using the NAT Gateway. Gateway endpoints have no hourly cost. Disabled by default."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags applied to network resources (e.g. Project, Environment, ManagedBy, Owner)."
  type        = map(string)
  default     = {}
}
