# Expose only the identifiers downstream consumers need: CI/CD uses the URL to
# tag/push images and set the Kubernetes image; the cicd module uses the ARN to
# scope the GitHub Actions push IAM policy to this repository.

output "ecr_repository_url" {
  description = "URL of the ECR repository (e.g. <account>.dkr.ecr.<region>.amazonaws.com/erudition-dev-landing). CI/CD pushes commit-SHA-tagged images here."
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository, used to scope IAM push/pull permissions to this repository only."
  value       = aws_ecr_repository.app.arn
}

output "ecr_repository_name" {
  description = "Name of the ECR repository."
  value       = aws_ecr_repository.app.name
}
