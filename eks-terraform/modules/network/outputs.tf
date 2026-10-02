# Outputs expose only the resource identifiers that the deployment root and
# downstream modules need, so they can reference network resources without
# hardcoding any IDs.

output "vpc_id" {
  description = "ID of the VPC created by the network module."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the two public subnets (AZ a and AZ b)."
  value       = [aws_subnet.public1.id, aws_subnet.public2.id]
}

output "private_subnet_ids" {
  description = "IDs of the two private subnets (AZ a and AZ b) where EKS nodes run."
  value       = [aws_subnet.private1.id, aws_subnet.private2.id]
}

# NAT Gateway is optional; the count-guarded index is only valid when enabled,
# so the output falls back to null when NAT is disabled to avoid an index error.
output "nat_gateway_id" {
  description = "ID of the NAT Gateway when enable_nat_gateway is true, otherwise null."
  value       = var.enable_nat_gateway ? aws_nat_gateway.natgw[0].id : null
}
