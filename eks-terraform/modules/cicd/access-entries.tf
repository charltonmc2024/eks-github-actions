# EKS access entry for the GitHub Actions deploy role (automated-eks-deployment).
#
# Two layers must both be present for the role to deploy (see aws-security.md):
#   1. AUTHENTICATION (who you are): this access entry maps the GitHub Actions
#      IAM role onto a Kubernetes group. An access entry ALONE grants no
#      Kubernetes permissions.
#   2. AUTHORIZATION (what you may do): a namespace-scoped Kubernetes RBAC
#      Role + RoleBinding (created by the OPERATOR as a bootstrap step — see the
#      module README) binds that group to least-privilege verbs on
#      deployments/replicasets/pods/services in the application namespace.
#
# We deliberately do NOT associate an AWS-managed access policy (e.g.
# AmazonEKSEditPolicy) here: that policy over-grants within the namespace
# (notably read/write on secrets, plus daemonsets/statefulsets/jobs/cronjobs/
# ingresses/serviceaccounts). Mapping to a group that the operator binds with a
# custom Role keeps the role's in-namespace permissions least-privilege.
#
# The group name is derived (not an account-specific identifier) and is the
# contract the operator's RoleBinding must reference.
resource "aws_eks_access_entry" "github_actions" {
  count         = var.create_eks_access ? 1 : 0
  cluster_name  = var.eks_cluster_name
  principal_arn = aws_iam_role.github_actions.arn
  type          = "STANDARD"

  # The Kubernetes group this IAM principal is authenticated as. The operator's
  # namespace-scoped RoleBinding binds THIS group (least privilege). No AWS
  # access-policy association is attached on purpose.
  kubernetes_groups = [local.eks_deployer_group]

  tags = merge(var.tags, { Name = "${local.role_name}-access" })
}
