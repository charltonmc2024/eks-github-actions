# Requirements Document
## Introduction
This spec covers the Terraform edge module for the Erudition Solution development environment. The
Edge_Module owns the public entry point for the platform and the static frontend origin: a private S3
frontend bucket, an Origin Access Control, and a single CloudFront distribution that serves the static
frontend from S3 and forwards `/api/*` requests to the internal application through a CloudFront VPC
Origin that the Edge_Module itself creates. It is a reusable module at `ecs-terraform/modules/edge/`,
consumed by the Terraform root module at `ecs-terraform/envs/dev/`.
The Edge_Module provides the application's public entry point through Amazon CloudFront. Application
resources behind CloudFront remain private. CloudFront accesses the private S3 frontend origin using Origin
Access Control (OAC) and accesses the internal Application Load Balancer through a CloudFront VPC Origin
that the Edge_Module itself creates. The request flow is Internet → CloudFront → {default behavior → private
S3 via OAC | `/api/*` → CloudFront VPC Origin (created by edge) → internal ALB → ECS Fargate → DynamoDB}.
The Edge_Module sits downstream of the existing backend module and consumes only its outputs:
- **03-backend (upstream)** owns the ECR repository, the internal Application Load Balancer, and the ECS
  Fargate service. It exposes the internal ALB information the Edge_Module needs — the ALB ARN
  (`module.backend.alb_arn`) and the ALB DNS name (`module.backend.alb_dns_name`) — and it does NOT create
  or output a CloudFront VPC Origin. The Edge_Module CREATES exactly one `aws_cloudfront_vpc_origin`
  associated with the internal ALB (a CloudFront-specific integration resource that belongs with the edge
  infrastructure), consuming `module.backend.alb_arn` as that VPC Origin's endpoint/target and
  `module.backend.alb_dns_name` as the API origin's `domain_name`. The Edge_Module MUST NOT create the ALB,
  the ECS service, or any network/data/backend resource. The dependency direction is network/data → backend
  → edge; the Edge_Module MUST NOT be referenced by 03-backend and MUST NOT create a circular dependency.
  **Upstream integration requirement (03-backend output change).** The new resource-ownership model requires
  03-backend to (a) STOP creating the `aws_cloudfront_vpc_origin` resource, (b) STOP outputting
  `vpc_origin_id`, and (c) START outputting `alb_arn` (the internal ALB ARN) alongside its existing
  `alb_dns_name` output, so the Edge_Module can consume the ALB ARN and DNS name to build the VPC Origin.
  This 03-backend change is recorded here as an upstream integration requirement only; it is NOT implemented
  by this spec, and it introduces no dependency from 03-backend back to the Edge_Module.
- **01-network / 02-data (upstream, transitive)** own the VPC, subnets, DynamoDB table, and ECS placement.
  The Edge_Module creates no compute and no network or data resource, and ECS tasks remain in private
  subnets — an invariant the edge design MUST NOT violate.
This is a clean-slate, brand-new deployment. The previous development infrastructure has been intentionally
deleted, so there is no existing state to preserve and there are no resources to migrate. Running
`terraform plan` against a clean state represents the CREATION of new development infrastructure. This spec
MUST NOT introduce `moved` blocks or any state-migration logic. This spec is DEV only; no staging or
production resources are created, and no `terraform apply` is performed as part of this spec.
Two connectivity facts drive the design and are stated up front because they cross module boundaries:
- **Viewer TLS (HTTPS on the default domain).** Viewer → CloudFront is HTTPS on the default
  `*.cloudfront.net` domain using the CloudFront default viewer certificate. DEV uses no custom viewer
  alias, no Route 53 record, and no custom ACM certificate. Viewer HTTP is redirected to HTTPS at
  CloudFront.
- **Origin hop (HTTP over the private path).** CloudFront reaches the private S3 bucket through OAC (signed,
  private) and reaches the internal ALB over HTTP through the edge-created VPC Origin path. The internal ALB
  stays private; HTTP on the private VPC Origin path is acceptable for DEV because viewer TLS is terminated
  at CloudFront and the origin hop never traverses the public internet.
## Glossary
- **Edge_Module**: The reusable Terraform module at `ecs-terraform/modules/edge/`
- **Dev_Root**: The Terraform root module and source of truth for the development environment at
  `ecs-terraform/envs/dev/`
