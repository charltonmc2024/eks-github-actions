# Single naming base, consistent with the network and ecr modules.
locals {
  name_prefix  = "${var.app_name}-${var.environment}"
  cluster_name = "${local.name_prefix}-eks"
}
