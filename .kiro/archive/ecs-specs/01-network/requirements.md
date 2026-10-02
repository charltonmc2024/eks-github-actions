# Requirements Document

## Introduction

This spec covers the Terraform network module for the Erudition Solution development environment. The
network module owns ONLY VPC-layer infrastructure: the VPC, public and private subnets, the Internet
Gateway, the public and private route tables, an optional NAT Gateway, optional S3/DynamoDB Gateway
endpoints, and the networking outputs downstream modules need. It is a reusable module at
`ecs-terraform/modules/network/`, consumed by the Terraform root module at `ecs-terraform/envs/dev/`.

The ALB and ECS security groups and the CloudFront → ALB → ECS traffic relationship are NOT part of this
module — they are owned by a future `03-backend` spec. Because the S3 and DynamoDB endpoints created here
are Gateway endpoints (which do not use security groups), the network module creates no security groups at
all.

This is a clean-slate, brand-new deployment. The previous development infrastructure has been intentionally
deleted, so there is no existing state to preserve. The `envs/dev` root module is the Terraform root module
and the source of truth for the development environment. Running `terraform plan` against a clean state
represents the CREATION of new development infrastructure, not a migration of existing resources.

The NAT Gateway and the S3/DynamoDB Gateway endpoints are module-level capabilities that default to off so
the module stays reusable across environments. For the DEV environment they are ENABLED
(`enable_nat_gateway = true`, `enable_vpc_endpoints = true`): private ECS Fargate tasks run with
`assign_public_ip = false` and reach S3 and DynamoDB through the Gateway endpoints, while all other required
outbound traffic egresses via a single public NAT Gateway. This DEV networking capability — one NAT Gateway
plus the S3 and DynamoDB Gateway endpoints — is what satisfies the private-egress dependency currently
documented as OPEN/BLOCKING by the 03-backend spec; it must be in place before ECS tasks are deployed.

DEV intentionally uses ONE NAT Gateway (not one per Availability Zone) as a deliberate cost/availability
tradeoff: lower development cost and a simpler implementation, at the price of NAT outbound connectivity
that is not AZ-redundant. A production high-availability topology may use one NAT Gateway per AZ with each
private subnet routing `0.0.0.0/0` to the NAT Gateway in its own AZ, but that is outside the current
DEV-only scope. No interface (PrivateLink) VPC endpoints — for `ecr.api`, `ecr.dkr`, `logs`, `ecs`,
`ecs-agent`, `ecs-telemetry`, `sts`, `secretsmanager`, or `ssm` — are introduced for DEV; the NAT Gateway
provides the general outbound path, and no endpoint security group is created (so the network module still
requires no `03-backend` security-group input and no circular dependency is introduced).

The bootstrap configuration remains separate and is responsible for creating the Terraform remote-state
infrastructure used by the development environment.

## Glossary

- **Network_Module**: The reusable Terraform module at `ecs-terraform/modules/network/`
- **Dev_Root**: The Terraform root module and source of truth for the development environment at
  `ecs-terraform/envs/dev/`
- **VPC**: AWS Virtual Private Cloud — the isolated network boundary for the Erudition Solution platform
- **IGW**: AWS Internet Gateway — enables outbound and inbound public internet traffic for public subnets
- **NAT_Gateway**: AWS NAT Gateway — enables outbound-only internet access from private subnets without
  exposing them to inbound public traffic
- **EIP**: Elastic IP address — a static public IPv4 address allocated for use by the NAT Gateway
- **Public_Subnet**: A subnet with a route to the IGW and `map_public_ip_on_launch = true`
- **Private_Subnet**: A subnet with no inbound internet route and no auto-assigned public IPs
- **Route_Table**: An AWS route table that controls traffic routing for associated subnets
- **VPC_Endpoint**: An AWS PrivateLink or Gateway endpoint allowing services to communicate without
  traversing the public internet
- **name_prefix**: The derived local value `"${var.app_name}-${var.environment}"` used as a consistent
  naming base for all resources

---

## Requirements

### Requirement 1: VPC

**User Story:** As a platform engineer, I want a single VPC with DNS support enabled, so that ECS tasks and
other AWS services can resolve hostnames and reach each other by DNS name.

#### Acceptance Criteria

1. THE Network_Module SHALL create exactly one `aws_vpc` resource with the CIDR block supplied via
   `var.vpc_cidr`, where `var.vpc_cidr` is a valid IPv4 CIDR block in the range `/16` to `/28`.
