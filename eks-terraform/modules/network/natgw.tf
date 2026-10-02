# Optional NAT Gateway, off by default (var.enable_nat_gateway = false) to minimize dev cost.
# EIP, NAT Gateway, and the private default route are all count-gated together so that when
# NAT is disabled none of them exist and the private route table carries no 0.0.0.0/0 route.

# Static public IP for the NAT Gateway. Only allocated when NAT is enabled.
resource "aws_eip" "eip" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-eip"
  })
}

# NAT Gateway placed in the first public subnet, giving private subnets outbound-only egress.
# depends_on the IGW so the internet-facing path exists before the NAT is created.
resource "aws_nat_gateway" "natgw" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.eip[0].id
  subnet_id     = aws_subnet.public1.id

  depends_on = [aws_internet_gateway.main]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-natgw"
  })
}

# The private default route only exists when NAT is on; declared as a separate resource
# (not an inline route on the private route table) so the disabled case shows zero routes.
resource "aws_route" "private_nat" {
  count                  = var.enable_nat_gateway ? 1 : 0
  route_table_id         = aws_route_table.private_route_table.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.natgw[0].id
}
