# Requirements Document

## Introduction

This feature extends the existing Erudition landing-page CI/CD so the GitHub
Actions workflow continues past the ECR push and automatically deploys the
freshly built image to the development EKS cluster. Today the workflow
(`.github/workflows/build-and-push.yml`) builds the Next.js standalone image,
smoke-tests it, authenticates to AWS via GitHub OIDC, and pushes a commit-SHA
tagged image to Amazon ECR — then stops, because the EKS public API endpoint is
restricted to the operator's `/32` and a GitHub-hosted runner cannot reach it.

This feature adds an automated deployment stage that runs on a **self-hosted
GitHub Actions runner inside the VPC**, reaching the cluster over the
already-enabled **private** endpoint path. It adds **Terraform-managed,
namespace-scoped** Kubernetes deployment permissions for the existing GitHub
Actions IAM role (in the `cicd` module), deploys the **exact** Git-SHA image,
and verifies the rollout. The work is confined to the development environment
(`eks-terraform/envs/dev`).

**Scope boundary:** This specification covers **preparing and validating code
changes only**. It does not include `terraform apply`, a live deployment, or any
commit/push. Validation is limited to checks that do not require live AWS
resources; checks that require provisioned infrastructure are explicitly called
out as unverifiable in this scope.

## Glossary

- **Workflow**: The GitHub Actions workflow defined in
  `.github/workflows/build-and-push.yml`.
- **Build_Stage**: The existing stages of the Workflow that install
  dependencies, lint, build the Next.js app, build the Docker image, run the
  Docker smoke test, authenticate via OIDC, and push the image to ECR. These
  stages are preserved unchanged.
- **Deploy_Job**: The new deployment job added to the Workflow that applies the
  Kubernetes manifests and verifies the rollout.
- **Self_Hosted_Runner**: A GitHub Actions runner provisioned inside the project
  VPC that can reach the EKS cluster API over the private endpoint path.
- **CICD_Module**: The Terraform module at `eks-terraform/modules/cicd` that
  creates the GitHub OIDC provider and the GitHub Actions IAM role
  (`erudition-eks-dev-github-actions`).
- **GitHub_Actions_Role**: The IAM role created by the CICD_Module and assumed
  by the Workflow via OIDC (`role-to-assume`).
- **EKS_Cluster**: The development cluster `erudition-eks-dev-eks`, with
  `authentication_mode = "API"` (EKS access entries) and both private and public
  endpoint access (public restricted to `admin_public_cidr`).
- **EKS_Access**: The Terraform-managed EKS access entry (type `STANDARD`) that
  maps the GitHub_Actions_Role to a derived Kubernetes group (for example
  `erudition-eks-dev-erudition-deployers`), paired with a namespace-scoped
  Kubernetes RBAC Role plus RoleBinding that the Operator applies as a bootstrap
  step (`k8s/rbac-deployer.yaml` via `scripts/bootstrap-rbac.sh`) to bind that
  group to least-privilege verbs within the Application_Namespace. No AWS-managed
  access policy is associated.
- **Application_Namespace**: The Kubernetes namespace `erudition` into which the
  landing page is deployed.
- **Image_URI**: The fully qualified image reference `<ecr_repository_url>:<git-sha>`,
  where the Git-SHA is `github.sha` for the triggering commit.
- **Manifests**: The Kubernetes manifests under `k8s/` (`namespace.yaml`,
  `deployment.yaml`, `service.yaml`), where `deployment.yaml` carries the
  `IMAGE_PLACEHOLDER` that CI replaces with the Image_URI.
- **Rollout**: The Kubernetes Deployment update of `erudition-landing` in the
  Application_Namespace.
- **Operator**: The human maintainer who provisions infrastructure and performs
  bootstrap steps (namespace creation, runner setup, secret configuration).
- **Validation_Checks**: The non-live checks run to validate code changes
  (`terraform fmt -check`, `terraform validate`, workflow/YAML sanity).

## Requirements

### Requirement 1: Development-Only Scope

**User Story:** As the Operator, I want this feature confined to the existing
development environment, so that no staging or production infrastructure is
introduced.

#### Acceptance Criteria

1. THE CICD_Module SHALL confine all Terraform changes for this feature to the
   development configuration composed by `eks-terraform/envs/dev`.
2. THE CICD_Module SHALL NOT introduce `eks-terraform/envs/staging` or
   `eks-terraform/envs/prod` configuration.
3. THE Deploy_Job SHALL target only the development EKS_Cluster
   `erudition-eks-dev-eks`.

