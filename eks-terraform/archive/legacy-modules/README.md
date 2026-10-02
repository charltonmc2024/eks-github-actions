# Archived legacy modules (reference only)

These modules (`data`, `backend`, `edge`) belong to the superseded **ECS Fargate
+ internal ALB + CloudFront + S3 + DynamoDB** architecture. They are retained for
reference and learning comparison only.

They are **not** called by the active dev root (`eks-terraform/envs/dev`) and are
**not** the implementation source of truth.

The active architecture is the Erudition landing page on Amazon EKS with GitHub
Actions CI/CD. Active modules live in `eks-terraform/modules/` (currently
`network`; `ecr`, `eks`, and `cicd` are added in later tasks).

Do not wire, import, or migrate these modules into the active configuration
unless explicitly requested. The `network` module was adapted in place and
remains active (not archived).
