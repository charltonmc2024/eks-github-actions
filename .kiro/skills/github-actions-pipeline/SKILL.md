---
name: github-actions-pipeline
description: Build and maintain the GitHub Actions CI/CD pipeline for the Erudition landing page - build, Docker image smoke test, OIDC auth, ECR push by commit SHA, and EKS rollout to the dev cluster.
---

# GitHub Actions Pipeline Skill

## Purpose

Build and maintain CI/CD for the Erudition landing page on Amazon EKS using
GitHub Actions.

Current target: the dev EKS cluster; Terraform working directory
`eks-terraform/envs/dev`. Do not create staging or production pipelines unless
explicitly requested. Follow the `cicd.md`, `aws-security.md`, and
`conventions.md` steering files; do not restate them here.

## Workflow Location

Workflow definitions belong in `.github/workflows/` at the repository root — not
inside a Terraform module. Terraform provisions the OIDC provider, IAM role, and
EKS access the workflow uses.

## Pipeline Architecture

```text
GitHub (push / PR / workflow_dispatch)
  -> Checkout
  -> Validate & build landing page
  -> Build Docker image + smoke test
  -> Authenticate to AWS via OIDC
  -> Push image to ECR (tag = Git commit SHA)
  -> Deploy to EKS (app namespace)
  -> Check rollout success
```

A failure in any required stage must stop dependent stages.

## Application Build Stage

For the Next.js landing page:

1. `npm ci`
2. `npm run lint` (lint is defined in package.json)
3. `npm run build`

Do not invent test commands. `package.json` defines `dev`, `build`, `start`,
`lint` and **no** `test` script — do not call `npm test`. Inspect
`package.json` before adding commands.

## Docker Build + Smoke Test

Build from the repository `Dockerfile` (multi-stage Next.js standalone, non-root,
port 3000). Treat it as a reusable starting point and verify build + runtime
behavior. Smoke test before pushing: run the image and `curl -f
http://localhost:3000/`. Do not push or deploy an image that fails the smoke
test.

Tag with the immutable Git commit SHA (`${{ github.sha }}`). `latest` may be an
optional convenience tag but must not be the deployed version identifier.

## AWS Authentication (OIDC)

Use `aws-actions/configure-aws-credentials` with `role-to-assume` set to the IAM
role from the `cicd` module. Never store AWS access keys. The job needs
`permissions: id-token: write` and `contents: read`.

## ECR

Authenticate with `aws-actions/amazon-ecr-login`, then build/tag/push. Obtain the
repository URL from a Terraform output or a repo/environment variable — do not
hardcode it.

## EKS Deployment

1. `aws eks update-kubeconfig --name <cluster> --region <region>` (the role has
   `eks:DescribeCluster`).
2. Apply `k8s/` manifests and set the Deployment image to the commit-SHA tag just
   pushed (e.g. `kubectl set image` or `kustomize`/`envsubst`).
3. Deploy only into the application namespace.

How the runner reaches the API: GitHub-hosted runners are outside the VPC, so the
EKS endpoint must be public (restrict `public_access_cidrs` where practical) or
the runner must be self-hosted inside the VPC. Document the chosen mode.

Permissions: an EKS access entry alone is insufficient — the role needs an EKS
access policy association or RBAC scoped to the app namespace.

## Deployment Verification

`kubectl rollout status deployment/<name> -n <namespace>` must succeed and the 2
replicas must become Ready. Detect crash-looping pods and fail the pipeline.
Public verification is out of scope initially (access is via port-forward).

## Terraform in CI

Where useful, run `terraform fmt -check -recursive`, `init`, `validate`, `plan`
for `eks-terraform/envs/dev`. Any failure fails that job. Do not run `terraform
apply` automatically on a successful plan — infrastructure apply needs an
intentional control, kept distinct from the application release flow.

## Credentials and Failure Handling

Never hardcode AWS credentials. Use OIDC for AWS; GitHub Actions secrets only for
non-AWS values that must be stored. Do not print secrets to logs. Do not suppress
failures to force a green run — build, smoke test, auth, push, deploy, and
rollout failures must stop the workflow.

## Current Scope

DEV only. Do not add staging/production deployment, Jenkins, or CodePipeline
unless explicitly requested.
