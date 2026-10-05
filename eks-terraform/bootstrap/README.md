# Bootstrap — Terraform Remote State

This configuration provisions the S3 bucket that stores Terraform remote state
for the Erudition Solution development environment. Run it **once**, before the
main development root (`envs/dev/`), so that root has a backend to initialize
against.

The bootstrap uses **local state on purpose**: it creates the very bucket that
remote state would live in, so it cannot depend on that bucket itself.

## What it creates

A single S3 bucket, named `${app_name}-${environment}-tfstate-${aws_account_id}`
(for example `eruditiontx-app-eks-dev-tfstate-123456789012`), configured with:

- **Versioning** enabled, so state history is retained and recoverable.
- **Server-side encryption** (AES256) enabled by default.
- **Public access fully blocked** — state is never publicly reachable.

State locking is handled by S3 native locking (`use_lockfile = true` in
`backend.config`), so no DynamoDB lock table is required.

## Prerequisites

- Terraform `~> 1.16.0`
- AWS provider `~> 6.62` (resolved automatically on init)
- AWS credentials with permission to create and configure an S3 bucket.
  By default this config uses a named CLI profile (`var.aws_profile`,
  default `charltonecs`).

## Usage

```bash
cd eks-terraform/bootstrap

# Uses the profile baked into the config (var.aws_profile), or override it
terraform init
terraform apply
```

To use a different profile, region, or naming without editing the file:

```bash
terraform apply \
  -var="aws_profile=my-profile" \
  -var="aws_region=us-east-1" \
  -var="app_name=eruditiontx-app" \
  -var="environment=eks-dev"
```

## After apply

`terraform apply` prints the bucket name as an output:

```
state_bucket_name = "eruditiontx-app-eks-dev-tfstate-<account_id>"
```

Copy that value into the development root's backend config
(`eks-terraform/backend.config`, based on `backend.config.example`):

```hcl
bucket       = "eruditiontx-app-eks-dev-tfstate-<account_id>"
key          = "eks-dev/terraform.tfstate"
region       = "us-east-1"
use_lockfile = true
encrypt      = true
```

Then initialize the development root against the remote backend:

```bash
cd ../envs/dev
terraform init -reconfigure -backend-config=../../backend.config
```

## Inputs

| Variable      | Description                                     | Default            |
| ------------- | ----------------------------------------------- | ------------------ |
| `aws_region`  | AWS region for the state bucket                 | `us-east-1`        |
| `aws_profile` | AWS CLI profile used for credentials            | `charltonecs`      |
| `app_name`    | Application name — part of the bucket name      | `eruditiontx-app`  |
| `environment` | Environment — part of the bucket name           | `eks-dev`          |

## Outputs

| Output              | Description                                              |
| ------------------- | ------------------------------------------------------- |
| `state_bucket_name` | Bucket name to set as `bucket` in `backend.config`      |
| `aws_region`        | Region the state bucket was created in                  |

## Important notes

- **Do not run `terraform destroy` here while remote state is in use.** Destroying
  this bucket removes the backing store for every environment that relies on it.
  The bucket is created with `force_destroy = true`, so a destroy would delete
  state objects without warning.
- The bootstrap keeps its own state locally. `terraform.tfstate`,
  `terraform.tfstate.*`, `.terraform/`, and plan files are gitignored and must
  never be committed.
- Run this once per AWS account/environment. Re-running `apply` on an existing,
  unchanged setup is a no-op.
