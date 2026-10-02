# Edge module outputs.
#
# Deliberately minimal surface: only values a concrete downstream consumer
# (operators / CI/CD) needs are exposed. The OAC id, the bucket ARN, and the
# distribution ARN are intentionally NOT exposed because nothing outside this
# module consumes them, and no output carries a secret value.

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution, used by operators and CI/CD (for example cache invalidations)."
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_domain_name" {
  description = "Default *.cloudfront.net domain name of the distribution, used to reach the environment."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "frontend_bucket_name" {
  description = "Name of the private S3 frontend bucket, used by CI/CD to upload the compiled frontend assets."
  value       = aws_s3_bucket.frontend.bucket
}
