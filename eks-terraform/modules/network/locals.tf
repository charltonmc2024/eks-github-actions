# Single naming base for every resource Name tag in this module.
# All name construction references local.name_prefix so derivation logic is not repeated inline.
locals {
  name_prefix = "${var.app_name}-${var.environment}"
}
