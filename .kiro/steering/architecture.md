# Erudition Solution — AWS Architecture

## Current Scope

Implement only:

`eks-terraform/envs/dev`

Run only the Erudition landing page on Amazon EKS. Do not create staging or
production environments unless explicitly requested.

Out of scope (do not build): backend API services, DynamoDB, S3 frontend,
CloudFront, Route 53, ACM, Ingress, or a public load balancer.

---

## High-Level Request Flow

Initial access is through `kubectl port-forward` — there is no public entry
point in this scope.

```text
Developer workstation
      |
      |  kubectl port-forward svc/<service> 8080:80
      v
Kubernetes Service (ClusterIP)
      |
      v
Deployment (2 replicas) -- landing page container on port 3000
      |
      v
EKS managed node group (small EC2 nodes in private subnets)
```

Deployment flow:

```text
GitHub Actions runner
      |
      |  GitHub OIDC -> assume AWS IAM role (no stored keys)
      v
Amazon ECR  <--- docker push (image tagged with Git commit SHA)
      |
      v
EKS API endpoint  <--- kubectl apply / kubectl rollout status
```

---

## Modules

Four reusable Terraform modules under `eks-terraform/modules/`:

1. `network`
2. `ecr`
3. `eks`
4. `cicd`

Use variables for environment-specific settings. Never hardcode AWS account
IDs, credentials, or generated resource identifiers.

---

## Network Module

Location: `modules/network/`

Responsibilities:

- VPC
- Public subnets (for NAT gateway / egress, across two AZs)
- Private subnets (for EKS nodes, across two AZs)
- Internet Gateway
- Route tables and associations
- Outbound connectivity for private nodes (see "Node Connectivity" below)
- Security groups as needed

Application workloads (EKS nodes/pods) run in private subnets and must not
receive public IP addresses.

### Node Connectivity (a design decision, not a default)

Private nodes still need outbound access to pull images from ECR, reach the EKS
control plane, and send logs. Compare these options and choose deliberately —
document the choice and its cost impact:

- **NAT gateway** — simplest; private subnets route `0.0.0.0/0` to a NAT
  gateway in a public subnet. Recurring hourly + per-GB cost (see
  `conventions.md`). A single NAT gateway (not one per AZ) is the
  cost-conscious choice for dev.
- **VPC interface/gateway endpoints** (ECR API, ECR DKR, S3 gateway,
  CloudWatch Logs, STS, EKS) — avoids a NAT gateway for the AWS-service
  traffic this project needs; interface endpoints have their own hourly cost
  but can be cheaper and more private than NAT for a small workload.
- **Public-subnet nodes with public IPs** — avoids NAT cost but violates the
  private-by-default and least-privilege goals. Not preferred.

Do not assume a NAT gateway is mandatory. Select the smallest secure option
that lets private nodes reach ECR and the control plane.

---

## ECR Module

Location: `modules/ecr/`

Responsibilities:

- One ECR repository for the landing-page image
- Image lifecycle policy (for example: expire untagged images, keep the last N
  tagged images) to control storage cost

Expose the repository URL as an output so CI/CD can reference it rather than
hardcoding it.

---

## EKS Module

Location: `modules/eks/`

Responsibilities:

- EKS cluster (control plane)
- One small managed node group in the private subnets
- Cluster IAM role and node IAM role (least privilege, AWS-managed EKS policies)
- Cluster access configuration (EKS access entries) for the operator principal

The node IAM role carries the standard managed policies required for a node to
join the cluster and pull from ECR. The cluster endpoint access mode (public,
private, or both) is an explicit, documented choice — see "EKS API Endpoint
Access" below.

### EKS API Endpoint Access

The GitHub Actions runner (hosted outside the VPC) runs `kubectl` against the
EKS API endpoint. For the runner to reach it, the cluster endpoint must be
reachable from the runner. Options, in order of preference for this learning
scope:

- **Public endpoint (optionally CIDR-restricted)** — simplest for a
  GitHub-hosted runner. Restrict `public_access_cidrs` where practical.
- **Public + private endpoint** — nodes use the private path; the runner uses
  the public path.
- **Private-only endpoint** — requires a self-hosted runner inside the VPC (or
  a bastion/VPN). More secure but more setup; note it as a future option.

Document which mode is chosen and why. Authentication uses IAM (the OIDC-assumed
role); authorization inside the cluster is granted separately (see
`aws-security.md`).

---

## CI/CD Module

Location: `modules/cicd/`

Responsibilities:

- GitHub OIDC identity provider in IAM (federation; no stored AWS keys)
- Least-privilege IAM role assumable by GitHub Actions, trust policy scoped to
  the specific repository (and branch/environment where practical)
- Permissions for ECR login/push and `eks:DescribeCluster`
- An EKS access entry (and associated access policy or Kubernetes RBAC) that
  grants the role deployment permissions, scoped to the application namespace
  where practical

The GitHub Actions **workflow definition** lives at `.github/workflows/` in the
repository, not inside a Terraform module. Terraform provisions the identity and
permissions the workflow uses.

> Important: an EKS access entry by itself does not grant any Kubernetes
> permissions. It must be paired with an EKS access policy association or
> Kubernetes RBAC (Role/RoleBinding) to allow the role to deploy. See
> `aws-security.md`.

---

## Kubernetes Manifests

Location: `k8s/` at the repository root.

- `Deployment` — 2 replicas, resource requests and limits, readiness and
  liveness probes, references the exact image tag produced by CI (the Git
  commit SHA), running in a dedicated application namespace where practical.
- `Service` — `ClusterIP` type; reached initially through `kubectl
  port-forward`.

Manifests are applied by the GitHub Actions workflow, not by Terraform.

---

## Dependency Direction

```text
network
   |
   +--> eks  (nodes need the private subnets + connectivity)
   |
ecr  (independent; image registry)
   |
cicd (needs the ECR repo and the EKS cluster to grant scoped access)
```

- `network` is upstream of `eks`.
- `ecr` is independent of the network.
- `cicd` consumes the ECR repository identifier and the EKS cluster identifiers
  to build the OIDC role and the scoped EKS access entry.

Pass values between modules through outputs and input variables. Avoid circular
module dependencies.

---

## Architecture Principle

Do not change the established architecture merely to introduce additional AWS
services. Architecture changes should have a clear security, reliability,
maintainability, cost, or learning reason.