2. THE Network_Module SHALL enable `enable_dns_support = true` on the VPC.
3. THE Network_Module SHALL enable `enable_dns_hostnames = true` on the VPC.
4. THE Network_Module SHALL tag the VPC with `Name = "${local.name_prefix}-vpc"` and the common tag set
   containing Project, Environment, ManagedBy, and Owner keys, where each key has a non-empty string value.
5. IF `var.vpc_cidr` is not a valid IPv4 CIDR block, THEN THE Network_Module SHALL produce a Terraform
   validation error before any resource is created or modified.

---

### Requirement 2: Public Subnets

**User Story:** As a platform engineer, I want two public subnets spread across two availability zones, so
that internet-facing resources such as the NAT Gateway have redundant placement.

#### Acceptance Criteria

1. THE Network_Module SHALL create `aws_subnet.public1` in availability zone `"${var.aws_region}a"` using
   CIDR block `var.public_subnet_cidr1`, with `map_public_ip_on_launch = true`. The CIDR block must be a
   valid IPv4 CIDR within `var.vpc_cidr` and must not overlap `var.public_subnet_cidr2`.
2. THE Network_Module SHALL create `aws_subnet.public2` in availability zone `"${var.aws_region}b"` using
   CIDR block `var.public_subnet_cidr2`, with `map_public_ip_on_launch = true`. The CIDR block must be a
   valid IPv4 CIDR within `var.vpc_cidr` and must not overlap `var.public_subnet_cidr1`.
3. THE Network_Module SHALL tag public subnet 1 with `Name = "${local.name_prefix}-public-subnet-1"` and
   public subnet 2 with `Name = "${local.name_prefix}-public-subnet-2"`, along with the common tag set
   (Project, Environment, ManagedBy, Owner).
4. THE Network_Module SHALL associate each public subnet with a route table containing a `0.0.0.0/0` route
   targeting the Internet Gateway, making the subnets effectively internet-facing.

---

### Requirement 3: Private Subnets

**User Story:** As a platform engineer, I want two private subnets spread across two availability zones with
no auto-assigned public IPs, so that ECS Fargate tasks run without direct internet exposure.

#### Acceptance Criteria

1. THE Network_Module SHALL create `aws_subnet.private1` in availability zone `"${var.aws_region}a"` using
   CIDR block `var.private_subnet_cidr1`, with `map_public_ip_on_launch = false`. The CIDR must be a valid
   IPv4 CIDR within `var.vpc_cidr` and must not overlap `var.private_subnet_cidr2`.
2. THE Network_Module SHALL create `aws_subnet.private2` in availability zone `"${var.aws_region}b"` using
   CIDR block `var.private_subnet_cidr2`, with `map_public_ip_on_launch = false`. The CIDR must be a valid
   IPv4 CIDR within `var.vpc_cidr` and must not overlap `var.private_subnet_cidr1`.
3. THE Network_Module SHALL tag private subnet 1 with `Name = "${local.name_prefix}-private-subnet-1"` and
   private subnet 2 with `Name = "${local.name_prefix}-private-subnet-2"`, along with the common tag set
   (Project, Environment, ManagedBy, Owner).

---

### Requirement 4: Internet Gateway

**User Story:** As a platform engineer, I want an Internet Gateway attached to the VPC, so that resources in
public subnets can reach and be reached from the public internet.

#### Acceptance Criteria

1. THE Network_Module SHALL create one `aws_internet_gateway` resource attached to the VPC created within
   the same module invocation.
2. THE Network_Module SHALL tag the Internet Gateway with `Name = "${local.name_prefix}-igw"` and all keys
   defined in the common tag set.
3. THE Network_Module SHALL ensure the public subnet route tables contain a `0.0.0.0/0` → IGW route so
   that public subnets have an internet-facing path.

---

### Requirement 5: Public Route Table

**User Story:** As a platform engineer, I want a single shared public route table with a default route to
the IGW associated with both public subnets, so that instances in public subnets can access the internet.

#### Acceptance Criteria

1. THE Network_Module SHALL create one `aws_route_table` for public subnets with a default IPv4 route
   (`0.0.0.0/0`) pointing to the Internet Gateway, with no additional routes defined in the resource block.
2. THE Network_Module SHALL create `aws_route_table_association` resources associating `public1` and
   `public2` with the public route table.
3. THE Network_Module SHALL tag the public route table with
   `Name = "${local.name_prefix}-public-route-table"` and the common tag set.

---

