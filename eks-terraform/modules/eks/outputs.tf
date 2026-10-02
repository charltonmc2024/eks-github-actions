# Expose only the identifiers downstream consumers need. The cicd module (next
# task) consumes the cluster name/ARN/OIDC issuer to build the GitHub Actions
# role and its namespace-scoped access entry; operators use the endpoint and CA
# data for kubeconfig.

output "eks_cluster_name" {
  description = "Name of the EKS cluster (used by aws eks update-kubeconfig and the cicd module)."
  value       = aws_eks_cluster.this.name
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster, used to scope eks:DescribeCluster in the CI/CD role."
  value       = aws_eks_cluster.this.arn
}

output "eks_cluster_endpoint" {
  description = "API server endpoint of the EKS cluster."
  value       = aws_eks_cluster.this.endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 CA data for the cluster API, used to build kubeconfig."
  value       = aws_eks_cluster.this.certificate_authority[0].data
}

output "eks_cluster_oidc_issuer_url" {
  description = "OIDC issuer URL of the cluster (used for IRSA / future workload identity)."
  value       = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

output "node_group_name" {
  description = "Name of the managed node group."
  value       = aws_eks_node_group.default.node_group_name
}

output "node_role_arn" {
  description = "ARN of the node IAM role."
  value       = aws_iam_role.node.arn
}
