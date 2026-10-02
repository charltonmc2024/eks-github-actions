---
name: terraform-validate
description: Create, review, validate, and plan Terraform for the Erudition landing-page EKS development environment (network, ecr, eks, cicd) before deployment.
---

# Terraform Skill

## Purpose

Use this skill when creating, modifying, reviewing, validating, debugging, or
planning Terraform infrastructure for the Erudition landing-page project on
Amazon EKS.

This skill defines the **workflow for Terraform tasks**. Project architecture and
standards are defined by the steering files, which take precedence over anything
here:

- `product.md`
- `architecture.md`
- `terraform.md`
- `aws-security.md`
- `conventions.md`

Do not restate steering content here; follow it.

---

## 1. When to Use

Use for tasks involving: creating/modifying Terraform resources, debugging
Terraform errors, reviewing configuration, creating modules, or changing
networking, IAM, EKS, ECR, or GitHub OIDC. Do not use for application-only
changes that do not affect Terraform.

---

## 2. Project Context

Deployment root: `eks-terraform/envs/dev`. Reusable modules:
`eks-terraform/modules/{network,ecr,eks,cicd}`.

Target architecture (see `architecture.md` for detail):

```text
network ──> eks (nodes in private subnets)
ecr (independent image registry)
cicd (GitHub OIDC role + scoped EKS access) consumes ecr + eks identifiers

Developer --kubectl port-forward--> Service (ClusterIP) --> Deployment (2 replicas, :3000)
GitHub Actions --OIDC--> IAM role --> ECR --> kubectl rollout --> EKS API
```

Out of scope: ECS, DynamoDB, S3 frontend, CloudFront, Route 53, ACM, Ingress,
public load balancer.

---

## 3. Before Changing Terraform

Always inspect existing Terraform first; do not immediately create new
resources. Check existing files, resources, variables, locals, outputs,
providers, modules, IAM roles, security groups, and dependencies. If a resource
already exists, modify it rather than creating a duplicate.

---

## 4. Terraform Workflow

```text
Understand request
  -> inspect existing Terraform
  -> check steering files
  -> identify affected resources
  -> make the smallest required change
  -> terraform fmt
  -> terraform init
  -> terraform validate
  -> terraform plan
  -> review plan
  -> apply only when explicitly authorized
  -> verify resources
```

Never skip from editing straight to `terraform apply`.

---

## 5. Inspect Before Creating

Before creating a resource, search existing config for its type, e.g.
`aws_eks_cluster`, `aws_eks_node_group`, `aws_ecr_repository`,
`aws_iam_openid_connect_provider`, `aws_eks_access_entry`, `aws_vpc`,
`aws_nat_gateway`, `aws_vpc_endpoint`. Avoid duplicate declarations.

---

## 6. Naming and Variables

Follow `${app_name}-${environment}-${resource}` via a `name_prefix` local. Do
not hardcode environment-specific values; use variables for region, environment,
app name, CIDRs, node instance type/size, desired node count, cluster endpoint
access settings, and the GitHub repository identifier. Do not hardcode AWS
account IDs, ARNs, cluster endpoints/CA data, or OIDC provider ARNs.

---

## 7. Provider Configuration

Keep the AWS provider in `eks-terraform/envs/dev/providers.tf`. If a Kubernetes
or Helm provider is used (to apply manifests from Terraform), configure it in the
root using EKS module outputs (endpoint, CA data, exec/token auth). In this
project, manifests are normally applied by GitHub Actions `kubectl`, not by
Terraform.

---

## 8. Network Workflow

When modifying networking: inspect the VPC, subnets (public/private across two
AZs), CIDRs (no overlaps), route tables, IGW, and the chosen outbound
connectivity. Private subnets host EKS nodes with no public IPs.

Node outbound connectivity is a deliberate choice — compare before selecting:

- NAT gateway (single, for cost) — simplest; recurring hourly + per-GB cost.
- VPC endpoints (ECR API/DKR, S3 gateway, Logs, STS, EKS) — avoids NAT for AWS
  traffic; interface endpoints have their own hourly cost.
- Public-subnet nodes — not preferred; violates private-by-default.

Verify EKS subnet tagging requirements where relevant.

---

## 9. EKS Workflow

When modifying EKS, inspect all related resources together:

