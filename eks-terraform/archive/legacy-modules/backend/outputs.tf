# Backend module outputs (R14.4).
#
# Deliberately minimal output surface: only values a concrete downstream
# consumer needs are exposed. No output carries a secret value. alb_arn is an
# intentional output consumed by 04-edge to create the CloudFront VPC Origin.
# Diagnostics-only identifiers (vpc_origin_arn, alb_security_group_id,
# ecs_security_group_id) are intentionally not exposed because nothing outside
# this module consumes them.

# Consumed by CI/CD to push the application image to ECR.
output "ecr_repository_url" {
  description = "URL of the application ECR repository, used by CI/CD to push the built container image."
  value       = aws_ecr_repository.app.repository_url
}

# Consumed by 04-edge as the CloudFront distribution origin domain_name for the
# VPC-origin-backed internal ALB.
output "alb_dns_name" {
  description = "DNS name of the internal application load balancer, used by 04-edge as the CloudFront origin domain name."
  value       = aws_lb.app.dns_name
}

# Consumed by 04-edge to create the CloudFront VPC Origin that fronts this internal ALB.
output "alb_arn" {
  description = "ARN of the internal application load balancer, consumed by 04-edge to create the CloudFront VPC Origin."
  value       = aws_lb.app.arn
}

# Consumed by CI/CD as the ECS deploy target cluster.
output "ecs_cluster_name" {
  description = "Name of the ECS cluster, used by CI/CD as the deployment target."
  value       = aws_ecs_cluster.this.name
}

# Consumed by CI/CD to trigger a rolling deployment (aws ecs update-service --force-new-deployment).
output "ecs_service_name" {
  description = "Name of the ECS service, used by CI/CD to force a new deployment of the updated image."
  value       = aws_ecs_service.app.name
}
