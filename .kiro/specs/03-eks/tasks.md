# 03 — EKS Module + Kubernetes Manifests Tasks

## Terraform

- [x] 1. Decide the cluster endpoint access mode and `public_access_cidrs`;
      record the choice and why (GitHub-hosted runner reachability).
- [x] 2. Create `eks-terraform/modules/eks` with typed, described variables
      (version, node sizing, endpoint access, operator principal).
- [x] 3. Define the cluster IAM role and node IAM role with the standard
      AWS-managed EKS policies (cluster; worker node + CNI + ECR read-only).
- [x] 4. Define `aws_eks_cluster` using the private subnets, documented endpoint
      access, `API_AND_CONFIG_MAP` auth mode, and minimal control-plane logs.
- [x] 5. Define the managed node group (private subnets, small instance, small
      desired/min/max, no public IP).
- [x] 6. Define the operator `aws_eks_access_entry` and access-policy
      association. (The GitHub Actions role's access entry lives in module 04.)
- [x] 7. Add outputs (cluster name, endpoint, CA data, OIDC issuer, node group
      name).
- [x] 8. Wire the module into `eks-terraform/envs/dev`.
- [x] 9. Verify Terraform: fmt / init / validate / plan (stop at plan).

## Kubernetes manifests (`k8s/`)

- [x] 10. Create `k8s/namespace.yaml` (`erudition`).
- [x] 11. Create `k8s/deployment.yaml`: 2 replicas, requests/limits, readiness +
      liveness probes on `/`:3000, non-root securityContext, image placeholder
      CI replaces with `<ecr_url>:<git-sha>`.
- [x] 12. Create `k8s/service.yaml`: ClusterIP to pod port 3000.
- [~] 13. Verify manifests. Done so far: YAML parse + Kubernetes structure
      checks (replicas, probes, resources, securityContext, volumes). PENDING a
      true schema check: `kubectl apply --dry-run=client -f k8s/` (kubectl not
      installed in this environment) and `--dry-run=server` once the cluster exists.

## Verification commands

```bash
# Terraform
cd eks-terraform/envs/dev
terraform fmt -check -recursive && terraform init && terraform validate && terraform plan

# Manifests (client-side, no cluster needed)
kubectl apply --dry-run=client -f k8s/
```