### Requirement 6: Private Route Table

**User Story:** As a platform engineer, I want a private route table whose default route is conditionally
present based on whether the NAT Gateway is enabled, so that private subnets have internet egress only when
the NAT Gateway is active.

#### Acceptance Criteria

1. THE Network_Module SHALL create exactly one `aws_route_table` resource for private subnets, distinct
   from any public route table.
2. WHEN `var.enable_nat_gateway` is `true`, THE Network_Module SHALL add exactly one default route with
   destination CIDR `0.0.0.0/0` to the private route table, targeting the NAT Gateway created in the same
   module.
3. IF `var.enable_nat_gateway` is `false`, THEN THE Network_Module SHALL NOT add any default route to the
   private route table, such that a `terraform plan` shows zero `aws_route` resources for the private route
   table.
4. THE Network_Module SHALL create exactly two `aws_route_table_association` resources, one associating
   `private1` and one associating `private2` with the single private route table.
5. THE Network_Module SHALL tag the private route table with
   `Name = "${local.name_prefix}-private-route-table"` and all key-value pairs in the common tag set.

---

### Requirement 7: NAT Gateway

**User Story:** As a platform engineer, I want an optional NAT Gateway (module default off for reusability)
that is ENABLED for the DEV environment, so that private ECS Fargate tasks have an outbound path for
required services and general egress while remaining private with `assign_public_ip = false`.

#### Acceptance Criteria

1. THE Network_Module SHALL expose a boolean variable `enable_nat_gateway` with type `bool`, a non-empty
   description, and `default = false`.
2. WHEN `var.enable_nat_gateway` is `true`, THE Network_Module SHALL create one `aws_eip` in domain `"vpc"`
   and one `aws_nat_gateway` placed in the first public subnet.
3. WHEN `var.enable_nat_gateway` is `true`, THE Network_Module SHALL set `depends_on` on the NAT Gateway
   to reference the Internet Gateway to ensure correct creation order.
4. WHEN `var.enable_nat_gateway` is `true`, THE Network_Module SHALL create a route in the private subnet
   route table with destination `0.0.0.0/0` targeting the NAT Gateway.
5. WHEN `var.enable_nat_gateway` is `false`, THE Network_Module SHALL create neither an EIP nor a NAT
   Gateway, and the private subnet route table SHALL NOT contain a route with destination `0.0.0.0/0`.
6. THE Network_Module SHALL tag the EIP with `Name = "${local.name_prefix}-nat-eip"` and the common tag
   set when it is created.
7. THE Network_Module SHALL tag the NAT Gateway with `Name = "${local.name_prefix}-natgw"` and the common
   tag set when it is created.
8. FOR the DEV environment THE Dev_Root SHALL set `enable_nat_gateway = true`, provisioning exactly ONE
   public NAT Gateway (with its EIP) whose purpose is outbound connectivity from private workloads such as
   ECS Fargate. This single NAT Gateway is a deliberate DEV cost/availability tradeoff and SHALL NOT be
   AZ-redundant; the Network_Module SHALL NOT require one NAT Gateway per Availability Zone for DEV. A
   production HA topology may use one NAT Gateway per AZ, but that is outside the current DEV scope.
9. THE DEV NAT Gateway SHALL provide outbound-only egress: it SHALL NOT make the private subnets publicly
   reachable, private ECS tasks SHALL continue to use `assign_public_ip = false`, and no unsolicited inbound
   internet connection SHALL be able to initiate through the NAT Gateway. Public subnets continue to route
   `0.0.0.0/0` to the Internet Gateway; the private route table routes `0.0.0.0/0` to the NAT Gateway.

---

### Requirement 8: VPC Gateway Endpoints

**User Story:** As a platform engineer, I want VPC Gateway endpoints for S3 and DynamoDB (module default
off for reusability) ENABLED for the DEV environment, so that S3 and DynamoDB traffic from private workloads
uses the Gateway endpoints directly instead of the NAT Gateway, reducing data-transfer cost and keeping that
same-Region traffic off the NAT path.

#### Acceptance Criteria

1. THE Network_Module SHALL expose a boolean variable `enable_vpc_endpoints` with type `bool`, a non-empty
   description, and `default = false`.
2. WHERE `enable_vpc_endpoints` is enabled, WHEN `var.enable_vpc_endpoints` is `true`, THE Network_Module
   SHALL create exactly one `aws_vpc_endpoint` resource of type `"Gateway"` for the S3 service using
   service name `com.amazonaws.${var.aws_region}.s3`, associated with the public route table and all
   private route tables.
