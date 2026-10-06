# cicd module

Provisions the GitHub OIDC federation, the least-privilege IAM role that the
GitHub Actions workflow assumes, and (optionally) the EKS **access entry** that
authenticates that role into the cluster for automated deployment. No long-lived
AWS keys.

**Validation status:** Implementation and non-live validation are
complete. Live OIDC authentication, EKS group mapping, namespace RBAC
enforcement, and automated rollout verification remain pending.

## Responsibilities

- GitHub OIDC identity provider (`token.actions.githubusercontent.com`,
  audience `sts.amazonaws.com`) — optional via `create_oidc_provider`
- IAM role `${app_name}-${environment}-github-actions` whose trust policy
  restricts the token `sub` to the configured repo (and branch, if set):
  - with a branch: `repo:<owner>/<repo>:ref:refs/heads/<branch>`
  - without a branch: `repo:<owner>/<repo>:*`
- Inline IAM permissions (least privilege):
  - `ecr:GetAuthorizationToken` (account-wide, as the API requires)
  - ECR push/pull scoped to the one repository ARN
  - `eks:DescribeCluster` scoped to the one cluster ARN
- EKS **access entry** (optional, `create_eks_access`) mapping the role to a
  Kubernetes **group** so it can authenticate to the cluster API.

## EKS deploy access (authentication vs authorization)

Reaching the cluster to deploy requires **two** separate layers:

1. **Authentication (who you are).** This module's `aws_eks_access_entry`
   maps the GitHub Actions IAM role onto the Kubernetes group
   `${app_name}-${environment}-${eks_application_namespace}-deployers`
   (the `eks_deployer_group` output, e.g.
   `erudition-eks-dev-erudition-deployers`). An access entry **alone grants no
   Kubernetes permissions**.
2. **Authorization (what you may do).** A namespace-scoped Kubernetes **RBAC
   Role + RoleBinding** binds that group to least-privilege verbs. This is an
   **operator bootstrap step**, applied once by the cluster-admin operator — it
   is **not** created by this module and **not** created by the CI/CD workflow.

### Why a custom RBAC Role instead of AmazonEKSEditPolicy

This module deliberately does **not** associate an AWS-managed access policy
such as `AmazonEKSEditPolicy`. That policy, even scoped to one namespace,
over-grants within it — per the AWS EKS access policy permissions documentation
it also allows editing/creating daemonsets, statefulsets, jobs, cronjobs, HPAs,
ingresses, networkpolicies, serviceaccounts, PVCs, configmaps, and notably
**read/write on `secrets`** in that namespace. A landing-page rollout needs none
of that.

Instead, the operator binds the group to a **custom Role** granting only:

```yaml
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods", "services"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
```

This is verb-exact and resource-exact (no `secrets`, no `serviceaccounts`, no
`delete`), confined to the `erudition` namespace.

### Operator bootstrap (run once, by the cluster-admin operator)

```bash
# 1. terraform apply has created the access entry mapping the role to the group
#    (confirm with: terraform -chdir=eks-terraform/envs/dev output -raw eks_deployer_group).
# 2. Create the namespace (operator; the CI role cannot create it).
kubectl apply -f k8s/namespace.yaml

# 3. Bind the deployer group to the namespace-scoped Role/RoleBinding.
#    Run the bootstrap script from the repository root: it reads the
#    eks_deployer_group Terraform output, substitutes it into a TEMPORARY copy
#    of k8s/rbac-deployer.yaml, fails if the output is empty or the placeholder
#    remains, verifies the namespace exists (does not create it), and applies
#    only the Role + RoleBinding.
./scripts/bootstrap-rbac.sh
```

Do NOT `kubectl apply -f k8s/rbac-deployer.yaml` directly: the committed manifest
holds a `__EKS_DEPLOYER_GROUP__` placeholder in the RoleBinding subject, which
`scripts/bootstrap-rbac.sh` substitutes from the `eks_deployer_group` output. If
`app_name`, `environment`, or `eks_application_namespace` change, the group name
changes with them; the script always reads the current output, so no manual edit
of the manifest is needed.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `app_name` / `environment` | string | — | Base for derived names. |
| `github_owner` | string | — | GitHub org/user (OIDC trust scope). Configuration, not a secret. |
| `github_repo` | string | — | Repository name (OIDC trust scope). |
| `github_branch` | string | `""` | Optional branch to further restrict trust; empty allows any ref. |
| `create_oidc_provider` | bool | `true` | Set `false` to reuse an existing provider (one per issuer per account). |
| `ecr_repository_arn` | string | — | ECR repo ARN (from the ecr module) to scope push/pull. |
| `eks_cluster_arn` | string | — | Cluster ARN (from the eks module) to scope `eks:DescribeCluster`. |
| `eks_cluster_name` | string | — | Cluster NAME (from the eks module); target of the EKS access entry. |
| `create_eks_access` | bool | `true` | Create the EKS access entry mapping the role to the deployer group. The authorizing RBAC Role/RoleBinding is an operator step. |
| `eks_application_namespace` | string | `"erudition"` | Namespace the role may deploy into; used to derive the deployer group name. |
| `tags` | map(string) | `{}` | Common tags. |

## Outputs

| Name | Description |
|------|-------------|
| `github_actions_role_arn` | Role ARN GitHub Actions assumes (set as the `AWS_ROLE_ARN` secret / `role-to-assume`). |
| `github_actions_role_name` | Role name. |
| `oidc_provider_arn` | OIDC provider ARN (created or pre-existing). |
| `eks_access_entry_principal_arn` | Principal ARN of the access entry; `null` when `create_eks_access = false`. |
| `eks_deployer_group` | Kubernetes group the role authenticates as; the operator's RoleBinding must bind this group. |
