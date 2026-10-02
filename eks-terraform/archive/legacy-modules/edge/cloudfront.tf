# cloudfront.tf
#
# Terraform loads every .tf file in this directory as one module, so file
# separation is purely for readability (conventions steering). Following the
# 02-data and 03-backend pattern, the module's `terraform {}` version block and
# the `locals { name_prefix }` block live at the top of this main file rather
# than in separate versions.tf / locals.tf files, keeping organizational-only
# files out of the module.
#
# This module declares NO `provider` block and NO `backend` block: it inherits
# the AWS provider (and the `aws.us_east_1` alias, available for a future custom
# ACM certificate) from the Dev_Root at ecs-terraform/envs/dev/.

terraform {
  required_version = "~> 1.16.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.67.0, < 7.0.0"
    }
  }
}

# Single naming base for every edge resource name and Name tag; the prefix is
# derived once here and never recomputed inline elsewhere.
locals {
  name_prefix = "${var.app_name}-${var.environment}"
}

# Task 5.1 — Edge-owned CloudFront VPC Origin fronting the internal ALB.
#
# The VPC Origin is a CloudFront-specific integration resource owned by this edge
# module (not by 03-backend). Its endpoint targets the internal ALB by ARN via
# var.alb_arn (consumed from module.backend.alb_arn); the ALB stays private and
# no ALB or ECS resource is created here. The hop is HTTP (origin_protocol_policy
# = "http-only") on var.alb_http_port, matching the internal ALB's HTTP listener.
#
# https_port and the origin_ssl_protocols block are REQUIRED by the AWS provider
# schema (~> 6.62) even under http-only, so both are set; they carry no traffic
# while HTTP-only is selected.
resource "aws_cloudfront_vpc_origin" "api" {
  vpc_origin_endpoint_config {
    name                   = "${local.name_prefix}-api"
    arn                    = var.alb_arn
    http_port              = var.alb_http_port
    https_port             = 443
    origin_protocol_policy = "http-only"

    origin_ssl_protocols {
      items    = ["TLSv1.2"]
      quantity = 1
    }
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-api-vpc-origin"
  })
}

# Task 5.2 — Managed CloudFront policies resolved by name via data sources so no
# policy IDs are hardcoded. CachingOptimized caches the static frontend normally;
# CachingDisabled keeps the /api/* behavior uncached; AllViewerExceptHostHeader
# forwards the request data a dynamic API needs while omitting the viewer Host
# header (which a VPC/custom origin does not expect).
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# Task 5.3 — The single CloudFront distribution: the platform's only
# internet-facing resource. Two origins (private S3 via OAC, and the internal
# ALB via the edge-created VPC Origin) and two behaviors (default -> S3, /api/*
# -> API). Viewer TLS uses the default *.cloudfront.net certificate; the origin
# hop to the ALB is HTTP over the private VPC Origin path. No aliases, no ACM,
# no Route 53, no WAF (web_acl_id), no Origin Shield, and no Shield resource for
# DEV.
resource "aws_cloudfront_distribution" "this" {
  enabled = true

  # Static frontend origin: private S3 bucket reached via OAC (regional domain,
  # never the S3 website endpoint).
  origin {
    origin_id                = "s3-frontend"
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # API origin: the internal ALB reached through the edge-created VPC Origin.
  # domain_name is the ALB DNS name (consumed from the backend); the VPC Origin
  # is attached by id. Traffic to the ALB is HTTP on the private path.
  origin {
    origin_id   = "api-vpc-origin"
    domain_name = var.alb_dns_name

    vpc_origin_config {
      vpc_origin_id = aws_cloudfront_vpc_origin.api.id
    }
  }

  # Default behavior serves the static frontend from S3 and may cache normally.
  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]
  }

  # /api/* is evaluated before the default and routes to the internal ALB.
  # Caching is disabled so dynamic API responses are always fresh, and the
  # AllViewerExceptHostHeader policy forwards the request data the API needs
  # without the viewer Host header (which the VPC/custom origin does not expect).
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "api-vpc-origin"
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id

    allowed_methods = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods  = ["GET", "HEAD"]
  }

  # DEV uses the default CloudFront viewer certificate on the *.cloudfront.net
  # domain; no custom alias and no ACM certificate.
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # No geo blocking for DEV; the block is required by the provider schema.
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-cloudfront"
  })
}
