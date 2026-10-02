# 02 — ECR Module Requirements

## Scope

Provide one Amazon ECR repository to hold the Erudition landing-page container
image, with a lifecycle policy to control storage cost. Reusable module at
`eks-terraform/modules/ecr`, consumed by `eks-terraform/envs/dev`. Independent of
the network module.

## Requirements

1. One ECR repository named from `${app_name}-${environment}` conventions
   (respect ECR naming rules).
2. Encryption at rest enabled (AWS-managed by default; KMS only if justified).
3. An image lifecycle policy, for example: expire untagged images after a short
   period and keep only the last N tagged images.
4. Image tag mutability chosen deliberately. Commit-SHA tags are immutable by
   nature; `IMMUTABLE` repositories are preferred for traceability, but allow
   `MUTABLE` if a `latest` convenience tag must be overwritten (document the
   choice).
5. No AWS account IDs, ARNs, or repository URLs hardcoded downstream — expose the
   repository URL and ARN as outputs.
6. All configurable values are typed, described variables.

## Non-Goals

- No building or pushing of images in Terraform (CI/CD does that).
- No cross-account replication or pull-through cache in this scope.

## Acceptance

- `terraform validate` passes via the dev root.
- `terraform plan` shows only the ECR repository and lifecycle policy to add.
- Lifecycle policy present; encryption enabled; outputs available.