### Requirement 2: Preserve Existing Build, Smoke Test, and ECR Push

**User Story:** As a developer, I want the existing build, Docker smoke test,
and ECR push behavior preserved exactly, so that image provenance and the
proven build path are unchanged.

#### Acceptance Criteria

1. THE Workflow SHALL preserve the Build_Stage dependency install, lint, Next.js
   build, Docker image build, Docker smoke test, OIDC authentication, and ECR
   push steps with their existing behavior.
2. THE Workflow SHALL continue to tag the pushed image with the immutable Git
   commit SHA (`github.sha`).
3. WHERE the Git-SHA image tag already exists in ECR, THE Build_Stage SHALL
   reuse the existing image rather than failing.
4. IF the Build_Stage fails at any required step, THEN THE Workflow SHALL stop
   and SHALL NOT start the Deploy_Job.

### Requirement 3: Deploy the Exact Git-SHA Image

**User Story:** As the Operator, I want the Deploy_Job to deploy the exact
image that the Build_Stage produced, so that the running version is traceable to
a specific commit.

#### Acceptance Criteria

1. THE Deploy_Job SHALL set the Deployment image to the Image_URI
   `<ecr_repository_url>:<git-sha>` for the triggering commit.
2. THE Deploy_Job SHALL replace the `IMAGE_PLACEHOLDER` value in `deployment.yaml`
   with the Image_URI before applying the Manifests.
3. THE Deploy_Job SHALL NOT deploy an image referenced by a floating `latest`
   tag.
4. THE Deploy_Job SHALL derive the ECR repository URL from a Terraform output,
   a GitHub repository secret or variable, or an AWS lookup, rather than from a
   hardcoded value.

### Requirement 4: Preserve OIDC Authentication and Avoid Hardcoded Values

**User Story:** As a security-conscious Operator, I want deployment to keep
using GitHub OIDC and no hardcoded account-specific values, so that there are no
long-lived AWS credentials and no account coupling in source.

#### Acceptance Criteria

1. THE Deploy_Job SHALL authenticate to AWS using GitHub OIDC federation via the
   GitHub_Actions_Role (`role-to-assume`).
2. THE Deploy_Job SHALL NOT use static or long-lived AWS access keys.
3. THE Workflow SHALL NOT contain hardcoded AWS account IDs, role ARNs, ECR
   repository URLs, or EKS cluster endpoint, certificate authority, or OIDC
   issuer values.
4. THE CICD_Module SHALL obtain the ECR repository identifier and the EKS
   cluster identifiers through module inputs or references rather than hardcoded
   account-specific identifiers.

### Requirement 5: Terraform-Managed Namespace-Scoped EKS Access

**User Story:** As a security-conscious Operator, I want the GitHub Actions role
granted least-privilege, namespace-scoped Kubernetes permissions through
Terraform, so that the Workflow can deploy only within the application namespace
and nothing more.

#### Acceptance Criteria

1. WHILE the EKS_Cluster `erudition-eks-dev-eks` has `authentication_mode` set
   to `"API"`, THE CICD_Module SHALL create exactly one EKS_Access entry of type
   `STANDARD` for the GitHub_Actions_Role (`erudition-eks-dev-github-actions`)
   identified by its role ARN, mapping that role to a derived Kubernetes group
   (for example `erudition-eks-dev-erudition-deployers`) through the access
   entry's `kubernetes_groups`.
2. THE CICD_Module SHALL NOT associate an AWS-managed EKS access policy (for
   example `AmazonEKSEditPolicy`) with the EKS_Access entry and SHALL NOT create
   the Kubernetes Role or RoleBinding, which the Operator applies as a bootstrap
   step.
3. THE namespace-scoped Kubernetes authorization for the derived deployer group
   SHALL be granted by a Role plus RoleBinding in the Application_Namespace
   `erudition` (committed as `k8s/rbac-deployer.yaml` and applied by the Operator
   bootstrap script `scripts/bootstrap-rbac.sh`), granting only the verbs `get`,
   `list`, `watch`, `create`, `update`, and `patch` on `deployments` and
   `replicasets` in the `apps` API group and on `pods` and `services` in the core
   API group.
4. THE RoleBinding and Role granting the deployer group its permissions SHALL be
   confined to the single namespace `erudition`, and the GitHub_Actions_Role's
   Kubernetes authorization SHALL NOT include cluster-admin, any ClusterRole or
   ClusterRoleBinding, delete permission on namespaces, or any permission
   effective outside the `erudition` namespace.
