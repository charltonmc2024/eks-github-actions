# 02 — ECR Module Tasks

- [x] 1. Decide image tag mutability (IMMUTABLE preferred for traceability;
      MUTABLE only if a `latest` convenience tag must be overwritten) and record
      the choice.
- [x] 2. Create `eks-terraform/modules/ecr` with typed, described variables.
- [x] 3. Define `aws_ecr_repository` with scan-on-push and encryption at rest.
- [x] 4. Define `aws_ecr_lifecycle_policy` (expire untagged after N days; keep
      last N tagged).
- [x] 5. Add outputs: `ecr_repository_url`, `ecr_repository_arn`.
- [x] 6. Wire the module into `eks-terraform/envs/dev`.
- [x] 7. Verify: fmt / init / validate / plan — plan shows only the repository
      and lifecycle policy; no hardcoded identifiers. (Stop at plan.)

## Verification commands

```bash
cd eks-terraform/envs/dev
terraform fmt -check -recursive
terraform init
terraform validate
terraform plan
```
