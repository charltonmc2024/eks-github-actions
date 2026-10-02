# Project Conventions

## Current Scope

Focus on completing:

`eks-terraform/envs/dev`

Run only the Erudition landing page on EKS. Do not create staging or production
infrastructure unless explicitly requested.

Design reusable modules so they can support future environments without
introducing staging or production resources now.

---

## Terraform Naming

Use `snake_case` for Terraform:

- resources
- variables
- locals
- outputs
- data sources
- module names

Use meaningful, descriptive names. Avoid names such as `resource1`, `test123`,
`thing`, `temp`. Resource labels should describe purpose, not implementation
order.

---

## AWS Naming

Use a consistent resource naming pattern.

Preferred concept:

`${app_name}-${environment}-${resource}`

Example:

`erudition-dev-eks`

Use locals rather than repeating naming logic:

```hcl
locals {
  name_prefix = "${var.app_name}-${var.environment}"
}
```

Then derive resource names from `local.name_prefix`.

Respect AWS service-specific naming restrictions (EKS cluster/node group name
rules, ECR repository name rules).

---

## Hardcoded Values

Do not hardcode account-specific or environment-specific AWS identifiers when
they can be obtained from Terraform references, variables, data sources, or
module outputs.

Avoid hardcoding:

- AWS account IDs
- ARNs
- VPC IDs
- subnet IDs
- security group IDs
- route table IDs
- ECR repository URLs
- EKS cluster names, endpoints, or CA data
- OIDC provider ARNs
- generated AWS resource identifiers

Prefer Terraform resource references and module outputs. Static configuration
values (region, CIDRs, the GitHub repository identifier) may be used when they
are intentional settings rather than generated AWS identifiers.

---

## Terraform Files

Use descriptive filenames. Examples relevant to this project:

- `main.tf`
- `variables.tf`
- `outputs.tf`
- `vpc.tf`
- `subnets.tf`
- `nat.tf` or `endpoints.tf`
- `eks-cluster.tf`
- `node-group.tf`
- `iam.tf`
- `ecr.tf`
- `oidc.tf`
- `access-entries.tf`

Terraform loads all `.tf` files in a directory as one module. File separation is
for readability. Do not create unnecessary files for tiny blocks. Follow the
established file structure of an existing module when extending it.

---

## Kubernetes Manifest Conventions

Kubernetes manifests live in `k8s/` at the repository root.

- Use lowercase, hyphenated resource names.
- Deploy into a dedicated application namespace where practical rather than
  `default`.
- The `Deployment` sets 2 replicas, resource `requests` and `limits`, and both
  `readinessProbe` and `livenessProbe`. For the landing page, probe the root
  path `/` on the container port (3000) unless a dedicated health path is added.
- The `Service` is `ClusterIP`.
- Reference the exact image by its immutable tag (Git commit SHA). CI substitutes
  the tag; do not commit a floating `latest` reference as the deployed version.

---

## Image Tagging

- Tag every image pushed to ECR with the **Git commit SHA** (immutable).
- `latest` may be pushed as an optional convenience tag, but deployments must
  reference the commit-SHA tag for traceability.
- The Kubernetes Deployment and the GitHub Actions deploy step must agree on the
  exact tag being rolled out.

---

## GitHub Actions Conventions

- Workflows live in `.github/workflows/`.
- Authenticate to AWS with OIDC via `aws-actions/configure-aws-credentials`
  using `role-to-assume`; never store AWS access keys.
- Keep workflow logic readable; use reusable steps/actions only when they add
  clear value.
- Fail the workflow on any required-stage failure (build, image smoke test,
  push, deploy, rollout).

---

## Comments

Comments should explain why something exists or clarify a non-obvious decision,
for example:

```hcl
# Single NAT gateway (not one per AZ) keeps dev egress cost low.
```

Avoid comments that merely restate Terraform syntax. Prefer clear names over
excessive comments.

---

## Git

Never commit:

- `.terraform/`
- `*.tfstate`
- `*.tfstate.*`
- saved Terraform plan files
- credentials, private keys, secrets
- local files containing secrets

Commit the Terraform dependency lock file for deployable root modules when
appropriate. Before committing, review `git status` and `git diff`. Do not
commit generated or temporary files unless intentionally part of the repository.

---

## Terraform Validation

Before committing Terraform changes:

```bash
terraform fmt -recursive
```

For CI verification:

```bash
terraform fmt -check -recursive
```

Validate the active development root:

```bash
terraform validate
```

Before infrastructure changes:

```bash
terraform plan
```

Review the plan before applying. A successful `terraform plan` is not
authorization to `terraform apply`. Resolve unexpected replacement, deletion, or
modification before applying.

---

## Terraform State

Treat Terraform state as critical infrastructure data. Use the configured remote
backend for the deployable environment. Do not manually edit state files. Do not
delete, recreate, move, or rename Terraform-managed resources solely to resolve
configuration problems without first considering state impact. Do not introduce
`moved` blocks or state-migration operations unless an actual resource migration
requires them.

---

## Cost

Prefer cost-conscious development resources. Verify current regional pricing
before quoting figures.

### Recorded reference pricing (verify before reuse)

Region `us-east-1`, from public pricing sources dated early–mid 2026, standard
Kubernetes version support. Treat as an estimate and re-verify:

- EKS control plane: ~$0.10 per cluster per hour (~$73/month). Rises to roughly
  $0.50/hour if the cluster falls to extended Kubernetes-version support.
- NAT gateway: ~$0.045 per hour per gateway (~$32–33/month) plus ~$0.045 per GB
  processed. A NAT gateway is a **design choice**, not a mandatory EKS cost.
- EC2 nodes: variable by instance type and count (verify the chosen small
  instance type at build time).
- ECR storage: ~$0.10 per GB-month; controlled with a lifecycle policy.

Sources (public pricing pages/articles): AWS EKS pricing, AWS VPC/NAT pricing
documentation, and third-party pricing summaries. Content was summarized for
licensing compliance.

### Cost discipline

Avoid creating:

- more NAT gateways than necessary (prefer a single NAT for dev, or VPC
  endpoints)
- oversized or excess nodes
- excessive log retention
- duplicate CI/CD systems
- unnecessary managed services or duplicate infrastructure
- speculative resources for future environments

Cost optimization must not introduce unnecessary public exposure or weaken
required security controls. Document how to tear the environment down (destroy
the cluster and NAT) when not actively learning, since the control plane bills
continuously.

---

## Architecture Stability

Follow the architecture defined in `architecture.md`. Do not redesign working
infrastructure without a clear requirement. If an architectural change is
necessary, explain: (1) why, (2) what resources change, (3) cost impact, (4)
security impact, (5) Terraform/state impact — before implementing a destructive
or significant change. Prefer extending the established architecture over
replacing it.

---

## Development Priority

Finish the development environment end to end before expanding to additional
environments. Current implementation priority:

1. Network
2. ECR
3. EKS
4. CI/CD (GitHub OIDC + IAM), Kubernetes manifests, and the GitHub Actions
   workflow

When a module is complete, avoid modifying it unless a downstream dependency
requires an interface change, validation finds a defect, security requires a
correction, or the approved architecture changes. Complete and validate each
phase before moving to the next whenever practical.

---

## Change Discipline

Make the smallest change necessary to satisfy the approved requirement. Do not
modify unrelated files, modules, resources, or architecture. Do not add
speculative features or implement future requirements unless explicitly
requested.

When working from approved specifications, keep implementation consistent with:

1. `requirements.md`
2. `design.md`
3. `tasks.md`
4. project steering files

If these documents conflict, identify the conflict before making a significant
or destructive infrastructure change.
