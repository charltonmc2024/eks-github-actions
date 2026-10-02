# 04 — CI/CD Module + GitHub Actions Workflow Design

## Overview

Two layers: Terraform provisions the trust and permissions; the workflow uses
them. No long-lived AWS keys exist anywhere.

```text
GitHub Actions job
   | OIDC id-token
   v
IAM OIDC provider (token.actions.githubusercontent.com)
   |  assume (sub scoped to org/repo[:ref])
   v
GitHub Actions IAM role
   |  ECR auth/push/pull (repo ARN) + eks:DescribeCluster
   v
ECR  <--push <sha>--   build+smoke-test image
   |
   v
EKS API (public, CIDR-restricted) --kubectl--> Deployment image=<ecr>:<sha>
         ^ authorized by EKS access entry + access policy / RBAC (app namespace)
```

## Terraform Resources

- `aws_iam_openid_connect_provider` for GitHub
  (`token.actions.githubusercontent.com`, client id `sts.amazonaws.com`).
- `aws_iam_role` `github_actions` with a trust policy conditioned on
  `token.actions.githubusercontent.com:sub` matching `repo:<org>/<repo>:*` (or a
  tighter `:ref:refs/heads/<branch>` / `:environment:<env>`), and
  `:aud = sts.amazonaws.com`.
- `aws_iam_role_policy` (or managed policy) granting:
  - `ecr:GetAuthorizationToken` (resource `*`, as the API requires)
  - `ecr:BatchCheckLayerAvailability`, `ecr:InitiateLayerUpload`,
    `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:PutImage`,
    `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer` scoped to the repository
    ARN
  - `eks:DescribeCluster` on the cluster ARN
- `aws_eks_access_entry` for the role **and**
  `aws_eks_access_policy_association` scoped to the app namespace (or document a
  Kubernetes RBAC Role/RoleBinding applied via manifest instead).

The GitHub `org/repo` is a variable (configuration, not a secret).

## Why an access entry is not enough

An EKS access entry maps an IAM principal into the cluster's auth, but grants no
Kubernetes verbs. Deployment requires either an **access policy association**
(e.g. a namespace-scoped admin/edit policy) or a **Kubernetes RBAC binding**.
Scope to the `erudition` namespace so the role cannot act cluster-wide.

## Workflow (`.github/workflows/deploy.yml`)

Illustrative stages (implement during the task, not now):

```text
on: [push to main, workflow_dispatch]
permissions: { id-token: write, contents: read }
jobs.deploy.steps:
  - actions/checkout
  - setup-node + npm ci + npm run lint + npm run build
  - docker build -t app:${{ github.sha }} .
  - docker run -d -p 3000:3000 app:${{ github.sha }}; curl -f localhost:3000/   # smoke test
  - aws-actions/configure-aws-credentials (role-to-assume, no keys)
  - aws-actions/amazon-ecr-login
  - docker tag + docker push <ecr_url>:${{ github.sha }}
  - aws eks update-kubeconfig --name <cluster> --region <region>
  - kubectl apply -f k8s/ ; kubectl -n erudition set image deploy/erudition-landing app=<ecr_url>:${{ github.sha }}
  - kubectl -n erudition rollout status deploy/erudition-landing
```

Repository/environment variables (not secrets) carry the ECR URL, cluster name,
region, and namespace; the role ARN is a variable too. The ECR URL and cluster
name may also be read from Terraform outputs during setup.

## Runner connectivity

GitHub-hosted runners reach the cluster via the public (CIDR-restricted) EKS
endpoint. If a private-only endpoint is later required, switch to a self-hosted
runner inside the VPC.

## Security

Repo-scoped OIDC trust, least-privilege ECR/EKS permissions, namespace-scoped
Kubernetes authorization, no stored AWS keys, no secrets in logs.
