locals {
  name_prefix = "${var.app_name}-${var.environment}"
  role_name   = "${local.name_prefix}-github-actions"

  # Match GitHub's OIDC subject, including owner and repository IDs.
  oidc_sub = var.github_branch == "" ? "repo:${var.github_owner}@${var.github_owner_id}/${var.github_repo}@${var.github_repo_id}:*" : "repo:${var.github_owner}@${var.github_owner_id}/${var.github_repo}@${var.github_repo_id}:ref:refs/heads/${var.github_branch}"
}
# Kubernetes group the GitHub Actions access entry authenticates as. The
# operator's namespace-scoped RBAC RoleBinding binds THIS group (least
# privilege). Derived from the name prefix + namespace; not an account-specific
# identifier. Keep in sync with the operator RBAC bootstrap in the README.
locals {
  eks_deployer_group = "${local.name_prefix}-${var.eks_application_namespace}-deployers"
}
