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
