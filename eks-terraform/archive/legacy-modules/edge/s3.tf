# s3.tf
#
# Private S3 frontend bucket that stores the compiled static frontend assets.
# The bucket is reached only by CloudFront through Origin Access Control; it is
# never public. This file will also hold the public-access block, server-side
# encryption, the OAC, and the OAC-scoped bucket policy, added by later Task 4
# subtasks. This subtask (4.1) creates ONLY the bucket itself.
#
# No static website hosting is enabled and no public access is configured: the
# CloudFront S3 origin uses the bucket regional domain, not the S3 website
# endpoint, and privacy is enforced by the public-access block and bucket policy
# added later.

resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-frontend"
  })
}

# Task 4.2 — Public Access Block: all four flags true so the bucket can never be
# made public via ACLs or bucket policy, regardless of account-level defaults.
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Task 4.3 — Server-side encryption at rest using SSE-S3 (AES256). AWS-managed
# encryption is sufficient for DEV; no customer-managed KMS key is used.
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Task 4.4 — Origin Access Control (the current AWS-recommended mechanism, not
# legacy OAI). CloudFront signs S3 origin requests with SigV4 as the CloudFront
# service principal so the private bucket needs no public access. No
# aws_cloudfront_origin_access_identity (OAI) is created.
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}-frontend-oac"
  description                       = "OAC for the ${local.name_prefix} private S3 frontend origin."
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Task 4.5 — OAC-scoped bucket policy. Grants s3:GetObject to ONLY the CloudFront
# service principal, scoped to this specific distribution via the AWS:SourceArn
# condition, so no other principal (and nothing public) can read the bucket.
# There is no Principal "*", no 0.0.0.0/0, and no public read.
#
# Reference chain (no cycle): the distribution references the OAC and the bucket
# regional domain; this policy references the distribution ARN. Terraform
# sequences OAC + bucket -> distribution -> bucket policy from that ARN
# reference, so no explicit depends_on is required.
data "aws_iam_policy_document" "frontend" {
  statement {
    sid       = "AllowCloudFrontServicePrincipalReadOnly"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend.json
}
