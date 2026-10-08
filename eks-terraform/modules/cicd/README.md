# cicd module

Provisions GitHub OIDC federation, the IAM role assumed by GitHub Actions,
and an optional EKS access entry for automated deployment. Both workflow jobs
use temporary AWS credentials rather than stored AWS access keys.

**Validation status:** Live OIDC authentication and automated EKS rollout
completed successfully on October 8, 2026, using the access-entry group mapping
and operator-created namespace RBAC. Successful deployment verifies the allowed
deployment path; separate negative permission tests have not been recorded.

## Responsibilities

- GitHub OIDC identity provider (`token.actions.githubusercontent.com`, audience
  `sts.amazonaws.com`), optionally created through `create_oidc_provider`.
- IAM role `${app_name}-${environment}-github-actions`, with trust restricted to
  the configured repository and, when supplied, its branch.
- Inline IAM permissions for ECR authentication, repository-scoped image
  push/pull, and `eks:DescribeCluster` scoped to the target cluster ARN.
- Optional EKS access entry mapping the role to a Kubernetes deployer group.

The runner EC2 instance is provisioned separately by the development root's
`eks-terraform/envs/dev/runner.tf`. This module does not install or register
the GitHub runner. See the [root README](../../../README.md) for those steps.

## OIDC trust configuration

The subject format used by this repository includes numeric owner and
repository IDs:

```text
# With github_branch set:
repo:<owner>@<owner_id>/<repo>@<repo_id>:ref:refs/heads/<branch>

# With github_branch empty:
repo:<owner>@<owner_id>/<repo>@<repo_id>:*
```

For the development environment, the expected subject is:

```text
repo:charltonmc2024@158232901/eks-github-actions@1402120083:ref:refs/heads/main
```

The module constructs it using:

```hcl
oidc_sub = var.github_branch == "" ? "repo:${var.github_owner}@${var.github_owner_id}/${var.github_repo}@${var.github_repo_id}:*" : "repo:${var.github_owner}@${var.github_owner_id}/${var.github_repo}@${var.github_repo_id}:ref:refs/heads/${var.github_branch}"
```

The dev root passes the IDs inside its existing `module "cicd"` block:

```hcl
github_owner    = var.github_owner
github_repo     = var.github_repo
github_branch   = var.github_branch
github_owner_id = "158232901"
github_repo_id  = "1402120083"
```

Keep `github_branch = "main"` in the dev configuration. An empty branch broadens
trust to any matching subject within the repository. IDs are configuration,
not secrets. The audience remains `sts.amazonaws.com`.

Match the subject to the actual `sub` printed by the workflow's **Inspect OIDC
identity** step. Other repositories, GitHub environments, or customized subject
settings may use a different format and require corresponding trust changes.
Never print the full OIDC token.

## EKS deploy access: authentication and authorization

Deployment requires both layers:

1. **Authentication:** The EKS access entry maps the GitHub Actions role to
   `${app_name}-${environment}-${eks_application_namespace}-deployers`, exposed
   through `eks_deployer_group`. For dev this is
   `erudition-eks-dev-erudition-deployers`. An access entry alone grants no
   Kubernetes permissions.
2. **Authorization:** The operator creates a namespace-scoped Role and RoleBinding
   binding that group to deployment permissions. These objects are created by
   the bootstrap script, not by this module or the CI/CD workflow.

### Custom namespace RBAC

This module does not associate `AmazonEKSEditPolicy`. Instead, the operator
applies the narrower Role required by the landing-page workflow:

```yaml
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods", "services"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
```

This Role grants no Secrets, ServiceAccounts, delete, or cluster-wide access.
It is scoped to `erudition`. Kubernetes permissions are additive; this describes
what this Role grants, rather than overriding any other grants an identity has.

### Operator bootstrap

Run from the repository root after Terraform has created the cluster and
GitHub Actions access entry, using the operator's AWS credentials:

```bash
aws eks update-kubeconfig \
  --name "$(terraform -chdir=eks-terraform/envs/dev output -raw eks_cluster_name)" \
  --region us-east-1

kubectl apply -f k8s/namespace.yaml
bash scripts/bootstrap-rbac.sh
kubectl -n erudition get role,rolebinding
```

The script reads `eks_deployer_group`, verifies the namespace exists, substitutes
the group into a temporary copy of the manifest, and applies the Role and
RoleBinding. Do not apply `k8s/rbac-deployer.yaml` directly: it contains the
`__EKS_DEPLOYER_GROUP__` placeholder.

Repeat bootstrap after recreating the cluster. If naming inputs or namespace
configuration change, review the matching namespace, manifest, script, and
workflow configuration before reapplying.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `app_name` / `environment` | string | Required | Base for resource names. |
| `github_owner` | string | Required | GitHub organization or user name. |
| `github_owner_id` | string | Required | Numeric owner ID; digits only. |
| `github_repo` | string | Required | GitHub repository name. |
| `github_repo_id` | string | Required | Numeric repository ID; digits only. |
| `github_branch` | string | `""` | Optional branch restriction; dev uses `main`. |
| `create_oidc_provider` | bool | `true` | Set false to use an existing provider. |
| `ecr_repository_arn` | string | Required | Repository ARN used to scope push/pull permissions. |
| `eks_cluster_arn` | string | Required | Cluster ARN used to scope `eks:DescribeCluster`. |
| `eks_cluster_name` | string | Required | Cluster name for the EKS access entry. |
| `create_eks_access` | bool | `true` | Create the role-to-group EKS access entry. |
| `eks_application_namespace` | string | `"erudition"` | Namespace used to derive the deployer group. |
| `tags` | map(string) | `{}` | Common resource tags. |

## Outputs

| Name | Description |
|------|-------------|
| `github_actions_role_arn` | Role assumed by GitHub Actions; set as the `AWS_ROLE_ARN` repository secret. |
| `github_actions_role_name` | IAM role name. |
| `oidc_provider_arn` | Created or existing OIDC provider ARN. |
| `eks_access_entry_principal_arn` | Access-entry principal ARN; null when `create_eks_access = false`. |
| `eks_deployer_group` | Kubernetes group bound by the operator's RoleBinding. |

## Workflow configuration and troubleshooting

Both build and deploy jobs require `id-token: write` and `contents: read`.
Configure these values under GitHub **Settings → Secrets and variables → Actions**:

| Name | Kind | Source |
|------|------|--------|
| `AWS_ROLE_ARN` | Secret | `github_actions_role_arn` Terraform output. |
| `ECR_REPOSITORY_URL` | Secret | Dev root's `ecr_repository_url` output. |
| `AWS_REGION` | Variable | `us-east-1`. |
| `EKS_CLUSTER_NAME` | Variable | Dev root's `eks_cluster_name` output. |

- **OIDC assumption denied:** Compare actual `sub` and `aud` with the deployed
  IAM trust policy, and verify `AWS_ROLE_ARN`. Apply Terraform trust changes
  before rerunning the job.
- **Deploy queued:** Confirm the registered runner is online with labels
  `self-hosted`, `linux`, and `erudition-eks-dev`.
- **Missing cluster name:** Set `EKS_CLUSTER_NAME` as a repository variable;
  the workflow reads `vars.EKS_CLUSTER_NAME`.
- **Kubernetes Forbidden:** Check the access-entry group and namespace RoleBinding.
- **Cluster connection timeout:** Check private endpoint access, runner-to-cluster
  TCP 443 rules, and VPC DNS/network connectivity.

Automatic deployment does not create a public website endpoint. The current
`ClusterIP` Service is viewed through port forwarding, as documented in the
root README.