```text
cluster role / node role (IAM)
  -> EKS cluster (endpoint access mode)
  -> managed node group (private subnets, small instance, desired count)
  -> EKS access entries + access policy / RBAC
```

Check: cluster IAM role, node IAM role and its managed policies (worker node,
CNI, ECR read-only pull), endpoint access mode (public with CIDR restriction vs
public+private vs private-only), node instance type/count, control-plane log
types enabled (each adds cost). An **access entry alone grants no Kubernetes
permissions** — pair it with an access policy association or RBAC scoped to the
app namespace.

---

## 10. ECR Workflow

Terraform manages the ECR repository and its lifecycle policy (expire untagged /
keep last N). Images are built and pushed by GitHub Actions, tagged with the Git
commit SHA — not by Terraform. Expose the repository URL as an output; never
hardcode it downstream.

---

## 11. IAM / GitHub OIDC Workflow

1. Identify the principal that needs access (EKS control plane, nodes, GitHub
   Actions).
2. Grant the minimum actions and resources.
3. For GitHub Actions: create the OIDC provider, and a role whose trust policy
   restricts the `sub` claim to the specific repository (and branch/environment
   where practical). Grant only ECR auth/push/pull and `eks:DescribeCluster`.
4. Avoid wildcard resources and broad managed policies; never
   `AdministratorAccess` for workloads.

---

## 12. Terraform State

Never commit `terraform.tfstate` or `*.backup`. Do not edit state manually. Use
`terraform import` to bring an existing resource under management rather than
recreating it. Prefer `moved` blocks only for genuine code-based refactors.

---

## 13. fmt / init / validate / plan

```bash
terraform fmt -recursive          # or -check -recursive in CI
terraform init                    # after adding providers/modules/backend
terraform validate
terraform plan
```

Inspect `Plan: X to add, Y to change, Z to destroy`. Investigate any unexpected
`destroy` or `replace`, especially for the VPC, EKS cluster, node group, OIDC
provider, or IAM roles.

---

## 14. Destructive Changes

Do not intentionally destroy infrastructure unless the user explicitly requests
it or the requested architecture requires it. On unexpected
destruction/replacement: stop, identify the cause, inspect dependencies and
state drift, explain the impact, and fix the configuration before proceeding.
Never silently accept destructive changes.

---

## 15. Apply (only when authorized)

Only apply after reviewing the plan and receiving explicit authorization. Avoid
`-auto-approve` for significant changes unless automation explicitly requires it.
A successful plan is not authorization to apply.

---

## 16. Debugging Workflow

```text
read full error -> identify resource/module -> classify (syntax, provider,
backend, state, dependency, IAM/permissions, networking, config) -> inspect
files -> check state if needed -> smallest safe fix -> fmt -> validate -> plan
```

Do not change many resources at once. See the `terraform-troubleshoot` skill for
error-specific guidance.

---

## 17. Cost-Conscious Development

Prefer the smallest architecture that meets the learning and security goals:
small node instance type, low desired count, a single NAT gateway or VPC
endpoints, an ECR lifecycle policy, and finite log retention. The EKS control
plane bills continuously while the cluster exists; document tear-down. Verify
current regional pricing before quoting figures.

---

## 18. Outputs

Create outputs only for values consumed downstream (another module, the root,
CI/CD, or operators): e.g. `vpc_id`, `private_subnet_ids`, `ecr_repository_url`,
`eks_cluster_name`, `eks_cluster_endpoint`, `github_actions_role_arn`. Never
expose secrets through outputs.

---

## 19. Verification

After applying, verify affected resources: cluster `ACTIVE`, node group nodes
`Ready`, ECR repository present with lifecycle policy, OIDC provider and role
present with correct trust policy, and the GitHub Actions role able to deploy
only in the app namespace.

---

## 20. Definition of Done

```text
[ ] existing config inspected
[ ] steering files checked
[ ] no duplicate resources introduced
[ ] terraform fmt
[ ] terraform init (when required)
[ ] terraform validate passes
[ ] terraform plan reviewed; no unexpected destroy/replace
[ ] applied only when explicitly authorized
[ ] resources verified
[ ] docs/steering updated if architecture changed
```

## Core Rule

**Inspect -> Understand -> Modify -> Format -> Validate -> Plan -> Review ->
Apply (when authorized) -> Verify.** Never skip inspection and plan for
significant changes.
