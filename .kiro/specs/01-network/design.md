# 01 — Network Module Design

## Overview

A small, reusable VPC module sized for a two-AZ EKS dev cluster. Private subnets
host the managed node group; public subnets exist for egress (NAT) and are the
only place a NAT gateway or public-facing resource would live.

```text
VPC (var.vpc_cidr)
 ├── Public subnet AZ-a ─┐
 ├── Public subnet AZ-b ─┴── IGW (0.0.0.0/0)
 ├── Private subnet AZ-a ─┐
 └── Private subnet AZ-b ─┴── outbound via chosen option (NAT or VPC endpoints)
```

## Connectivity Decision (document the choice)

Private EKS nodes need outbound reach to ECR, the control plane, and logs.
Evaluate before implementing:

| Option | Pros | Cons | Recurring cost |
|--------|------|------|----------------|
| Single NAT gateway | Simplest; one route for all egress | Single-AZ egress; data-processing fee | ~$0.045/hr + ~$0.045/GB (verify) |
| VPC endpoints (ECR api/dkr, S3 gw, Logs, STS, EKS) | Private AWS-service traffic; no NAT needed for these | More resources; interface endpoints have hourly cost | per-endpoint hourly (verify) |
| Public-subnet nodes | No NAT cost | Public IPs on nodes — violates private-by-default | n/a (not preferred) |

Recommended for dev: start with a **single NAT gateway** for simplicity, and
note VPC endpoints as the more private/potentially cheaper alternative. Make the
NAT toggle a variable (`enable_nat_gateway`) so the choice is explicit.

Verify current regional pricing before committing cost figures.

## Resources

- `aws_vpc`
- `aws_subnet` (2 public, 2 private) using a data source for AZs
- `aws_internet_gateway`
- `aws_route_table` + `aws_route_table_association` (public to IGW; private to
  NAT or local-only when endpoints are used)
- `aws_eip` + `aws_nat_gateway` when `enable_nat_gateway = true`
- `aws_vpc_endpoint` resources when the endpoint option is chosen (future-friendly;
  gate behind a variable)

## Variables (illustrative)

`app_name`, `environment`, `aws_region`, `vpc_cidr`, `public_subnet_cidrs`,
`private_subnet_cidrs`, `enable_nat_gateway`, `tags`.

## Outputs

`vpc_id`, `public_subnet_ids`, `private_subnet_ids`. Expose NAT/endpoint ids only
if a consumer needs them.

## Tagging

Merge common tags (`Project`, `Environment`, `ManagedBy`, `Owner`) with any
EKS-required subnet tags.

## Security

No public ingress. Private subnets have no public IP assignment. Egress limited
to what the nodes need.
