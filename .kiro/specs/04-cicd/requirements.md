# 04 — CI/CD Module + GitHub Actions Workflow Requirements

## Scope

Provide the AWS identity and permissions GitHub Actions needs, plus the workflow
that builds the landing page, pushes the image to ECR, and deploys it to EKS.
Reusable module at `eks-terraform/modules/cicd`, consumed by
`eks-terraform/envs/dev`. Workflow at `.github/workflows/`.

Depends on the `ecr` module (repository ARN) and the `eks` module (cluster
identifiers).

## Terraform (identity + permissions) Requirements

1. A GitHub OIDC identity provider in IAM
   (`token.actions.githubusercontent.com`, audience `sts.amazonaws.com`).
2. An IAM role assumable by GitHub Actions whose trust policy restricts the
   `sub` claim to the specific repository (and branch/environment where
   practical). No wildcard repository.
3. Least-privilege permissions on the role:
   - ECR: `GetAuthorizationToken` and push/pull **scoped to the project
     repository ARN**
   - `eks:DescribeCluster` for the project cluster
4. An EKS **access entry** for the role **plus** the authorization that actually
   permits deployment — either an EKS access policy association or Kubernetes
   RBAC (`Role` + `RoleBinding`) — scoped to the application namespace where
   practical. (An access entry alone grants nothing.)
5. No stored AWS access keys anywhere.
6. No hardcoded account IDs or ARNs; consume ECR/EKS identifiers via module
   outputs/variables. The GitHub `org/repo` identifier is configuration.
7. Outputs: `github_actions_role_arn`.

## GitHub Actions Workflow Requirements

8. Trigger on push (and/or workflow_dispatch); `permissions: id-token: write`,
   `contents: read`.
9. Checkout the repository.
10. Validate and build the landing page: `npm ci`, `npm run lint`, `npm run
    build`. Do not call a non-existent `npm test`.
11. Build the Docker image from the repository `Dockerfile` and smoke-test it
    (run the container, `curl -f http://localhost:3000/`). Fail if the smoke test
    fails.
12. Authenticate to AWS via OIDC (`aws-actions/configure-aws-credentials`,
    `role-to-assume`), no stored keys.
13. Log in to ECR and push the image tagged with the Git commit SHA
    (`${{ github.sha }}`); `latest` optional and non-authoritative.
14. Configure kubeconfig (`aws eks update-kubeconfig`) and deploy to EKS in the
    app namespace, setting the Deployment image to the commit-SHA tag.
15. Verify rollout: `kubectl rollout status` succeeds and 2 replicas become
    Ready; fail the workflow otherwise.
16. Document how the runner reaches the EKS API endpoint (public/restricted vs
    self-hosted runner).

## Acceptance

- Terraform: validate passes; plan shows the OIDC provider, role, scoped
  policies, and EKS access entry/association to add; trust policy is
  repo-scoped; permissions are least privilege.
- Workflow: parses; stages fail closed; no stored AWS keys; image tagged by SHA;
  rollout verified; deploys only in the app namespace.
