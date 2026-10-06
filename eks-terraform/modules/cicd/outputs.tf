# Expose the role ARN the GitHub Actions workflow assumes via OIDC
# (role-to-assume). No secrets are output.

output "github_actions_role_arn" {
  description = "ARN of the IAM role GitHub Actions assumes via OIDC (set as role-to-assume in the workflow / repo variable)."
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_name" {
  description = "Name of the GitHub Actions IAM role."
  value       = aws_iam_role.github_actions.name
}

output "oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider used by the role (created or pre-existing)."
  value       = local.oidc_provider_arn
}

# --- EKS deploy access (automated-eks-deployment) ---

output "eks_access_entry_principal_arn" {
  description = "Principal (IAM role) ARN of the GitHub Actions EKS access entry; null when create_eks_access is false."
  value       = var.create_eks_access ? aws_eks_access_entry.github_actions[0].principal_arn : null
}

output "eks_deployer_group" {
  description = "Kubernetes group the GitHub Actions role authenticates as. The operator's namespace-scoped RBAC RoleBinding must bind this group to grant least-privilege deploy permissions."
  value       = local.eks_deployer_group
}