- **Backend_Module**: The existing module at `ecs-terraform/modules/backend/` exposing `alb_arn`,
  `alb_dns_name`, `ecr_repository_url`, `ecs_cluster_name`, and `ecs_service_name` (and NO `vpc_origin_id`,
  because the Edge_Module now owns the CloudFront VPC Origin)
- **CloudFront_Distribution**: The single `aws_cloudfront_distribution` that is the platform's only
  internet-facing resource
- **Frontend_Bucket**: The private `aws_s3_bucket` that stores the compiled static frontend assets
- **OAC**: The `aws_cloudfront_origin_access_control` that lets CloudFront read the Frontend_Bucket without
  the bucket being public and without legacy Origin Access Identity
- **S3_Origin**: The CloudFront origin block pointing at the Frontend_Bucket's regional domain, secured by
  the OAC
- **Vpc_Origin_Resource**: The single edge-owned `aws_cloudfront_vpc_origin` (for example
  `aws_cloudfront_vpc_origin.api`) that the Edge_Module CREATES, associating it with the internal ALB by
  using the consumed `module.backend.alb_arn` as its endpoint/target; HTTP from this VPC Origin to the
  internal ALB is acceptable for DEV
- **VPC_Origin_Api**: The CloudFront origin block that attaches the edge-created Vpc_Origin_Resource via
  `vpc_origin_config` (referencing that resource's id, for example `aws_cloudfront_vpc_origin.api.id`) and
  sets its `domain_name` to `module.backend.alb_dns_name`, reaching the internal ALB over the private VPC
  Origin path
- **Default_Behavior**: The CloudFront default cache behavior (path pattern `*`) that routes to the
  S3_Origin
- **Api_Behavior**: The ordered CloudFront cache behavior (path pattern `/api/*`) that routes to the
  VPC_Origin_Api
- **Viewer_Certificate**: The CloudFront viewer certificate configuration; for DEV this is the CloudFront
  default certificate (`cloudfront_default_certificate = true`)
- **Origin_Shield**: CloudFront Origin Shield — an optional caching layer, distinct from AWS Shield
  Standard, and NOT provisioned for DEV
- **Shield_Standard**: AWS Shield Standard, the automatic baseline DDoS protection for CloudFront that
  requires no Terraform resource
## Requirements
### Requirement 1: CloudFront as the Public Entry Point
**User Story:** As a platform engineer, I want CloudFront to be the single internet-facing resource, so that
every other component stays private and there is exactly one public surface to secure.
#### Acceptance Criteria
1. THE Edge_Module SHALL create exactly one `aws_cloudfront_distribution` as the only internet-facing
   resource in the architecture.
2. THE Edge_Module SHALL NOT create any public load balancer, public IP, public S3 website endpoint, or any
   other internet-facing resource besides the CloudFront_Distribution.
3. THE CloudFront_Distribution SHALL be enabled and SHALL serve both the static frontend (from the
   S3_Origin) and the application API (through the VPC_Origin_Api).
4. THE Edge_Module SHALL NOT create the ALB, ECS, DynamoDB, VPC, subnet, route table, or VPC endpoint
   resources; those belong to 01-network, 02-data, and 03-backend.
### Requirement 2: Default CloudFront Domain (No Custom Alias)
**User Story:** As a platform engineer, I want DEV to use the default `*.cloudfront.net` domain, so that no
custom domain, DNS, or certificate is required to reach the environment.
#### Acceptance Criteria
1. THE CloudFront_Distribution SHALL use the default `*.cloudfront.net` domain assigned by CloudFront.
2. THE Edge_Module SHALL NOT set any `aliases` (custom viewer alias) on the CloudFront_Distribution for DEV.
3. THE Edge_Module SHALL NOT invent, hardcode, or require any custom domain name for DEV.
4. THE Edge_Module SHALL expose the default CloudFront domain name as an output so operators and CI/CD can
   reach the environment.
### Requirement 3: No Route 53 Resources for DEV
**User Story:** As a platform engineer, I want no DNS resources provisioned in DEV, so that the environment
runs on the default CloudFront domain without an owned hosted zone.
#### Acceptance Criteria
1. THE Edge_Module SHALL NOT create any `aws_route53_zone`.
2. THE Edge_Module SHALL NOT create any `aws_route53_record`.
3. THE Edge_Module SHALL NOT consume or require any hosted zone id or DNS name input for DEV.
### Requirement 4: No Custom ACM Certificate for DEV
**User Story:** As a platform engineer, I want DEV to rely on the CloudFront default viewer certificate, so
that no ACM certificate must be created or validated to serve HTTPS.
#### Acceptance Criteria
1. THE Viewer_Certificate SHALL set `cloudfront_default_certificate = true` for DEV.
2. THE Edge_Module SHALL NOT create any `aws_acm_certificate`.
3. THE Edge_Module SHALL NOT create any `aws_acm_certificate_validation`.
4. THE Edge_Module SHALL NOT declare or consume any `acm_certificate_arn` input for DEV.
### Requirement 5: Private S3 Frontend Bucket
**User Story:** As a platform engineer, I want the frontend bucket to stay private and readable only by
CloudFront, so that static assets are never exposed directly to the public internet.
#### Acceptance Criteria
1. THE Edge_Module SHALL create exactly one Frontend_Bucket, named from `local.name_prefix` (for example
   `${var.app_name}-${var.environment}-frontend`).
2. THE Edge_Module SHALL apply an `aws_s3_bucket_public_access_block` to the Frontend_Bucket with
   `block_public_acls`, `block_public_policy`, `ignore_public_acls`, and `restrict_public_buckets` all set
   to `true`.
3. THE Frontend_Bucket policy SHALL grant read access (for example `s3:GetObject`) ONLY to the
   CloudFront_Distribution, scoped by the distribution ARN via the OAC service principal condition, and
   SHALL NOT grant public read access.
4. THE Edge_Module SHALL NOT enable S3 static website hosting and SHALL NOT use the S3 website endpoint as a
   CloudFront origin; the S3_Origin SHALL use the bucket regional domain reached through the OAC.
5. THE Frontend_Bucket SHALL NOT be public and SHALL NOT grant any `0.0.0.0/0` or `Principal: "*"` read
   access outside the CloudFront OAC condition.
### Requirement 6: Origin Access Control (Not Legacy OAI)
**User Story:** As a platform engineer, I want CloudFront to reach S3 via Origin Access Control, so that the
bucket stays private using the current AWS-recommended mechanism rather than a deprecated identity.
#### Acceptance Criteria
1. THE Edge_Module SHALL create an `aws_cloudfront_origin_access_control` with
   `origin_access_control_origin_type = "s3"`, `signing_behavior = "always"`, and
   `signing_protocol = "sigv4"`.
2. THE S3_Origin SHALL reference the OAC via `origin_access_control_id` on the CloudFront origin block.
3. THE Edge_Module SHALL NOT create or use a legacy `aws_cloudfront_origin_access_identity` (OAI).
### Requirement 7: Default Behavior Routes to the S3 Frontend
**User Story:** As a platform engineer, I want the default cache behavior to serve the static frontend from
S3, so that page loads and static assets come from the private bucket through CloudFront.
#### Acceptance Criteria
1. THE Default_Behavior (path pattern `*`) SHALL target the S3_Origin.
2. THE Default_Behavior SHALL allow the read methods appropriate for static content (for example `GET`,
   `HEAD`, and optionally `OPTIONS`).
3. THE Default_Behavior MAY cache static content normally using an AWS-managed caching policy (for example
   the managed CachingOptimized policy) or an equivalent TTL configuration.
4. THE Default_Behavior SHALL set `viewer_protocol_policy = "redirect-to-https"`.
### Requirement 8: API Behavior Routes to the CloudFront VPC Origin
**User Story:** As a platform engineer, I want `/api/*` requests to reach the internal ALB through the
CloudFront VPC Origin, so that dynamic API traffic flows privately to ECS without exposing the ALB.
#### Acceptance Criteria
1. THE Edge_Module SHALL define an ordered cache behavior (Api_Behavior) for path pattern `/api/*` that
   targets the VPC_Origin_Api.
2. THE Edge_Module SHALL create exactly one `aws_cloudfront_vpc_origin` (the Vpc_Origin_Resource) associated
   with the internal ALB, using the consumed `module.backend.alb_arn` as the VPC Origin endpoint/target;
   HTTP from the VPC Origin to the internal ALB is acceptable for DEV, consistent with the internal ALB's
   HTTP listener.
3. THE VPC_Origin_Api origin block SHALL attach the edge-created Vpc_Origin_Resource via `vpc_origin_config`
   (referencing that resource's id, for example `aws_cloudfront_vpc_origin.api.id`), and SHALL set the
   origin `domain_name` to `module.backend.alb_dns_name`.
4. THE Api_Behavior SHALL allow the HTTP methods a dynamic API requires (for example `GET`, `HEAD`,
   `OPTIONS`, `PUT`, `POST`, `PATCH`, `DELETE`).
5. THE Api_Behavior SHALL set `viewer_protocol_policy = "redirect-to-https"`.
### Requirement 9: Caching Disabled for the API Behavior
**User Story:** As a platform engineer, I want caching disabled for `/api/*`, so that dynamic API responses
are always served fresh while static content may still cache.
#### Acceptance Criteria
1. THE Api_Behavior SHALL disable caching, using the AWS-managed CachingDisabled cache policy or an
   equivalent configuration with min, max, and default TTL all set to 0.
2. THE Api_Behavior SHALL forward the request data a dynamic API needs (for example an appropriate origin
   request policy forwarding the required headers, query strings, and cookies).
3. THE Default_Behavior for the S3_Origin MAY cache normally and SHALL NOT be forced to the CachingDisabled
   policy.
### Requirement 10: Private Origin Hop and Viewer HTTPS Enforcement
**User Story:** As a platform engineer, I want viewer traffic forced to HTTPS while the origin hop stays on
the private HTTP path, so that DEV is secure to viewers without requiring an origin certificate.
#### Acceptance Criteria
1. THE CloudFront_Distribution SHALL set `viewer_protocol_policy = "redirect-to-https"` on every cache
   behavior, so viewer HTTP is redirected to HTTPS.
2. THE origin hop from CloudFront to the internal ALB SHALL use HTTP over the private path of the
   edge-created Vpc_Origin_Resource, consistent with the internal ALB's HTTP listener; the internal ALB
   SHALL remain private and SHALL NOT be made public by the Edge_Module.
3. THE Edge_Module SHALL NOT require or create any origin ACM certificate; the origin hop over the private
   VPC Origin path uses HTTP for DEV.
### Requirement 11: ECS Isolation Invariant
**User Story:** As a platform engineer, I want the edge design to preserve ECS task isolation, so that
private compute stays private and edge introduces no public path to the tasks.
#### Acceptance Criteria
1. THE Edge_Module SHALL create no compute resource (no ECS, no EC2, no Lambda) and SHALL NOT place any
   workload in the VPC.
2. THE Edge_Module SHALL NOT modify ECS placement, and ECS tasks SHALL remain in private subnets with no
   public IP — an invariant owned by 01-network and 03-backend that the Edge_Module SHALL NOT violate.
3. THE only path from the internet to the application SHALL be Internet → CloudFront → VPC_Origin_Api →
   internal ALB → ECS; the Edge_Module SHALL NOT introduce any other public path to the tasks.
### Requirement 12: AWS Shield Standard Is Automatic
**User Story:** As a platform engineer, I want to rely on the automatic Shield Standard protection for
CloudFront, so that no Terraform resource is created for baseline DDoS protection and it is not confused
with Origin Shield.
#### Acceptance Criteria
1. THE Edge_Module SHALL rely on AWS Shield_Standard, which automatically protects CloudFront, and SHALL
   NOT create any Terraform resource for Shield Standard.
2. THE Edge_Module SHALL NOT enable CloudFront Origin_Shield for DEV and SHALL NOT confuse Origin_Shield
   with Shield_Standard.
### Requirement 13: No Hardcoding of AWS Identifiers
**User Story:** As a platform engineer, I want every AWS identifier to come from a reference rather than a
literal, so that the module is portable and no account-specific value is embedded.
#### Acceptance Criteria
1. THE Edge_Module SHALL NOT hardcode any AWS account ID, ARN (including the ALB ARN), ALB DNS name, VPC
   Origin id, VPC ID, subnet ID, security-group ID, ECR URL, CloudFront distribution ID, or S3 bucket
   identifier.
2. THE Edge_Module SHALL derive the Vpc_Origin_Resource's ALB endpoint from `module.backend.alb_arn` and the
   API origin `domain_name` from `module.backend.alb_dns_name`, sourcing both from module outputs, and SHALL
   NOT use literal values for either.
3. THE Edge_Module SHALL source all such values from variables, locals, resource references, data sources,
   or module outputs.
### Requirement 14: Dependency Direction (Consume Backend Only)
**User Story:** As a platform engineer, I want the edge module to consume backend outputs only, so that the
dependency direction stays network/data → backend → edge with no circular dependency.
#### Acceptance Criteria
1. THE Edge_Module SHALL consume `module.backend.alb_arn` and `module.backend.alb_dns_name` as typed
   inputs and SHALL NOT reference any 01-network, 02-data, or 03-backend resource directly.
2. THE Edge_Module SHALL NOT be referenced by 03-backend and SHALL NOT create a circular dependency.
3. THE Edge_Module SHALL NOT create or modify any 01-network, 02-data, or 03-backend resource.
### Requirement 15: Forward Compatibility for a Future Custom Domain
**User Story:** As a platform engineer, I want the module to remain extensible for a future custom domain,
so that a later environment can add Route 53, CloudFront aliases, and an ACM certificate without redesigning
the module.
#### Acceptance Criteria
1. THE Edge_Module SHALL be structured so a future environment can add a Route 53 hosted zone and records, a
   custom CloudFront viewer alias, and a custom ACM certificate in `us-east-1` (using the `aws.us_east_1`
   provider alias defined in `envs/dev/providers.tf`) WITHOUT redesigning the module.
2. THE Edge_Module SHALL NOT create any Route 53 resource, custom viewer alias, or custom ACM certificate
   for DEV.
3. THE forward-compatibility structure SHALL NOT introduce speculative resources or empty configuration
   into the DEV plan.
### Requirement 16: Naming, Tagging, and Provider Conventions
**User Story:** As a platform engineer, I want edge resources named from a single prefix and tagged
consistently, so that resources are identifiable and the module stays environment-independent.
#### Acceptance Criteria
1. THE Edge_Module SHALL define `local.name_prefix = "${var.app_name}-${var.environment}"` and derive every
   resource name and `Name` tag from it, computing the prefix inline nowhere else.
2. THE Edge_Module SHALL merge `var.tags` (Project, Environment, ManagedBy, Owner) into every taggable
   resource.
3. THE Edge_Module SHALL declare no `provider` block and no `backend` block; it SHALL inherit the AWS
   provider (and the `aws.us_east_1` alias when later required) from the Dev_Root.
4. THE Edge_Module SHALL use snake_case for all Terraform identifiers.
5. THE Edge_Module SHALL remain reusable and environment-independent, with DEV-specific values supplied
   through `envs/dev/terraform.tfvars` rather than hardcoded in the module.
### Requirement 17: Module Inputs and Minimal Outputs
**User Story:** As a platform engineer, I want typed, validated inputs and a minimal output surface, so the
Dev_Root wires edge from backend outputs and CI/CD consumes only what it needs.
#### Acceptance Criteria
1. THE Edge_Module SHALL declare typed, described inputs including at least `app_name`, `environment`,
   `tags`, `alb_arn`, and `alb_dns_name`.
2. THE Edge_Module SHALL validate inputs where appropriate (for example `alb_arn` non-empty and
   `alb_dns_name` non-empty) and SHALL provide meaningful descriptions on every variable.
3. THE Edge_Module SHALL expose only outputs with a concrete downstream consumer: `cloudfront_distribution_id`
   (operators/CI-CD), `cloudfront_domain_name` (the default `*.cloudfront.net` domain), and the
   Frontend_Bucket name (for CI/CD to upload frontend assets).
4. THE Edge_Module SHALL NOT expose outputs that nothing consumes (for example the OAC id or the bucket
   ARN), and outputs SHALL expose no secret values.
5. THE Dev_Root SHALL pass `alb_arn` and `alb_dns_name` from `module.backend` outputs rather than from
   literals.
### Requirement 18: S3 Encryption at Rest and Viewer HTTPS
**User Story:** As a platform engineer, I want frontend assets encrypted at rest and viewers served over
HTTPS, so that DEV meets the baseline security posture at no extra cost.
#### Acceptance Criteria
1. THE Frontend_Bucket SHALL enable server-side encryption at rest; AWS-managed SSE (for example SSE-S3) is
   sufficient for DEV.
2. THE Edge_Module SHALL NOT require a customer-managed KMS key for the Frontend_Bucket in DEV.
3. THE CloudFront_Distribution SHALL enforce HTTPS to viewers by redirecting HTTP to HTTPS on every cache
   behavior.
### Requirement 19: Naming, Terraform Quality, and Clean-Slate Plan
**User Story:** As a platform engineer, I want the module and dev root to format, initialize, validate, and
plan as a clean-slate creation, so CI passes and the plan shows no destruction.
#### Acceptance Criteria
1. WHEN `terraform fmt -check -recursive` is run against `ecs-terraform/modules/edge/` and
   `ecs-terraform/envs/dev/`, THE configuration SHALL produce zero formatting diff and exit 0.
2. WHEN `terraform validate` is run against the Dev_Root after a successful `terraform init`, THE Dev_Root
   SHALL exit 0 with no errors related to the edge module.
3. THE Edge_Module SHALL pin Terraform and the AWS provider consistent with the existing project pins
   (Terraform `~> 1.16.0`, AWS provider `~> 6.62`) and SHALL NOT introduce a major version increment.
4. THE Edge_Module and Dev_Root SHALL contain no `moved` block or state-migration logic.
5. WHEN `terraform plan` is run against a fresh state, THE Dev_Root SHALL produce an edge plan with N>0
   resources to add, exactly 0 to change, and exactly 0 to destroy. No `terraform apply` is performed.
## Out of Scope
The following belong to other specs and MUST NOT be implemented by the Edge_Module: the internal ALB, ECS
Fargate cluster/service, and ECR repository (all 03-backend); the VPC, subnets, route tables, NAT Gateway,
and VPC endpoints (01-network); the DynamoDB table (02-data);
Jenkins pipeline definitions (repository `Jenkinsfile`); and WAF, GuardDuty, CloudTrail, AWS Config, SNS,
and CloudWatch alarms/dashboards (06-observability). Route 53 resources, a custom CloudFront viewer alias,
and a custom viewer ACM certificate are out of scope for DEV (forward-compatible per Requirement 15).
Staging and production environments are out of scope, and no `terraform apply` is performed.

CloudFront is the application's sole public ingress. An outage affecting CloudFront may make the application unavailable even when origin resources remain healthy. The private S3 origin and internal ALB are intentionally not exposed as alternate public endpoints. Alternate public ingress, multi-CDN failover, and CloudFront service-outage failover are outside the DEV scope.
## Cross-Module Dependencies and Open Questions
These were analyzed against the actual 03-backend module interface before finalizing this spec. All items
are resolved decisions for DEV.
1. **Viewer TLS (default domain).** RESOLVED. Viewer → CloudFront uses the default `*.cloudfront.net` domain
   and the CloudFront default viewer certificate; DEV creates no custom alias, no Route 53 record, and no
   custom ACM certificate (Requirements 2, 3, 4, 10).
2. **Origin hop (private HTTP path).** RESOLVED. CloudFront reaches S3 through the OAC (private) and reaches
   the internal ALB over HTTP through the edge-created VPC Origin path. The Edge_Module creates exactly one
   `aws_cloudfront_vpc_origin` from the consumed `module.backend.alb_arn` and sets the API origin
   `domain_name` to `module.backend.alb_dns_name`; it creates no origin certificate (Requirements 8, 10).
3. **S3 privacy and OAC ownership.** RESOLVED. The Frontend_Bucket stays private with public access blocked;
   its policy grants read only to the CloudFront_Distribution via OAC, and no legacy OAI is used
   (Requirements 5, 6).
4. **Dependency direction.** RESOLVED. network/data → backend → edge. The Edge_Module consumes backend
   outputs only, holds no reference from backend, and creates no circular dependency (Requirement 14).
5. **Future custom domain (assumption).** DEV runs on the default CloudFront domain. If a later environment
   introduces a custom domain, Route 53 (hosted zone + records), CloudFront aliases, and a custom ACM
   certificate in `us-east-1` (via the `aws.us_east_1` provider alias) can be added without redesigning the
   module; none of these are created for DEV (Requirement 15).
6. **VPC Origin ownership (resolved change).** RESOLVED. Ownership of the `aws_cloudfront_vpc_origin`
   resource moved from 03-backend to the Edge_Module, because it is a CloudFront-specific integration
   resource that belongs with the edge/CloudFront infrastructure. The Edge_Module now CREATES exactly one
   VPC Origin (Requirement 8). As an upstream integration requirement, 03-backend MUST STOP creating the
   `aws_cloudfront_vpc_origin` resource, STOP outputting `vpc_origin_id`, and START outputting `alb_arn`
   (the internal ALB ARN) alongside `alb_dns_name`. This 03-backend change is NOT implemented by this spec
   and introduces no dependency from 03-backend back to the Edge_Module; the dependency direction remains
   network/data → backend → edge and stays acyclic (Requirement 14).
