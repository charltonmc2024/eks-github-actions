# Single shared public route table for both public subnets.
# The inline default route sends all outbound IPv4 traffic to the Internet Gateway,
# giving public subnets their internet-facing path. No other routes belong here.
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-route-table"
  })
}

# Associate both public subnets with the shared public route table.
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public1.id
  route_table_id = aws_route_table.public_route_table.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public2.id
  route_table_id = aws_route_table.public_route_table.id
}
