# network module

Provisions the VPC and the networking the EKS cluster runs in.

## Responsibilities

- VPC (`vpc_cidr`)
- Two public and two private subnets across two AZs
- Internet Gateway + public route table
- Private route table
- Optional single **NAT Gateway** (+ Elastic IP) and the private `0.0.0.0/0`
  route (gated by `enable_nat_gateway`)
- Optional **S3 gateway VPC endpoint** (gated by `enable_vpc_endpoints`,
  no hourly cost)

EKS nodes run in the private subnets and receive no public IP. When
`enable_nat_gateway = false`, the private route table has no default route — a
NAT-free design must supply another egress path (e.g. interface endpoints for
ECR/STS/Logs plus the S3 gateway endpoint). For the current dev setup NAT is
expected to be `true`.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `app_name` | string | — | Base for derived names. |
| `environment` | string | — | Base for derived names. |
| `aws_region` | string | — | Region; also derives AZs and endpoint service names. |
| `vpc_cidr` | string | — | VPC IPv4 CIDR (/16–/28). |
| `public_subnet_cidr1` / `public_subnet_cidr2` | string | — | Public subnet CIDRs (AZ a / AZ b). |
| `private_subnet_cidr1` / `private_subnet_cidr2` | string | — | Private subnet CIDRs (AZ a / AZ b). |
| `enable_nat_gateway` | bool | `false` | Provision NAT Gateway + EIP + private default route. |
| `enable_vpc_endpoints` | bool | `false` | Provision the S3 gateway endpoint. |
| `tags` | map(string) | `{}` | Common tags. |

## Outputs

| Name | Description |
|------|-------------|
| `vpc_id` | VPC ID. |
| `public_subnet_ids` | List of the two public subnet IDs. |
| `private_subnet_ids` | List of the two private subnet IDs (EKS nodes). |
| `nat_gateway_id` | NAT Gateway ID when enabled, otherwise `null`. |

## Cost note

A NAT Gateway bills hourly plus per-GB. A single NAT (not one per AZ) is the
cost-conscious dev choice. The S3 gateway endpoint has no hourly charge.
