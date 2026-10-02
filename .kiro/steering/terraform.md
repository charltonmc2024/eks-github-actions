# Terraform Standards

## Current Scope

The only deployment root currently being implemented is:

`eks-terraform/envs/dev/`

Do not create:

- `envs/staging/`
- `envs/prod/`

unless explicitly requested.

Reusable modules should remain environment-independent where practical so future
environments can consume them without redesigning the core module architecture.

Do not create speculative staging or production resources for future
compatibility.

---

## Directory Structure

Reusable infrastructure:

`eks-terraform/modules/`

Current root module:

`eks-terraform/envs/dev/`

Remote-state bootstrap:

`eks-terraform/bootstrap/`

The root environment composes reusable modules and provides environment-specific
configuration.

---

## Modules

Current modules:

- network
- ecr
- eks
- cicd

Modules must remain reusable and should not contain unnecessary
development-specific configuration.

Keep resources within the module that owns their architectural responsibility.

Use module outputs and input variables to pass required values between modules.

Avoid circular module dependencies.

Follow the dependency direction established in `architecture.md`
(`network -> eks`; `ecr` independent; `cicd` consumes ECR and EKS identifiers).

Do not move resources between modules without a clear architectural reason and
consideration of Terraform state impact.

---

## No Hardcoding

Do not hardcode:

- AWS account IDs
- ARNs
- VPC IDs
- subnet IDs
- route table IDs
- security group IDs
- ECR repository URLs
- EKS cluster names, endpoints, or certificate authority data
- OIDC provider ARNs
- generated AWS resource identifiers

Use:

- Terraform variables
- locals
- resource references
- data sources
- module outputs

Static architectural configuration values may be used when intentional and not
generated account-specific identifiers. The GitHub repository identifier used in
the OIDC trust policy is a legitimate configuration variable, not a secret.

---

## Variables

Variables should:

- have meaningful names
- declare explicit types
- include useful descriptions
- include validation where appropriate

Development-specific values belong primarily in:

`eks-terraform/envs/dev/terraform.tfvars`

Do not put secrets in committed `terraform.tfvars`.

Use appropriate secret-management mechanisms for sensitive values.

Mark sensitive Terraform variables as `sensitive = true` where appropriate.

---

## Outputs

Modules should expose only values required by another module, the root module,
CI/CD, or operators.

Do not create outputs merely because a resource has an ID or ARN.

Examples, when required by downstream consumers:

- `vpc_id`
- `public_subnet_ids`
- `private_subnet_ids`
- `ecr_repository_url`
- `ecr_repository_arn`
- `eks_cluster_name`
- `eks_cluster_endpoint`
- `eks_cluster_certificate_authority_data`
- `eks_cluster_oidc_issuer_url`
- `node_group_name`
- `github_actions_role_arn`

Do not expose secret values through Terraform outputs unless explicitly required
and appropriately marked sensitive.

---

## Naming

Use locals for derived names.

Preferred pattern:

```hcl
locals {
  name_prefix = "${var.app_name}-${var.environment}"
}
```

Derive resource names from `local.name_prefix` where appropriate.

Avoid repeating naming logic across resources.

Respect AWS service-specific naming restrictions (for example, EKS cluster and
node group name constraints).

---

## Tags

Use common tags where AWS resources support them.

Recommended:

- `Project`
- `Environment`
- `ManagedBy`
- `Owner`

Pass common tags from the root environment to reusable modules where practical.

Merge common tags with resource-specific tags rather than duplicating tag
definitions throughout the configuration.

---

## State

The bootstrap configuration creates the remote-state infrastructure.

Bootstrap uses separate state from the main development environment.

Development state key:

`dev/terraform.tfstate`

Treat Terraform state as critical infrastructure data.

Never commit:

- `*.tfstate`
- `*.tfstate.*`
- `.terraform/`
- saved Terraform plan files

Do not manually edit Terraform state files.

Do not delete or recreate Terraform-managed resources solely to resolve
configuration issues without first considering Terraform state impact.

---

## Backend

The environment backend configuration belongs under:

`eks-terraform/envs/dev/`

Do not attempt to create the backend S3 bucket from the same Terraform state
that depends on that backend.

Bootstrap the remote-state infrastructure separately before initializing the
main DEV root.

Do not place a `backend` block inside reusable child modules.

---

## Providers

Configure the AWS provider in the root environment:

`eks-terraform/envs/dev/providers.tf`

Define any provider aliases there as well.

