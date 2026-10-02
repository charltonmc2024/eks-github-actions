# Single private ECR repository for the Erudition landing-page image.
#
# image_tag_mutability = "IMMUTABLE": once a tag (e.g. a Git commit SHA) is
# pushed it cannot be overwritten. This gives traceable, reproducible deploys
# and makes workflow reruns safe — a rerun for an already-pushed SHA reuses the
# existing image instead of overwriting it (the CI workflow checks for the tag
# and skips the push when it already exists). Because deploys use commit-SHA
# tags, a moving "latest" tag is intentionally not used.
#
# scan_on_push surfaces known CVEs in pushed images at low cost. Encryption at
# rest uses AES256 (AWS-managed); a customer-managed KMS key is not justified
# for this learning environment.
#
# force_delete = false: Terraform will NOT delete the repository while it still
# contains images. This protects pushed images from accidental `terraform
# destroy`; empty the repository deliberately before removing it.
resource "aws_ecr_repository" "app" {
  name                 = local.repository_name
  image_tag_mutability = "IMMUTABLE"
  force_delete         = false

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name = local.repository_name
  })
}

# Lifecycle policy controls storage cost and bounds the rollback window.
#
# Rule 1 (lowest priority number evaluated first): keep only the most recent
# var.max_tagged_images TAGGED images; older tagged (commit-SHA) images are
# expired.
#
# Rule 2: expire UNTAGGED images after var.untagged_image_expiry_days.
#
# LIFECYCLE LIMITATIONS — read before tuning these numbers:
#   * The retention count is an APPROXIMATE rollback window, not a guaranteed
#     rollback depth. It counts images, which do not map one-to-one to
#     deployments: multiple commits can share an identical image (same digest),
#     a deploy may be rolled forward/back repeatedly, and expiry is evaluated by
#     push recency, not by what is deployed. Do not assume "keep last N" means
#     "the last N releases are always recoverable."
#   * Deleting untagged images is NOT universally safe. An image referenced by
#     digest (…@sha256:…) — including a running Deployment that pinned a digest,
#     or a tag that was later moved — can become untagged yet still be in use.
#     Expiring it can break pulls (e.g. a pod restart or scale-up pulls a now
#     missing image). This project deploys by tag, but digest references can
#     still arise, so treat untagged expiry as a cost control, not a guarantee.
#   * Lifecycle policies can expire an image that a live Deployment still
#     references. ECR does not check cluster usage before expiring. If the
#     rollback window is too small, the image your Deployment points at can be
#     deleted out from under it. Size var.max_tagged_images and
#     var.untagged_image_expiry_days generously relative to how long you keep
#     releases deployed and how far back you might roll back.
#
# The tagged rule uses tagPatternList ["*"] to match every tagged (commit-SHA)
# image; the untagged rule is scoped by countType sinceImagePushed.
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the most recent ${var.max_tagged_images} tagged images (approximate rollback window, not a guaranteed depth)."
        selection = {
          tagStatus      = "tagged"
          tagPatternList = ["*"]
          countType      = "imageCountMoreThan"
          countNumber    = var.max_tagged_images
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images after ${var.untagged_image_expiry_days} days."
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.untagged_image_expiry_days
        }
        action = { type = "expire" }
      }
    ]
  })
}
