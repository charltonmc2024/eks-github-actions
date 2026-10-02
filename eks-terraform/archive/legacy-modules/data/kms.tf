# kms.tf — documentation only. No aws_kms_key or aws_kms_alias resources are created.
#
# The development App_Table uses DynamoDB AWS-owned encryption (server_side_encryption
# enabled = true, no kms_key_arn). AWS-owned encryption is the lowest-cost secure option
# and requires no key management, so it is the right choice for development.
#
# A customer-managed KMS key (CMK) would only be introduced under a concrete security or
# compliance requirement (e.g. a mandate for a customer-controlled key, key rotation
# policy, or cross-account grants). A CMK incurs a recurring per-key charge, so none is
# created for development. When such a requirement is defined, a CMK plus alias would be
# added and referenced from the table's server_side_encryption block via kms_key_arn.
