# Single shared private route table for both private subnets.
# Intentionally declared with NO inline route block: when the NAT Gateway is disabled
# the private subnets have no internet egress, and the plan shows zero aws_route resources
# for this table. When NAT is enabled the conditional 0.0.0.0/0 -> NAT route is added as a
# separate aws_route.private_nat resource in natgw.tf, keeping the egress path optional.
resource "aws_route_table" "private_route_table" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-route-table"
  })
}
