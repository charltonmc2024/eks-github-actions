---
name: terraform-troubleshoot
description: Diagnose Terraform, AWS provider, remote state, backend, module, EKS, ECR, and GitHub OIDC problems in the Erudition landing-page EKS development environment.
---

# Terraform Troubleshooting Skill

## Purpose

Diagnose Terraform problems methodically without creating unnecessary
infrastructure changes.

Current environment: `eks-terraform/envs/dev` (modules: network, ecr, eks,
cicd).

## First Rule

Do not immediately: delete Terraform state, delete the S3 state bucket, destroy
infrastructure, remove `.terraform`, run `terraform destroy`, or recreate AWS
resources manually. Understand the error first.

## Troubleshooting Process

1. Read the complete error.
2. Identify the Terraform working directory.
3. Identify the resource/module involved.
4. Classify the problem: syntax, provider, backend, state, dependency, AWS
   permissions, AWS API, networking, or configuration.
5. Inspect the relevant Terraform files.
6. Check Terraform state only when necessary.
7. Make the smallest safe correction.
8. `terraform validate` -> `terraform plan` -> review before applying.

## Backend Problems

The dev environment uses remote state (key `dev/terraform.tfstate`), created by
the bootstrap configuration. If the backend bucket is reported missing: verify
bootstrap infrastructure, backend configuration, AWS profile/account, and region.
Do not create a second random backend bucket to bypass the problem.

## State Problems

Useful: `terraform state list`, `terraform state show`, `terraform state mv`.
Use state modification carefully; prefer `moved` blocks for code-based
refactors. Never modify state blindly.

## Provider Problems

Check Terraform version, AWS provider version, aliases, region, and AWS profile.
Provider configuration belongs in `eks-terraform/envs/dev/providers.tf`. If a
Kubernetes/Helm provider is configured against the cluster, verify its endpoint,
CA data, and exec/token auth come from EKS module outputs.

## EKS-Specific Issues

- **Nodes not joining / NotReady:** check the node IAM role managed policies
  (worker node, CNI, ECR read-only), subnet/route connectivity for image pulls
  (NAT or VPC endpoints), and the cluster security group rules.
- **`kubectl` unauthorized despite an access entry:** an access entry alone
  grants no Kubernetes permissions — confirm an access policy association or an
  RBAC `Role`/`RoleBinding` exists for the principal, scoped to the namespace.
- **Runner cannot reach the API endpoint:** confirm the endpoint access mode
  (public/public+private) and `public_access_cidrs`; a GitHub-hosted runner
  needs the public path or a self-hosted runner in the VPC.
- **Image pull failures (ECR):** check node role ECR permissions and outbound
  connectivity to ECR (NAT or `ecr.api`/`ecr.dkr`/S3 endpoints).

## GitHub OIDC Issues

- **`AssumeRoleWithWebIdentity` denied:** verify the OIDC provider thumbprint/
  audience (`sts.amazonaws.com`) and that the trust policy `sub` condition
  matches the exact repository and branch/environment.
- Do not relax the trust policy to a wildcard to "fix" it — correct the specific
  condition.

## AWS Authentication

When authentication fails, verify the active identity (AWS CLI identity checks).
Do not print or expose secret access keys. Never request that AWS secret keys be
committed to source control.

## Dependency / Lock / Duplicate Issues

Prefer Terraform references over manual `depends_on`; avoid circular module
dependencies. For a state lock, confirm no legitimate operation holds it before
force-unlocking. For "resource already exists", determine whether Terraform
already manages it, it belongs to another state, or it needs importing — do not
auto-delete existing resources.

## Goal

Restore Terraform to a predictable state where `terraform validate` succeeds and
`terraform plan` shows only the intended changes.
