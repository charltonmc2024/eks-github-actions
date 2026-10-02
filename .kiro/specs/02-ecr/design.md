# 02 — ECR Module Design

## Overview

A minimal, independent module that creates the image registry CI/CD pushes to and
EKS nodes pull from.

```text
GitHub Actions --push (tag = commit SHA)--> ECR repository --pull--> EKS nodes
                                               └── lifecycle policy (expire/keep)
```

## Resources

- `aws_ecr_repository`
  - `image_scanning_configuration { scan_on_push = true }` (cheap, useful for
    learning)
  - `encryption_configuration` (AES256 by default; KMS only if justified)
  - `image_tag_mutability` (document IMMUTABLE vs MUTABLE)
- `aws_ecr_lifecycle_policy`
  - expire untagged images after N days
  - keep only the most recent N tagged images

## Variables (illustrative)

`app_name`, `environment`, `image_tag_mutability`, `untagged_expiry_days`,
`max_tagged_images`, `tags`.

## Outputs

`ecr_repository_url` (consumed by the CI/CD workflow and the EKS deploy step),
`ecr_repository_arn` (consumed by the `cicd` module to scope the push IAM
policy).

## Cost

ECR storage ~$0.10/GB-month (verify). The lifecycle policy is the main cost
control. Image scanning on push is low cost.

## Security

Repository is private by default. The push/pull permissions are granted to the
GitHub Actions role (push) and node role (pull) in their respective modules,
scoped to this repository ARN — not wildcarded.
