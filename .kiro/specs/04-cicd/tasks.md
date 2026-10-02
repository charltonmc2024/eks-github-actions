# 04 — CI/CD Module + GitHub Actions Workflow Tasks

## Terraform (identity + permissions)

- [x] 1. Create `eks-terraform/modules/cicd` with typed variables (GitHub
      `org/repo`, optional branch/environment, ECR repo ARN, cluster
      identifiers, app namespace).
- [x] 2. Create the GitHub OIDC provider in IAM.
- [x] 3. Create the GitHub Actions IAM role with a trust policy scoped to the
      repository (and branch/environment where practical). No wildcard repo.
- [x] 4. Attach least-privilege permissions: ECR auth + push/pull on the repo
      ARN, and `eks:DescribeCluster` on the cluster ARN.
- [~] 5. DEFERRED by design. The CI/CD role performs no in-cluster deploy for
      now (deployment is local; automated deploy pending a self-hosted runner),
      so it is granted only eks:DescribeCluster — no EKS access entry / RBAC. A
      namespace-scoped access entry is added when automated deploy is enabled.
- [x] 6. Add output `github_actions_role_arn`; wire the module into
      `eks-terraform/envs/dev`.
- [x] 7. Verify Terraform: fmt / init / validate / plan (stop at plan). Confirm
      the trust policy is repo-scoped and permissions are least privilege.

## GitHub Actions workflow

- [x] 8. Created `.github/workflows/build-and-push.yml` (build/test/push; not
      `deploy.yml`, since deploy is pending) with `id-token: write` /
      `contents: read` and triggers (push to main, workflow_dispatch).
- [x] 9. Add build stage: checkout, `npm ci`, `npm run lint`, `npm run build`
      (no `npm test`).
- [x] 10. Add Docker build + smoke test (`curl -f localhost:3000/`); fail
      closed.
- [x] 11. Add OIDC auth + ECR login + push `<ecr>:${{ github.sha }}`.
- [~] 12. PENDING. Deploy is performed locally for now; documented in the
      workflow's deploy-note block (kubeconfig + kubectl apply + set image).
      Automated in-cluster deploy awaits a self-hosted runner (restricted EKS
      endpoint).
- [~] 13. PENDING with 12. Rollout verification runs locally for now; becomes a
      workflow step when automated deploy is enabled.
- [x] 14. Document in the workflow/README how the runner reaches the EKS API
      endpoint.

## Verification commands

```bash
# Terraform
cd eks-terraform/envs/dev
terraform fmt -check -recursive && terraform init && terraform validate && terraform plan

# Workflow YAML lint (optional, if actionlint is available)
actionlint .github/workflows/deploy.yml
```