5. THE CICD_Module SHALL obtain the EKS cluster name, cluster ARN, and any other
   EKS_Access identifiers through module input variables or resource references
   and SHALL NOT contain hardcoded cluster names, ARNs, endpoints, or
   certificate authority data.
6. THE CICD_Module SHALL NOT create, modify, or delete the Application_Namespace
   `erudition`, which the Operator provisions as a bootstrap step before
   deployment.
7. THE CICD_Module SHALL preserve the GitHub_Actions_Role's existing IAM
   permissions comprising ECR authorization-token retrieval, repository-ARN-scoped
   push/pull on the configured ECR repository, and cluster-ARN-scoped
   `eks:DescribeCluster`, and SHALL NOT remove or broaden these permissions when
   adding EKS_Access.
8. IF a required EKS cluster identifier input is empty or not a well-formed
   value, THEN THE CICD_Module SHALL fail validation with an error indicating the
   missing or malformed identifier and SHALL NOT create the EKS_Access entry.
9. IF the Application_Namespace `erudition` does not exist on the EKS_Cluster
   when the Deploy_Job runs, THEN THE Deploy_Job SHALL fail with an error
   indicating the missing namespace and SHALL NOT create the namespace or deploy
   outside it.

### Requirement 6: Deploy Only From Main via Push or Manual Dispatch

**User Story:** As the Operator, I want deployment restricted to the main branch
and never triggered by pull requests, so that unreviewed or external changes
cannot deploy and cannot obtain deployment credentials.

#### Acceptance Criteria

1. WHEN a push event targets the `main` branch (ref `refs/heads/main`), THE
   Deploy_Job SHALL evaluate its guard condition and proceed to run.
2. WHEN a `workflow_dispatch` event is triggered against the `main` branch (ref
   `refs/heads/main`), THE Deploy_Job SHALL evaluate its guard condition and
   proceed to run.
3. IF the triggering ref is any value other than `refs/heads/main`, THEN THE
   Deploy_Job SHALL be skipped and SHALL NOT deploy to the EKS_Cluster.
4. IF the triggering event is a `pull_request` event, THEN THE Workflow SHALL
   skip the Deploy_Job, SHALL NOT request `id-token: write` permission, and SHALL
   NOT assume the GitHub_Actions_Role.
5. THE Workflow SHALL NOT declare a `pull_request` trigger, and SHALL limit
   workflow-level token permissions to `contents: read` by default, granting
   `id-token: write` only within the Deploy_Job that runs on the `main` ref.

### Requirement 7: Prevent Overlapping and Out-of-Order Deployments

**User Story:** As the Operator, I want concurrency controls, so that two
deployments never run at once and an older build cannot overwrite a newer
deployment.

#### Acceptance Criteria

1. THE Workflow SHALL define a concurrency group scoped to this Workflow's
   deployment target (`deploy-erudition-eks-dev`) that serializes Deploy_Job
   runs so that no two Deploy_Job runs deploy to the EKS_Cluster at the same
   time.
2. THE Workflow SHALL set `cancel-in-progress` to `false` so that an in-flight
   Deploy_Job is never cancelled mid-apply or mid-rollout and a newer run queues
   behind the active deploy instead.
3. WHILE performing a normal (non-rollback) deploy, THE Deploy_Job SHALL verify
   that the target commit SHA equals the current `main` HEAD immediately before
   applying the Manifests, and IF the target commit SHA does not equal the
   current `main` HEAD, THEN THE Deploy_Job SHALL abort and fail rather than
   deploy, so that a stale or older commit cannot be rolled out over a newer
   `main`.
4. THE Workflow SHALL NOT rely on the execution order of pending Deploy_Job runs
   to prevent out-of-order deployment, and SHALL enforce ordering correctness
   through the `main` HEAD-match check in criterion 3.
5. WHERE a deliberate rollback is requested via manual `workflow_dispatch` with
   `rollback` set to `true`, THE Deploy_Job SHALL skip the `main` HEAD-match
   check by design, and this rollback path SHALL be the only path that deploys a
   non-HEAD commit SHA.
6. THE concurrency control SHALL be scoped so that it does not block or cancel
   unrelated workflows.

### Requirement 8: Apply Manifests and Verify Rollout With Timeout

**User Story:** As the Operator, I want the Deploy_Job to update kubeconfig,
apply the manifests, and wait for a bounded rollout, so that a failed or stalled
deployment fails the Workflow instead of silently passing.

#### Acceptance Criteria

