# ECR — the single application image repository for the backend runtime.
#
# CI/CD pushes immutable image tags here (e.g. a Git SHA) and the ECS task
# definition pulls the image by tag. The repository URL is derived by AWS and
# surfaced through outputs; no account ID, ARN, or registry URL is hardcoded.

# Exactly one repository for the application image (R1.1, R1.6).
resource "aws_ecr_repository" "app" {
  name = "${local.name_prefix}-app"

  # Mutability is an input so DEV can stay MUTABLE while a later environment can
  # opt into IMMUTABLE without editing module source (R1.5).
  image_tag_mutability = var.image_tag_mutability

  # Scan images on push so vulnerabilities surface before they run (R1.2).
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(var.tags, { Name = "${local.name_prefix}-app" })
}

# Cost-conscious DEV retention: expire untagged images quickly and cap the
# number of retained tagged images so the repository does not grow unbounded
# (R1.3). Rule numbers are evaluated in ascending priority; the untagged rule
# runs first, then the tagged-image cap.
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images beyond a small buffer to control DEV storage cost."
        selection = {
          tagStatus   = "untagged"
          countType   = "imageCountMoreThan"
          countNumber = 3
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Cap retained tagged images so superseded builds are pruned in DEV."
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
