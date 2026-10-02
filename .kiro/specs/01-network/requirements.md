# 01 — Network Module Requirements

## Scope

Provide the VPC networking that the EKS cluster and its managed node group need,
for the Erudition landing-page dev environment only. Reusable module at
`eks-terraform/modules/network`, consumed by `eks-terraform/envs/dev`.

Out of scope: ECS, ALB, CloudFront, S3 frontend, DynamoDB, Route 53, ACM.

## Requirements

1. A VPC with a configurable CIDR (variable, not hardcoded).
2. Public subnets across two Availability Zones (for egress / NAT).
3. Private subnets across two Availability Zones (for EKS nodes).
4. An Internet Gateway attached to the VPC.
5. Route tables and associations: public subnets route to the IGW; private
   subnets route outbound per the chosen connectivity option.
6. Outbound connectivity for private nodes so they can pull images from ECR,
   reach the EKS control plane, and send logs. This is a **deliberate design
   choice** — compare and document before selecting:
   - single NAT gateway (cost-conscious default to evaluate), or
   - VPC endpoints (ECR API/DKR, S3 gateway, CloudWatch Logs, STS, EKS), or
   - a documented combination.
7. Private nodes must not receive public IP addresses.
8. Subnets carry any tags EKS requires for subnet discovery where applicable.
9. All environment-specific values (CIDRs, AZ count, NAT toggle) are variables
   with types, descriptions, and validation where appropriate.
10. Outputs expose only what downstream modules need: `vpc_id`,
    `public_subnet_ids`, `private_subnet_ids` (and the chosen connectivity
    identifiers only if a consumer needs them).

## Non-Goals

- No public ingress resources (access to the app is via `kubectl
  port-forward`).
- No per-AZ NAT redundancy for dev unless explicitly requested.

## Acceptance

- `terraform validate` passes for the module via the dev root.
- `terraform plan` shows only network resources to add, no unexpected
  destroys/replaces.
- No hardcoded account IDs, VPC/subnet IDs, or ARNs.
