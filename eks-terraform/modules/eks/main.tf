# EKS control plane.
#
# Endpoint access (see architecture.md / aws-security.md):
#   * endpoint_private_access = true  — nodes reach the API over the private path
#     inside the VPC.
#   * endpoint_public_access  = true, restricted to var.admin_public_cidr (a /32)
#     — only your current public IP can reach the public API endpoint, so you can
#     run kubectl locally. Standard GitHub-hosted runners CANNOT reach this
#     restricted endpoint (their egress IPs are dynamic); automated in-cluster
#     deployment is therefore pending (a self-hosted runner inside the VPC is the
#     intended future path). CI builds/tests/pushes to ECR; you deploy locally.
#
# authentication_mode = "API" uses EKS access entries (not the legacy aws-auth
# ConfigMap) for authorization.
resource "aws_eks_cluster" "this" {
  name     = local.cluster_name
  version  = var.kubernetes_version
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = [var.admin_public_cidr]
  }

  access_config {
    authentication_mode = "API"
  }

  enabled_cluster_log_types = var.enabled_cluster_log_types

  # Ensure the cluster policy is attached before the control plane is created,
  # and remains until after it is destroyed.
  depends_on = [aws_iam_role_policy_attachment.cluster_policy]

  tags = merge(var.tags, { Name = local.cluster_name })
}

# Managed node group in the private subnets. No remote_access block and nodes
# get no public IP (private subnets have map_public_ip_on_launch = false).
#
# Capacity (default t3.small, 2 vCPU / 2 GiB): a node runs the per-node system
# pods (aws-node/VPC CNI, kube-proxy) plus a share of CoreDNS, and still fits the
# two Next.js replicas with headroom for one rolling-update surge pod. t3.small
# also allows enough VPC-CNI pod IPs for this pod count. With desired_size = 1
# both app replicas co-locate on one node (no node-failure HA); max_size = 2 lets
# the group add a node for a rolling update or brief pressure. Raise desired_size
# to 2 for replica spread across AZs.
resource "aws_eks_node_group" "default" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${local.name_prefix}-ng"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = [var.node_instance_type]

  scaling_config {
    desired_size = var.node_desired_size
    min_size     = var.node_min_size
    max_size     = var.node_max_size
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_worker,
    aws_iam_role_policy_attachment.node_cni,
    aws_iam_role_policy_attachment.node_ecr_readonly,
  ]

  tags = merge(var.tags, { Name = "${local.name_prefix}-ng" })
}

# Grant the operator principal cluster-admin via an EKS access entry + the
# AWS-managed AmazonEKSClusterAdminPolicy. An access entry ALONE grants no
# Kubernetes permissions; the policy association is what authorizes kubectl.
# Scope is cluster-wide here because this is the human operator; the CI/CD role
# (added in the cicd module) will be scoped to the application namespace instead.
resource "aws_eks_access_entry" "operator" {
  cluster_name  = aws_eks_cluster.this.name
  principal_arn = var.operator_principal_arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "operator_admin" {
  cluster_name  = aws_eks_cluster.this.name
  principal_arn = var.operator_principal_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }

  depends_on = [aws_eks_access_entry.operator]
}