1. THE Deploy_Job SHALL update kubeconfig for the EKS_Cluster by invoking
   `aws eks update-kubeconfig` with the cluster name and AWS region supplied as
   configuration values.
2. IF the kubeconfig update does not complete successfully, THEN THE Deploy_Job
   SHALL fail the Workflow before applying any Manifests and SHALL surface an
   error indicating the kubeconfig update failed.
3. WHEN applying the Manifests in `k8s/`, THE Deploy_Job SHALL substitute every
   occurrence of the `IMAGE_PLACEHOLDER` token with the exact Image_URI (the ECR
   repository URI tagged with the Git commit SHA) before applying, and SHALL NOT
   apply any Manifest that still contains the `IMAGE_PLACEHOLDER` token.
4. THE Deploy_Job SHALL apply the substituted Manifests to the `erudition`
   namespace.
5. WHEN the Manifests have been applied, THE Deploy_Job SHALL wait for Rollout
   completion of deployment `erudition-landing` in namespace `erudition` with an
   explicit timeout bound between 1 and 600 seconds (suggested: 300 seconds).
6. IF the Rollout of deployment `erudition-landing` does not reach the available
   state within the timeout bound, THEN THE Deploy_Job SHALL fail the Workflow
   and SHALL surface an error indicating the rollout did not complete.
7. IF one or more pods of deployment `erudition-landing` are in a crash-looping
   state while awaiting Rollout completion, THEN THE Deploy_Job SHALL fail the
   Workflow and SHALL surface an error indicating the pod failure.
8. IF applying any Manifest fails, THEN THE Deploy_Job SHALL fail the Workflow,
   SHALL surface an error indicating which apply operation failed, and SHALL NOT
   proceed to wait for Rollout completion.

### Requirement 9: Preserve Existing Kubernetes Security and Shape

**User Story:** As a security-conscious Operator, I want the deployment to keep
the existing Kubernetes security settings, probes, resource limits, replica
count, and ClusterIP Service, so that automation does not weaken or change the
workload.

#### Acceptance Criteria

1. THE Deploy_Job SHALL preserve the existing Deployment security context
   (non-root uid/gid 1001, `readOnlyRootFilesystem`, dropped capabilities,
   `allowPrivilegeEscalation` false, `seccompProfile` RuntimeDefault).
2. THE Deploy_Job SHALL preserve the existing startup, readiness, and liveness
   probes on path `/` and container port 3000.
3. THE Deploy_Job SHALL preserve the existing resource requests (cpu 100m,
   memory 128Mi) and limits (cpu 500m, memory 256Mi).
4. THE Deploy_Job SHALL preserve the Deployment replica count of 2.
5. THE Deploy_Job SHALL preserve the `ClusterIP` Service `erudition-landing`.
6. THE Deploy_Job SHALL NOT add an Ingress, a load balancer, or a public entry
   point.

### Requirement 10: Document the Automated Deployment Flow in README

**User Story:** As the Operator, I want the root README to document the
automated deployment flow and the required first-run sequence, so that I can
provision, bootstrap, and operate the pipeline correctly.

#### Acceptance Criteria

1. THE root `README.md` SHALL document the automated deployment flow from commit
   to verified Rollout.
2. THE root `README.md` SHALL document the required first-run sequence:
   (1) provision infrastructure, (2) create the Application_Namespace with
   Operator access, (3) configure GitHub secrets and variables and the selected
   Self_Hosted_Runner, (4) run the Workflow, and (5) verify the Rollout.
3. THE root `README.md` SHALL document the Self_Hosted_Runner setup as an
   Operator step for reaching the EKS private endpoint.
4. THE root `README.md` SHALL document how to redeploy a previous Git-SHA image.

### Requirement 11: Non-Live Validation of Code Changes

**User Story:** As a developer, I want to validate the Terraform and workflow
changes without provisioned AWS resources, so that I can catch errors before any
apply or deploy.

#### Acceptance Criteria

1. THE Validation_Checks SHALL include `terraform fmt -check -recursive` over
   the Terraform configuration.
2. THE Validation_Checks SHALL include `terraform validate` for the development
   root `eks-terraform/envs/dev`.
3. THE Validation_Checks SHALL include a YAML and workflow sanity check of the
   updated Workflow and Manifests.
4. IF a Validation_Check reports an error, THEN the change SHALL be corrected
   before the specification is considered complete.
5. THE specification SHALL state which behaviors cannot be verified without
   provisioning live AWS resources (for example, actual EKS API connectivity
   from the Self_Hosted_Runner, EKS_Access authorization enforcement, and a real
   Rollout).
