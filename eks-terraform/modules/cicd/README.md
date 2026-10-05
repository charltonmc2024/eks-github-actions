# cicd module

Provisions the GitHub OIDC federation and the least-privilege IAM role that the
GitHub Actions workflow assumes. No long-lived AWS keys.

## Responsibilities

- GitHub OIDC identity provider (`token.actions.githubusercontent.com`,
  audience `sts.amazonaws.com`) — optional via `create_oidc_provider`
- IAM role `${app_name}-${environment}-github-actions` whose trust policy
  restricts the token `sub` to the configured repo (and branch, if set):
  - with a branch: `repo:<owner>/<repo>:ref:refs/heads/<branch>`
  - without a branch: `repo:<owner>/<repo>:*`
- Inline permissions (least privilege):
  - `ecr:GetAuthorizationToken` (account-wide, as the API requires)
  - ECR push/pull scoped to the one repository ARN
  - `eks:DescribeCluster` scoped to the one cluster ARN

The role has **no** in-cluster deploy verbs by design; deployment is performed
locally for now.

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
| `tags` | map(string) | `{}` | Common tags. |

## Outputs

| Name | Description |
|------|-------------|
| `github_actions_role_arn` | Role ARN GitHub Actions assumes (set as the `AWS_ROLE_ARN` secret / `role-to-assume`). |
| `github_actions_role_name` | Role name. |
| `oidc_provider_arn` | OIDC provider ARN (created or pre-existing). |
