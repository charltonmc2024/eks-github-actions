# Internet Gateway attached to the VPC so public-subnet resources have a
# path to and from the public internet. The public route table sends
# 0.0.0.0/0 here (see public_route_table.tf).
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-igw"
  })
}
