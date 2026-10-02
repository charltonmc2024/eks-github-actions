# 03 — EKS Module + Kubernetes Manifests Requirements

## Scope

Provide the EKS cluster, a small managed node group, the required IAM roles, and
cluster access, plus the Kubernetes manifests that run the landing page.
Reusable module at `eks-terraform/modules/eks`, consumed by
`eks-terraform/envs/dev`. Manifests live in `k8s/` at the repository root.

Depends on the network module (private subnets).

## Infrastructure Requirements

1. An EKS cluster with a configurable Kubernetes version (variable).
2. One small managed node group in the private subnets, with configurable
   instance type and desired/min/max size (small and few for cost).
3. A cluster IAM role and a node IAM role (least privilege, standard AWS-managed
   EKS policies: cluster policy for the control plane; worker node, CNI, and ECR
   read-only pull for nodes).
4. Nodes have no public IP addresses.
5. Cluster endpoint access mode is an explicit, documented variable
   (public with `public_access_cidrs` restriction, public+private, or
   private-only). Default to a restricted public endpoint so a GitHub-hosted
   runner can reach it; document the trade-off.
6. Cluster access configured via EKS **access entries** for the operator
   principal (API/`API_AND_CONFIG_MAP` authentication mode).
7. Control-plane log types enabled only as needed (each adds cost).
8. No hardcoded account IDs, subnet IDs, or ARNs.
9. Outputs: `eks_cluster_name`, `eks_cluster_endpoint`,
   `eks_cluster_certificate_authority_data`, `eks_cluster_oidc_issuer_url`,
   `node_group_name` (as consumers need them).

## Kubernetes Manifest Requirements

10. A dedicated application namespace (not `default`) where practical.
11. A `Deployment` with:
    - 2 replicas
    - resource `requests` and `limits` sized for the small landing page
    - a `readinessProbe` and a `livenessProbe` (HTTP GET on `/` at container
      port 3000 unless a dedicated health path is added)
    - an image reference using the exact commit-SHA tag produced by CI (CI
      substitutes the tag; no floating `latest` as the deployed version)
    - non-root security context consistent with the Dockerfile
12. A `Service` of type `ClusterIP` targeting the Deployment's pods on port
    3000.
13. The page is reached initially via `kubectl port-forward` — no Ingress or
    public LoadBalancer.

## Acceptance

- Terraform: validate passes; plan shows the cluster, node group, IAM roles, and
  access entry to add; nodes private; endpoint access as documented.
- Manifests: valid YAML; `kubectl apply --dry-run=client` succeeds; probes and
  resource bounds present; image tag is a placeholder CI replaces.
