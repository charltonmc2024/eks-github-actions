# Re-export the network module's outputs from the dev root so operators,
# downstream modules, and CI/CD can consume network resource identifiers
# without reaching into the module internals.
#
# Network, ecr, eks, and cicd outputs are exposed.

output "vpc_id" {
  description = "ID of the VPC created by the network module."
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the two public subnets (AZ a and AZ b)."
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the two private subnets (AZ a and AZ b) where EKS nodes run."
  value       = module.network.private_subnet_ids
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway when enable_nat_gateway is true, otherwise null."
  value       = module.network.nat_gateway_id
}

output "ecr_repository_url" {
  description = "URL of the ECR repository CI/CD pushes the landing-page image to."
  value       = module.ecr.ecr_repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository, used to scope CI/CD push IAM permissions."
  value       = module.ecr.ecr_repository_arn
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster (for aws eks update-kubeconfig)."
  value       = module.eks.eks_cluster_name
}

output "eks_cluster_endpoint" {
  description = "API server endpoint of the EKS cluster."
  value       = module.eks.eks_cluster_endpoint
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster."
  value       = module.eks.eks_cluster_arn
}

output "node_group_name" {
  description = "Name of the managed node group."
  value       = module.eks.node_group_name
}

output "github_actions_role_arn" {
  description = "IAM role ARN GitHub Actions assumes via OIDC. The workflow reads this as the AWS_ROLE_ARN GitHub repository secret (role-to-assume)."
  value       = module.cicd.github_actions_role_arn
}

# EKS deploy-access outputs (automated-eks-deployment). The operator needs the
# deployer group name to bind the namespace-scoped RBAC RoleBinding
# (k8s/rbac-deployer.yaml) to the GitHub Actions role.
output "eks_deployer_group" {
  description = "Kubernetes group the GitHub Actions role authenticates as; bind this group in k8s/rbac-deployer.yaml."
  value       = module.cicd.eks_deployer_group
}

output "github_actions_eks_access_entry_principal_arn" {
  description = "Principal ARN of the GitHub Actions EKS access entry (null when create_eks_access is false)."
  value       = module.cicd.eks_access_entry_principal_arn
}