3. WHERE `enable_vpc_endpoints` is enabled, WHEN `var.enable_vpc_endpoints` is `true`, THE Network_Module
   SHALL create exactly one `aws_vpc_endpoint` resource of type `"Gateway"` for the DynamoDB service using
   service name `com.amazonaws.${var.aws_region}.dynamodb`, associated with the public route table and all
   private route tables.
4. IF `var.enable_vpc_endpoints` is `false`, THEN THE Network_Module SHALL create zero `aws_vpc_endpoint`
   resources, such that `terraform plan` shows no VPC endpoint additions or changes.
5. WHEN a VPC endpoint is created, THE Network_Module SHALL apply a `Name` tag with value
   `"${local.name_prefix}-s3-endpoint"` or `"${local.name_prefix}-dynamodb-endpoint"` respectively, plus
   all key-value pairs from the common tag set.
6. FOR the DEV environment THE Dev_Root SHALL set `enable_vpc_endpoints = true`, enabling the S3 and
   DynamoDB Gateway endpoints, each associated with the route table(s) used by the private subnets. These
   are Gateway endpoints only: the Network_Module SHALL NOT create an S3 or DynamoDB interface endpoint and
   SHALL NOT create an endpoint security group for them.
7. THE intended private routing model SHALL be: S3 traffic uses the S3 Gateway endpoint; DynamoDB traffic
   uses the DynamoDB Gateway endpoint; all other IPv4 outbound traffic uses the `0.0.0.0/0` route to the NAT
   Gateway. Because a Gateway endpoint installs a more specific prefix-list route than the `0.0.0.0/0` NAT
   route, S3 and DynamoDB traffic SHALL use those endpoints rather than the NAT default route.

---

### Requirement 9: Module Variables

**User Story:** As a platform engineer, I want the network module to declare all inputs as typed, described
variables with validation where appropriate, so that misconfigured module calls fail at plan time with
informative errors rather than at apply time with cryptic messages.

#### Acceptance Criteria

1. THE Network_Module SHALL declare a variable `app_name` of type `string` with a non-empty description and
   a validation rule that rejects empty strings.
2. THE Network_Module SHALL declare a variable `environment` of type `string` with a non-empty description
   and a validation rule that rejects empty strings.
3. THE Network_Module SHALL declare a variable `aws_region` of type `string` with a non-empty description.
4. THE Network_Module SHALL declare a variable `vpc_cidr` of type `string` with a non-empty description and
   a validation rule that rejects values not matching a valid IPv4 CIDR notation pattern (e.g. using
   `can(cidrhost(var.vpc_cidr, 0))`).
5. THE Network_Module SHALL declare variables `public_subnet_cidr1`, `public_subnet_cidr2`,
   `private_subnet_cidr1`, and `private_subnet_cidr2`, each of type `string` with a non-empty description
   and a validation rule that rejects values not matching a valid IPv4 CIDR notation pattern.
6. THE Network_Module SHALL declare a variable `enable_nat_gateway` of type `bool` with a non-empty
   description and `default = false`.
7. THE Network_Module SHALL declare a variable `enable_vpc_endpoints` of type `bool` with a non-empty
   description and `default = false`.
8. THE Network_Module SHALL declare a variable `tags` of type `map(string)` with a non-empty description
   and `default = {}`, allowing the caller to supply the common tag set (Project, Environment, ManagedBy,
   Owner).

---

### Requirement 10: Module Outputs

**User Story:** As a platform engineer, I want the network module to expose the resource identifiers that
other modules and the deployment root require, so that downstream modules can reference network resources
without hardcoding any IDs or ARNs.

#### Acceptance Criteria

1. THE Network_Module SHALL output `vpc_id` — the ID of the VPC — with a non-empty description of at least
   1 character.
2. THE Network_Module SHALL output `public_subnet_ids` — a list containing exactly the IDs of `public1`
   and `public2` (in any order) — with a non-empty description.
3. THE Network_Module SHALL output `private_subnet_ids` — a list containing exactly the IDs of `private1`
   and `private2` (in any order) — with a non-empty description.
4. WHERE `var.enable_nat_gateway` is `true`, THE Network_Module SHALL output `nat_gateway_id` as a
   non-null string containing the ID of the created NAT Gateway.
5. IF `var.enable_nat_gateway` is `false`, THEN THE Network_Module SHALL output `nat_gateway_id` as
   `null`.

