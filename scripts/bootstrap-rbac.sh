#!/usr/bin/env bash
#
# bootstrap-rbac.sh — OPERATOR-ONLY, run once from the repository root.
#
# Binds the GitHub Actions deployer group (Terraform output `eks_deployer_group`)
# to the namespace-scoped RBAC Role/RoleBinding in k8s/rbac-deployer.yaml, by
# substituting the group name into a TEMPORARY copy of the manifest and applying
# it with kubectl. It grants NO permissions beyond what k8s/rbac-deployer.yaml
# already defines (deployments/replicasets/pods/services; get/list/watch/create/
# update/patch in the "erudition" namespace only).
#
# This is deliberately an operator step: it is NOT run by GitHub Actions and NOT
# managed by Terraform. Namespace creation is a separate operator step (see the
# README first-run sequence); this script verifies the namespace exists but does
# not create it.
#
# Prerequisites:
#   * terraform apply has been run in eks-terraform/envs/dev (so the EKS access
#     entry and the eks_deployer_group output exist).
#   * kubectl is configured for the cluster as a cluster-admin operator, e.g.:
#       aws eks update-kubeconfig \
#         --name "$(terraform -chdir=eks-terraform/envs/dev output -raw eks_cluster_name)" \
#         --region us-east-1
#   * The "erudition" namespace exists (kubectl apply -f k8s/namespace.yaml).
#
# Usage (from the repository root):
#   ./scripts/bootstrap-rbac.sh
#
set -euo pipefail

TF_DIR="eks-terraform/envs/dev"
MANIFEST="k8s/rbac-deployer.yaml"
NAMESPACE="erudition"
PLACEHOLDER="__EKS_DEPLOYER_GROUP__"

# Resolve repo root from this script's location so it works regardless of CWD,
# then operate from there (all paths above are repo-root-relative).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

command -v terraform >/dev/null 2>&1 || { echo "ERROR: terraform not found on PATH." >&2; exit 1; }
command -v kubectl   >/dev/null 2>&1 || { echo "ERROR: kubectl not found on PATH." >&2; exit 1; }
[ -f "$MANIFEST" ] || { echo "ERROR: $MANIFEST not found (run from the repo root)." >&2; exit 1; }

# 1. Read the deployer group from the Terraform output; fail if empty.
echo "Reading eks_deployer_group from Terraform output ($TF_DIR)..."
GROUP="$(terraform -chdir="$TF_DIR" output -raw eks_deployer_group 2>/dev/null || true)"
if [ -z "${GROUP//[[:space:]]/}" ]; then
  echo "ERROR: Terraform output 'eks_deployer_group' is empty or unavailable." >&2
  echo "       Has 'terraform -chdir=$TF_DIR apply' been run? Is create_eks_access = true?" >&2
  exit 1
fi
echo "Deployer group: $GROUP"

# 2. Confirm the namespace exists (operator creates it separately; do not create it here).
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
  echo "ERROR: namespace '$NAMESPACE' does not exist." >&2
  echo "       Create it first (operator step): kubectl apply -f k8s/namespace.yaml" >&2
  exit 1
fi

# 3. Substitute the group into a TEMPORARY copy of the manifest.
TMP_MANIFEST="$(mktemp -t rbac-deployer.XXXXXX.yaml)"
cleanup() { rm -f "$TMP_MANIFEST"; }
trap cleanup EXIT

# Use a safe delimiter and avoid interpreting GROUP as a regex/backreference.
GROUP_ESCAPED="$(printf '%s' "$GROUP" | sed -e 's/[&|\\]/\\&/g')"
sed "s|${PLACEHOLDER}|${GROUP_ESCAPED}|g" "$MANIFEST" > "$TMP_MANIFEST"

# 4. Fail if substitution is incomplete (placeholder still present).
if grep -q "$PLACEHOLDER" "$TMP_MANIFEST"; then
  echo "ERROR: placeholder '$PLACEHOLDER' still present after substitution; aborting." >&2
  exit 1
fi
# Also confirm the resolved group actually landed in the rendered manifest.
if ! grep -q -- "$GROUP" "$TMP_MANIFEST"; then
  echo "ERROR: resolved group '$GROUP' not found in rendered manifest; aborting." >&2
  exit 1
fi

# 5. Show the rendered RoleBinding subject, then apply (Role + RoleBinding only).
echo "Rendered RoleBinding subject:"
grep -nE 'name: '"$GROUP"'$' "$TMP_MANIFEST" || true

echo "Applying namespace-scoped Role and RoleBinding to '$NAMESPACE'..."
kubectl apply -f "$TMP_MANIFEST"

echo "Done. The GitHub Actions role (group '$GROUP') can now deploy in '$NAMESPACE' only."
