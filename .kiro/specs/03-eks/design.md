# 03 — EKS Module + Kubernetes Manifests Design

## Overview

```text
network (private subnets)
      |
      v
EKS cluster (control plane, endpoint access documented)
      |
      v
Managed node group (small EC2, private subnets, no public IP)
      |
      v
Namespace: erudition  ──  Deployment (2 replicas, :3000) ── Service (ClusterIP)
                                              ^
                              image: <ecr_repo_url>:<git-sha> (CI substitutes)
```

## Terraform Resources

- `aws_iam_role` (cluster) + attach `AmazonEKSClusterPolicy`
- `aws_iam_role` (node) + attach `AmazonEKSWorkerNodePolicy`,
  `AmazonEKS_CNI_Policy`, `AmazonEC2ContainerRegistryReadOnly`
- `aws_eks_cluster` — version variable; `vpc_config` with private subnets,
  `endpoint_public_access`, `endpoint_private_access`, `public_access_cidrs`;
  `access_config { authentication_mode = "API_AND_CONFIG_MAP" }`;
  `enabled_cluster_log_types` minimal
- `aws_eks_node_group` — private subnets, small instance type, desired/min/max
  small
- `aws_eks_access_entry` (+ `aws_eks_access_policy_association`) for the operator
  principal. Note: the GitHub Actions role's access entry and scoped policy/RBAC
  are created in the `cicd` module (04), consuming this cluster's outputs.

### Endpoint access decision

GitHub-hosted runners are outside the VPC. Default to **public endpoint with
`public_access_cidrs` restricted** (document the CIDRs) so the runner can reach
the API; keep private access on for node traffic (public+private). Private-only
is a documented future option requiring a self-hosted runner.

## Kubernetes Manifests (`k8s/`)

- `namespace.yaml` — `erudition` namespace.
- `deployment.yaml`:
  - `replicas: 2`
  - container port `3000`
  - `resources.requests` (e.g. cpu 100m, memory 128Mi) and `limits` (e.g. cpu
    500m, memory 256Mi) — tune during implementation
  - `readinessProbe` and `livenessProbe`: HTTP GET `/` on 3000, sensible
    initial-delay/period
  - `securityContext` running as non-root (matches Dockerfile uid 1001)
  - image: `IMAGE_PLACEHOLDER` or a kustomize image name the workflow sets to
    `<ecr_repo_url>:<github.sha>`
- `service.yaml` — `ClusterIP`, port 80 -> targetPort 3000 (or 3000->3000);
  selector matches the Deployment labels.

Access during learning:

```bash
kubectl -n erudition port-forward svc/erudition-landing 8080:80
# then open http://localhost:8080
```

## Variables (illustrative)

`app_name`, `environment`, `kubernetes_version`, `private_subnet_ids`,
`node_instance_type`, `node_desired_size`, `node_min_size`, `node_max_size`,
`endpoint_public_access_cidrs`, `operator_principal_arn`, `tags`.

## Cost

EKS control plane bills continuously (~$0.10/hr; verify). Nodes are the main
variable cost — keep the instance type small and the count low. Document
tear-down.

## Security

Private nodes, least-privilege node role, restricted public endpoint, access
entries paired with scoped policies. No secrets in manifests.
