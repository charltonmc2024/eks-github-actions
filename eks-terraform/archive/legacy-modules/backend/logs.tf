# logs.tf

# Application log group for the ECS task's awslogs driver. Retention is set
# explicitly (never unlimited) so DEV logs age out and do not accrue open-ended
# CloudWatch Logs storage cost. The ECS task definition's logConfiguration ships
# container stdout/stderr here.
resource "aws_cloudwatch_log_group" "app" {
  name              = "${local.name_prefix}-app"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-app"
  })
}

# No S3 ALB access-log bucket is created here. ALB access logging stays disabled
# in DEV; if it is needed later, the bucket belongs to a logging/observability
# module rather than the backend (R8).
