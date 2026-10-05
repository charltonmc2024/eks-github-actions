# eks module

Provisions the EKS control plane, a managed node group, the cluster/node IAM
roles, and the operator access entry.

## Responsibilities

- EKS cluster `${app_name}-${environment}-eks`, `authentication_mode = API`
  (EKS access entries, not the aws-auth ConfigMap)
- Managed node group `${app_name}-${environment}-ng` in the private subnets
  (no public IP), `max_unavailable = 1` rolling updates
- Cluster IAM role (`AmazonEKSClusterPolicy`) and node IAM role
  (`AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`,
  `AmazonEC2ContainerRegistryReadOnly`)
- Operator access entry + `AmazonEKSClusterAdminPolicy` association so your
  IAM principal can run `kubectl`
- Control-plane logging for `api`, `audit`, `authenticator` by default

### Endpoint access

- `endpoint_private_access = true` — nodes reach the API privately
- `endpoint_public_access = true`, restricted to `admin_public_cidr` (a /32) —
  only your IP reaches the public endpoint, so local `kubectl` works

Standard GitHub-hosted runners cannot reach this restricted endpoint, so
in-cluster deployment is performed locally (a self-hosted runner inside the VPC
is the intended future path).

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `app_name` / `environment` | string | — | Base for derived names. |
| `private_subnet_ids` | list(string) | — | Private subnets (≥2) for nodes and control-plane ENIs. |
| `kubernetes_version` | string | `1.35` | Control-plane / node K8s minor version (validated `1.25`–`1.39`). |
| `admin_public_cidr` | string | — | Your public IP as a `/32` for the public endpoint. |
| `operator_principal_arn` | string | — | IAM user/role ARN granted cluster-admin. |
| `node_instance_type` | string | `t3.small` | Node EC2 type. |
| `node_desired_size` / `node_min_size` / `node_max_size` | number | `1` / `1` / `2` | Node group scaling. |
| `enabled_cluster_log_types` | list(string) | `["api","audit","authenticator"]` | Control-plane logs. |
| `tags` | map(string) | `{}` | Common tags. |

## Outputs

| Name | Description |
|------|-------------|
| `eks_cluster_name` | Cluster name (for `aws eks update-kubeconfig`). |
| `eks_cluster_endpoint` | API server endpoint. |
| `eks_cluster_arn` | Cluster ARN (scopes CI `eks:DescribeCluster`). |
| `eks_cluster_certificate_authority_data` | Base64 CA data for kubeconfig. |
| `eks_cluster_oidc_issuer_url` | OIDC issuer URL (IRSA/future). |
| `node_group_name` | Managed node group name. |
| `node_role_arn` | Node IAM role ARN. |
