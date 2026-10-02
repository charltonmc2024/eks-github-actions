# GitHub Actions CI/CD Standards

## CI/CD Platform

GitHub Actions is the primary CI/CD platform.

Do not introduce Jenkins, AWS CodePipeline, or another CI/CD platform unless
explicitly requested.

Pipeline behavior lives in workflow files under `.github/workflows/` in the
repository. Terraform modules may create the AWS infrastructure the workflow
needs (OIDC provider, IAM role, EKS access), but must not contain the pipeline
definition itself.

---

## Current Deployment Target

The pipeline currently targets only the development environment.

- Terraform working directory: `eks-terraform/envs/dev`
- Application image: the Erudition landing page
- Deployment target: the EKS cluster's application namespace

Do not implement staging or production pipeline stages unless explicitly
requested.

---

## Workflow Location

Workflow definitions belong at:

`.github/workflows/`

Keep workflow logic understandable and avoid unnecessary duplication. Use
reusable steps or composite actions only when they provide a clear
maintainability benefit.

---

## Pipeline Flow

The intended high-level flow:

```text
GitHub (push / PR / manual dispatch)
 |
 +-- Checkout
 |
 +-- Validate & build landing page (install deps, lint if configured, next build)
 |
 +-- Build Docker image + smoke test (run container, curl the page)
 |
 +-- Authenticate to AWS via OIDC (no stored access keys)
 |
 +-- Push image to ECR (tagged with the Git commit SHA)
 |
 +-- Deploy to EKS (kubectl apply / set image in the app namespace)
 |
 +-- Check rollout success (kubectl rollout status)
```

A failure in any required stage must prevent dependent deployment stages from
continuing.

---

## Application Build Stage

For the Next.js landing page:

1. Install dependencies (`npm ci`).
2. Run linting where configured (`npm run lint`).
3. Build the application (`npm run build`).
4. Fail the pipeline if a required check fails.

Do not invent test commands that are not defined in `package.json`. Inspect the
application configuration first. The current `package.json` defines `dev`,
`build`, `start`, and `lint` (no test script); do not call a non-existent
`npm test`.

---

## Docker Image + Smoke Test

Build the image from the repository `Dockerfile` (a multi-stage Next.js
standalone build that runs as a non-root user on port 3000). Treat it as a
reusable starting point and verify its build and runtime behavior.

Smoke test before pushing: run the built image and confirm the landing page
responds (for example `curl -f http://localhost:3000/`). Do not push or deploy
an image that fails the smoke test.

Tag images with the immutable **Git commit SHA**. `latest` may be an optional
convenience tag but must not be the version the deployment relies on.

---

## AWS Authentication (OIDC)

Authenticate using GitHub OIDC federation — never stored AWS access keys.

- Use `aws-actions/configure-aws-credentials` with `role-to-assume` pointing at
  the IAM role created by the `cicd` Terraform module.
- The role's trust policy restricts which repository (and branch/environment
  where practical) may assume it.
- Grant the role least privilege: ECR auth + push/pull, and
  `eks:DescribeCluster`.

---

## ECR

The workflow may authenticate to ECR, build, tag, and push the image. Use the
ECR repository created by the `ecr` Terraform module. Do not hardcode the ECR
repository URL — obtain it from a Terraform output, a repository/environment
variable, or an AWS lookup.

---

## EKS Deployment

Deploy the landing page to the EKS cluster:

1. Configure kubeconfig with `aws eks update-kubeconfig` using the cluster name
   and region (the OIDC role has `eks:DescribeCluster`).
2. Apply the manifests in `k8s/` and set the Deployment image to the exact
   commit-SHA tag just pushed.
3. Deploy into the application namespace; do not use cluster-wide admin.

### How the runner reaches the EKS API

GitHub-hosted runners are outside the VPC, so the cluster's API endpoint must be
reachable from the runner — normally via the EKS **public endpoint** (restrict
`public_access_cidrs` where practical). A private-only endpoint would require a
self-hosted runner inside the VPC. Document the chosen mode.

### Kubernetes permissions

An EKS access entry alone grants no Kubernetes permissions. The `cicd` module
must also associate an EKS access policy or bind Kubernetes RBAC
(`Role`/`RoleBinding`) for the OIDC role, scoped to the application namespace
where practical. The workflow deploys only within that namespace.

Deployment failures must fail the pipeline. Do not silently continue after an
unsuccessful deployment.

---

## Deployment Verification

After deploying, verify the rollout reaches a healthy state:

- `kubectl rollout status deployment/<name> -n <namespace>` succeeds
- the desired number of replicas (2) are Ready
- failed/crash-looping pods are detected and fail the pipeline

Public application verification is out of scope initially: access is via
`kubectl port-forward`, not a public endpoint.

---

## Credentials

Never hardcode AWS credentials in workflows, Terraform, Dockerfiles, or
application source. Prefer:

- GitHub OIDC federation for AWS access (no stored keys)
- GitHub Actions secrets only for non-AWS values that must be stored
- AWS Secrets Manager / SSM for application secrets if ever needed

Use least-privilege permissions for the GitHub Actions role. Do not grant it
`AdministratorAccess`. Do not expose credentials or secret values in workflow
logs.

---

## Infrastructure vs Application Deployment

Treat infrastructure changes and application releases as related but distinct
concerns.

- Terraform manages AWS infrastructure (VPC, ECR, EKS, OIDC/IAM). Run Terraform
  quality checks in CI where useful:

  ```bash
  terraform fmt -check -recursive
  terraform init
  terraform validate
  terraform plan
  ```

  Formatting, init, validation, or plan failures must fail that job.

- The application release workflow builds the image, pushes it to ECR, and rolls
  it out to EKS.

Do not run `terraform apply` automatically merely because `terraform plan`
succeeds. Infrastructure changes require an intentional control. Do not modify
infrastructure merely to deploy a new application image.

---

## Failure Handling

Do not silently ignore failures. These must stop the relevant workflow:

- application build/lint failure
- Docker build or image smoke-test failure
- AWS authentication failure
- ECR push failure
- EKS deployment failure
- rollout verification failure
- Terraform fmt/init/validate/plan failure

Do not use failure-suppression patterns to force a workflow to appear
successful. Log enough to diagnose failures without exposing secrets.

---

## Environment Guidance

### Development (current)

CI/CD automation targets only `eks-terraform/envs/dev` and the dev EKS cluster.
Keep it simple, secure, and cost-conscious. Infrastructure changes are reviewed
through `terraform plan` before an intentional apply. Application deployments may
be automated after required build and smoke-test stages succeed.

### Staging and Production

Do not create staging or production pipelines unless explicitly requested. When
introduced, evaluate stronger controls (manual approval gates, protected
branches, environment-specific roles, private endpoints, rollback strategies).
Do not assume DEV controls automatically apply.