---

### Requirement 11: Dev Root Integration

**User Story:** As a platform engineer, I want the `envs/dev` root module to call the network module with
values from `terraform.tfvars`, so that the dev environment is created from a single source of truth without
duplicating resource definitions.

#### Acceptance Criteria

1. THE Dev_Root SHALL contain a `module "network"` block in `envs/dev/main.tf` that references the
   Network_Module source at `../../modules/network`.
2. THE Dev_Root SHALL pass `app_name`, `environment`, `aws_region`, `vpc_cidr`, `public_subnet_cidr1`,
   `public_subnet_cidr2`, `private_subnet_cidr1`, `private_subnet_cidr2`, `enable_nat_gateway`, and
   `enable_vpc_endpoints` into the module call.
3. THE Dev_Root SHALL pass a `tags` map containing at minimum the keys `Project`, `Environment`,
   `ManagedBy`, and `Owner` with non-empty string values into the module call.
4. THE Dev_Root SHALL declare corresponding input variables in `envs/dev/variables.tf` with explicit types,
   non-empty descriptions, and defaults of the correct type for each variable (`bool` for
   `enable_nat_gateway` and `enable_vpc_endpoints`, `string` for CIDRs and names).
5. THE Dev_Root SHALL supply values for all variables in `envs/dev/terraform.tfvars`, including
   `app_name = "eruditiontx-app"`, `environment = "ecs-dev"`, `aws_region = "us-east-1"`,
   `enable_nat_gateway = true`, and `enable_vpc_endpoints = true`.
6. WITHIN `envs/dev/`, THE Dev_Root SHALL reference network module outputs (e.g. `module.network.vpc_id`,
   `module.network.public_subnet_ids`, `module.network.private_subnet_ids`) wherever downstream resource
   definitions require network resource identifiers.
7. WHEN `terraform plan` is run against a clean state after `terraform init`, THE Dev_Root SHALL produce a
   plan consisting exclusively of resource creations, showing 0 resources to destroy and 0 resources to
   change, representing the creation of new development infrastructure rather than a migration.

---

### Requirement 12: Naming and Tagging Consistency

**User Story:** As a platform engineer, I want all network resources to use a consistent naming scheme
derived from a single `local.name_prefix` value and to carry common tags, so that resources are easy to
identify in the AWS console and costs can be attributed correctly.

#### Acceptance Criteria

1. THE Network_Module SHALL define a local value `name_prefix` computed as
   `"${var.app_name}-${var.environment}"` and use it as the base for every resource `Name` tag.
2. THE Network_Module SHALL merge `var.tags` into each resource's tag map so that the caller-supplied
   common tags (Project, Environment, ManagedBy, Owner) are applied uniformly.
3. THE Network_Module SHALL NOT repeat name derivation logic inline across resource definitions; all name
   construction SHALL reference `local.name_prefix`.
4. IF `var.app_name` or `var.environment` is an empty string, THEN THE Network_Module SHALL raise a
   validation error indicating which variable is invalid before creating any resources.
5. WHEN the Network_Module applies tags to a resource, THE Network_Module SHALL include a `Name` tag whose
   value is derived from `local.name_prefix` followed by a resource-type suffix that uniquely identifies
   the resource within the module (for example `local.name_prefix` + `-vpc`,
   `local.name_prefix` + `-igw`), ensuring no two distinct resources share the same `Name` tag value.

---

### Requirement 13: Terraform Format Compliance

**User Story:** As a platform engineer, I want all Terraform files in the module and dev root to be
formatted with `terraform fmt`, so that pull requests pass the CI format check without manual intervention.

#### Acceptance Criteria

1. THE Network_Module SHALL produce zero diff when `terraform fmt -recursive` is run against
   `ecs-terraform/modules/network/`.
2. THE Dev_Root SHALL produce zero diff when `terraform fmt -recursive` is run against
   `ecs-terraform/envs/dev/`.
3. WHEN `terraform fmt -check -recursive` is run in CI against `ecs-terraform/modules/network/`, it SHALL
   exit with a non-zero status code if any file is not properly formatted, causing the CI pipeline stage to
   fail.
4. WHEN `terraform fmt -check -recursive` is run in CI against `ecs-terraform/envs/dev/`, it SHALL exit
   with a non-zero status code if any file is not properly formatted, causing the CI pipeline stage to
   fail.
5. WHEN `terraform validate` is run against the Dev_Root after `terraform init`, THE Dev_Root SHALL report
   no errors.
