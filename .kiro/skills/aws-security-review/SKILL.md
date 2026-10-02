---
name: aws-security-review
description: Review the Erudition landing-page EKS development infrastructure for least privilege, GitHub OIDC trust, private networking, EKS access scoping, secrets handling, encryption, and unintended public exposure.
---

# AWS Security Review Skill

## Purpose

Review Terraform and AWS architecture for security problems before deployment.

Current environment: `eks-terraform/envs/dev`. Scope: the Erudition landing page
on Amazon EKS with GitHub Actions CI/CD. Security stays practical and
cost-conscious for a learning environment but never sacrifices the core rules.

Out of scope: ECS, DynamoDB, S3 frontend, CloudFront, Route 53, ACM.

## Review Areas

1. IAM and GitHub OIDC
2. EKS cluster endpoint access
3. EKS authorization (access entries + policy/RBAC)
4. Networking and node connectivity
5. Security groups
6. ECR and container images
7. Secrets
8. Encryption
9. Logging / retention

## IAM and GitHub OIDC

Check for least privilege. Flag `AdministratorAccess`, unnecessary `*` actions
or resources, long-lived IAM users, and embedded credentials. Prefer IAM roles.

Separate roles: EKS cluster role, EKS node role, GitHub Actions role.

For the GitHub Actions OIDC role specifically, flag:

- a trust policy that does not restrict the `sub` claim to the specific
  repository (and branch/environment where practical) — a wildcard repo is a
  Critical finding
- permissions broader than ECR auth/push/pull and `eks:DescribeCluster`
- any stored AWS access keys used instead of OIDC federation

## EKS Endpoint Access

Expected flow:

```text
GitHub Actions runner --OIDC/IAM--> EKS API endpoint
Developer --kubectl port-forward--> ClusterIP Service --> pods
```

Check the cluster endpoint access mode. A fully public endpoint with no
`public_access_cidrs` restriction is a finding (prefer restricting the CIDRs, or
public+private). Private-only requires a self-hosted runner inside the VPC.

## EKS Authorization

An **EKS access entry alone grants no Kubernetes permissions**. Flag any access
entry that is not paired with an access policy association or Kubernetes RBAC.
Prefer permissions scoped to the application namespace over cluster-wide admin
for the GitHub Actions role.

## Networking and Node Connectivity

EKS nodes run in private subnets with `assign_public_ip = false`. Flag
public-IP nodes. Confirm the outbound connectivity choice is deliberate (single
NAT gateway, VPC endpoints, etc.) and note its cost — a NAT gateway is a design
choice, not a mandatory EKS cost.

## Security Groups

Prefer security-group references over wide CIDRs. There is no public ingress in
this project (access is via port-forward); flag any unexpected `0.0.0.0/0`
ingress.

## ECR and Container Images

Check: repository encryption at rest, a lifecycle policy to expire old/untagged
images, immutable commit-SHA tags (not `latest` for deployment identity), and
that the image runs as a non-root user.

## Secrets

Never allow secrets in Git, Terraform source, Dockerfile, GitHub Actions
workflows, or committed tfvars. Prefer GitHub OIDC (removes stored AWS keys),
Secrets Manager / SSM for application secrets if ever needed. Note: the optional
Twilio variables for the `api/support` route are intentionally not configured;
their absence only disables SMS and does not expose a secret.

## Encryption

Review encryption for ECR, EKS secrets (envelope encryption with KMS where
justified), and CloudWatch Logs. Use AWS-managed keys when sufficient; do not add
customer-managed KMS speculatively.

## Logging

Check CloudWatch log retention is finite (no indefinite retention). EKS
control-plane log types each add cost — enable only what the learning goal needs.
CloudTrail/GuardDuty/Config are out of scope unless explicitly requested.

## Security Report

Classify findings as Critical / High / Medium / Low / Informational. For each:
what was found, why it matters, the affected Terraform resource, the recommended
correction, and the potential cost impact. Do not change architecture
automatically for low-risk findings.
