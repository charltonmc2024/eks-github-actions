# Archived ECS specs (reference only)

These specifications (`01-network`, `02-data`, `03-backend`, `04-edge`) describe
the **superseded ECS Fargate + internal ALB + CloudFront + S3 + DynamoDB**
architecture driven by Jenkins CI/CD.

They are retained for reference and learning comparison only. They are **not**
the implementation source of truth.

The active architecture is the Erudition landing page on Amazon EKS with GitHub
Actions CI/CD. See:

- Active specs: `.kiro/specs/01-network`, `02-ecr`, `03-eks`, `04-cicd`
- Steering: `.kiro/steering/architecture.md` and the other steering files

Do not implement, import, or migrate resources from these archived specs unless
explicitly requested.
