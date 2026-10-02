# AWS Security Standards

## Principle

Use least privilege and a private-by-default architecture.

Security controls may vary by environment based on exposure, reliability, and
cost requirements. This project is a cost-conscious development/learning
environment, so controls stay practical but never sacrifice the core rules
below.

---

## IAM

Prefer IAM roles over IAM users.

Grant only the permissions required by each workload.

Avoid:

- `AdministratorAccess` for workloads
- unnecessary wildcard permissions
- long-lived AWS credentials
- credentials stored in source code or Git

Separate responsibilities where appropriate. Expected roles in this project:

- EKS cluster role (control plane)
- EKS node role (nodes joining the cluster; pull from ECR)
- GitHub Actions role (assumed via OIDC for ECR push and EKS deploy)

---

## GitHub OIDC (CI/CD authentication)

GitHub Actions authenticates to AWS using **OpenID Connect federation**, not
stored access keys.

- Create a GitHub OIDC identity provider in IAM
  (`token.actions.githubusercontent.com`).
- Create an IAM role whose trust policy allows that provider **and** restricts
  the `sub` claim to the specific repository (and, where practical, a specific
  branch or GitHub Environment). Do not allow any repository to assume the role.
- Grant the role only:
  - ECR: authorization token, and push/pull to the project repository
  - `eks:DescribeCluster` (to configure `kubectl`)
- Do not store AWS access keys in GitHub secrets for deployment.

The GitHub repository identifier in the trust policy is configuration, not a
secret.

---

## EKS Access and Authorization

Reaching the cluster involves two separate layers — do not conflate them:

1. **AWS authentication (who you are):** the OIDC-assumed IAM role authenticates
   to the EKS API via IAM.
2. **Kubernetes authorization (what you may do):** an **EKS access entry alone
   does not grant deployment permissions**. The access entry must be paired with
   either:
   - an **EKS access policy association** (for example a namespace-scoped admin
     or edit policy), or
   - **Kubernetes RBAC** (a `Role` + `RoleBinding`) bound to the IAM principal.

Scope the deployment permissions to the **application namespace** where
practical, rather than granting cluster-wide admin. The GitHub Actions role
should be able to deploy the landing page in its namespace and nothing more.

### EKS API endpoint reachability

GitHub-hosted runners live outside the VPC. Document the chosen cluster endpoint
access mode:

- Public endpoint (optionally restricted via `public_access_cidrs`) is the
  simplest for a hosted runner.
- Public + private keeps node traffic private while the runner uses the public
  path.
- Private-only requires a self-hosted runner inside the VPC (future option).

Prefer restricting the public endpoint CIDRs where practical.

---

## Network Security

Application workloads (EKS nodes/pods) run in private subnets and must not
receive public IP addresses.

Private nodes need outbound access to pull images and reach the control plane.
Choose the connectivity option deliberately (NAT gateway, VPC endpoints, etc. —
see `architecture.md`); do not introduce public-subnet nodes merely as a
workaround for missing private connectivity.

Prefer security-group-to-security-group rules where supported.

Avoid `0.0.0.0/0` ingress unless public access is intentionally required by the
architecture. In this project there is no public ingress — access is through
`kubectl port-forward`.

---

## Secrets

Never commit secrets to Git.

Never hardcode secrets inside:

- Terraform
- Dockerfiles
- GitHub Actions workflows
- application source
- committed `tfvars`

Use appropriate secret-management mechanisms:

- GitHub OIDC (removes the need for stored AWS keys)
- AWS Secrets Manager or SSM Parameter Store for application secrets, if ever
  needed
- GitHub Actions secrets only for non-AWS values that genuinely must be stored

The landing page needs no AWS application secrets in this scope. The optional
Twilio variables for the `api/support` route are not configured; their absence
only disables SMS and does not break email.

Mark Terraform values as sensitive where appropriate.

---

## Encryption

Enable encryption where appropriate for:

- ECR repositories (encryption at rest)
- EKS secrets (envelope encryption with KMS where justified)
- CloudWatch Logs

Use AWS-managed encryption when sufficient. Use customer-managed KMS keys only
when a clear requirement justifies them; do not add them speculatively.

---

## Container Image Security

- Build from the project `Dockerfile`, which produces a minimal Next.js
  standalone runtime image and runs as a non-root user.
- Verify the image builds and runs before treating it as production-ready.
- Push images tagged with the immutable Git commit SHA; do not rely on `latest`
  for deployment identification.
- Apply an ECR lifecycle policy to expire old/untagged images.

---

## Logging and Detection

- CloudWatch log groups must define retention periods (no indefinite
  retention). Prefer short retention for dev.
- EKS control-plane logging (api, audit, authenticator, etc.) may be enabled
  selectively; each enabled log type adds cost, so enable only what the
  learning goal needs.

CloudTrail, GuardDuty, and AWS Config are out of scope for this learning
environment unless explicitly requested.

---

## Security Review

Check infrastructure changes for:

- unintended public exposure (public EKS endpoint without CIDR restriction,
  public-IP nodes)
- excessive IAM permissions, especially on the GitHub OIDC role
- an overly broad OIDC trust policy (wildcard repository or branch)
- EKS access entries without a scoped access policy or RBAC binding
- unnecessary wildcard permissions
- unrestricted security groups
- plaintext or hardcoded secrets or AWS keys
- missing encryption
- missing or indefinite log retention
- unnecessary recurring-cost resources
- hardcoded AWS account-specific identifiers
- circular or unnecessary cross-module dependencies

Security improvements should preserve the established architecture unless a
change has a clear security, maintainability, cost, or learning reason.

Classify findings as Critical / High / Medium / Low / Informational, and for
each explain what was found, why it matters, the affected resource, the
recommended correction, and any cost impact.

---

## Environment Guidance

### Development (current)

Prefer the simplest secure and cost-conscious implementation:

- keep EKS nodes in private subnets without public IPs
- choose the minimal outbound connectivity option for private nodes
- restrict the EKS public endpoint CIDRs where practical
- use GitHub OIDC (no stored AWS keys)
- scope the GitHub Actions role's Kubernetes permissions to the application
  namespace
- apply an ECR lifecycle policy
- set finite log retention

### Staging and Production

Do not create staging or production environments unless explicitly requested.
When introduced, evaluate stronger controls separately (private-only endpoints,
customer-managed KMS, expanded audit logging, high availability, stricter CI/CD
approval gates). Do not assume DEV decisions automatically apply.
