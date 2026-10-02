locals {
  name_prefix = "${var.app_name}-${var.environment}"
  role_name   = "${local.name_prefix}-github-actions"

  # GitHub OIDC subject condition. Scope to the specific repo, and when a branch
  # is supplied, to that branch's ref; otherwise allow any ref in the repo.
  oidc_sub = var.github_branch == "" ? "repo:${var.github_owner}/${var.github_repo}:*" : "repo:${var.github_owner}/${var.github_repo}:ref:refs/heads/${var.github_branch}"
}
