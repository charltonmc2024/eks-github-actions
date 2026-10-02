# Single naming base for the repository, consistent with the network module.
# ECR repository names allow lowercase letters, numbers, and the separators
# _ . / -, so "${app_name}-${environment}-<suffix>" is valid.
locals {
  name_prefix     = "${var.app_name}-${var.environment}"
  repository_name = "${local.name_prefix}-${var.repository_suffix}"
}