Child modules should inherit the default provider configuration or receive
provider aliases explicitly when required.

Do not define unnecessary provider blocks inside reusable child modules.

Do not place AWS credentials inside provider configuration. Use the established
AWS authentication mechanism outside Terraform configuration.

If a Kubernetes or Helm provider is used (for example to apply manifests from
Terraform), configure it in the root module using the EKS module outputs
(endpoint, CA data, and a token/exec auth). In this project, however,
Kubernetes manifests are normally applied by the GitHub Actions workflow with
`kubectl`, not by Terraform.

---

## Module Dependency Direction

Follow the architecture defined in `architecture.md`.

For the current path, preserve the dependency direction:

```text
network -> eks
ecr (independent)
cicd consumes ECR and EKS identifiers
```

The `cicd` module consumes the ECR repository identifier and the EKS cluster
identifiers to build the GitHub OIDC role and the scoped EKS access entry.

Do not introduce circular module dependencies.

---

## Terraform Workflow

Before committing:

```bash
terraform fmt -recursive
```

CI/CD may verify formatting using:

```bash
terraform fmt -check -recursive
```

Before planning or applying infrastructure:

```bash
terraform init
terraform validate
terraform plan
```

Review the plan before:

```bash
terraform apply
```

A successful `terraform plan` does not automatically authorize `terraform
apply`.

Do not run `terraform apply` when a specification or implementation task
explicitly stops at validation or planning.

Investigate unexpected changes, replacements, or destroys before applying.

---

## Plan Review

Before applying infrastructure changes, review the Terraform plan for:

- unexpected resource destruction
- unexpected resource replacement
- unintended public resources (for example an unintentionally public EKS
  endpoint or public-IP nodes)
- security group changes
- IAM permission changes (especially the GitHub OIDC role trust policy and
  permissions)
- state inconsistencies
- duplicate resources
- unexpected recurring-cost resources (NAT gateways, interface endpoints,
  oversized nodes)
- hardcoded identifiers
- resources outside the current DEV scope

For clean-slate work where no infrastructure exists in the active state, the
expected plan should normally contain resources to add with no unexpected
changes or destroys.

Do not force a plan to match an expected count without investigating
differences.

---

## Clean-Slate Refactoring

The current modular architecture is a clean-slate implementation targeting EKS
and GitHub Actions.

Previous ECS/Jenkins application infrastructure was intentionally superseded.
Legacy ECS-oriented Terraform files and the archived ECS specs may remain in the
repository for reference, but they are not the implementation source.

The current Terraform source of truth is:

- `eks-terraform/modules/` (network, ecr, eks, cicd)
- `eks-terraform/envs/dev/`

Do not create `moved` blocks or perform Terraform state migration for legacy
ECS resources unless explicitly requested.

Do not modify, import, migrate, or use legacy ECS Terraform resources as the
implementation source unless explicitly requested.

Before deployment, verify that the active remote state does not contain stale
records for previously deleted resources. If stale state is discovered, stop and
review the state before changing, removing, importing, or recreating resources.

---

## Environment Independence

Reusable modules should not assume DEV-specific values unless those values are
intentionally provided through variables.

Environment-specific configuration should normally be supplied by:

- root module variables
- environment `terraform.tfvars`
- provider configuration
- module inputs

Future environments may use different node sizing, scaling, endpoint access
modes, and security controls. Do not assume DEV defaults automatically apply to
future environments.

---

## Change Discipline

Make the smallest Terraform change required to satisfy the approved requirement.

Do not modify unrelated modules or resources.

Do not introduce speculative infrastructure.

Do not add AWS services merely to increase architectural complexity.

When implementing an approved specification, follow:

1. `requirements.md`
2. `design.md`
3. `tasks.md`
4. project steering files

If these documents conflict, identify and resolve the conflict before making a
significant, destructive, or state-affecting infrastructure change.

---

## Cost Awareness

Prefer cost-conscious infrastructure for DEV. Verify current regional pricing
before quoting figures; recorded reference figures and their date live in
`conventions.md`.

Treat these as deliberate, documented choices rather than defaults:

- NAT gateway vs VPC endpoints vs public-subnet nodes (a NAT gateway is a
  design choice, not a mandatory EKS charge)
- single NAT gateway vs one per AZ
- node instance size and desired count
- ECR lifecycle policy to limit image storage
- EKS control-plane cost is unavoidable while the cluster exists; document how
  to tear the environment down when not learning
