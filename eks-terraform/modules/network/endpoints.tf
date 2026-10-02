# Optional S3 Gateway endpoint.
# A Gateway endpoint lets private subnets reach S3 over the AWS network without a
# NAT Gateway, keeping that traffic off the public internet and avoiding per-GB
# NAT data-processing cost. S3 is relevant here because ECR stores container
# image layers in S3, so EKS node image pulls benefit from this path. Gateway
# endpoints have no hourly charge.
#
# Gated on enable_vpc_endpoints and off by default; when disabled, zero endpoint
# resources exist (count = 0). Both route tables are associated so the endpoint
# route is present regardless of which subnet tier originates the request.
#
# Note: the DynamoDB gateway endpoint was intentionally removed — DynamoDB is out
# of scope for the landing-page EKS project. Interface endpoints (e.g. ECR API/DKR,
# STS, CloudWatch Logs) are deliberately NOT created here: they carry an hourly
# cost, and for the current dev setup the single NAT Gateway already provides the
# needed outbound path. They can be revisited if a NAT-free design is chosen.
resource "aws_vpc_endpoint" "s3" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.public_route_table.id, aws_route_table.private_route_table.id]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}
