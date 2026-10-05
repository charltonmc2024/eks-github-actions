# ecr module

Provisions the private ECR repository for the landing-page image.

## Responsibilities

- One ECR repository named `${app_name}-${environment}-${repository_suffix}`
  (e.g. `erudition-eks-dev-landing`)
- `image_tag_mutability = IMMUTABLE` — a pushed tag (commit SHA) cannot be
  overwritten; workflow reruns reuse the existing image
- `scan_on_push` enabled; encryption at rest AES256 (AWS-managed)
- `force_delete = false` — `terraform destroy` will not remove a repository
  that still contains images (empty it first)
- Lifecycle policy: keep the most recent `max_tagged_images` tagged images;
  expire untagged images after `untagged_image_expiry_days`

> The retention count is an approximate rollback window, not a guaranteed
> depth: it counts images (not releases) and can expire an image a live
> Deployment still references. Size the values generously.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `app_name` | string | — | Base for the repository name. |
| `environment` | string | — | Base for the repository name. |
| `repository_suffix` | string | — | Suffix after `app-env` (e.g. `landing`). |
| `max_tagged_images` | number | — | Most-recent tagged images to retain. |
| `untagged_image_expiry_days` | number | — | Days before untagged images expire. |
| `tags` | map(string) | `{}` | Common tags. |

(Defaults for the suffix/counts live in the dev root's `variables.tf`.)

## Outputs

| Name | Description |
|------|-------------|
| `ecr_repository_url` | Repository URL CI pushes `:<git-sha>` images to. |
| `ecr_repository_arn` | Repository ARN (scopes the CI push IAM policy). |
| `ecr_repository_name` | Repository name. |
