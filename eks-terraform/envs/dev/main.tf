# Dev deployment root wiring. This root module is the single source of truth for
# the development environment. For the current task it composes the network and ecr
# modules; the eks and cicd modules are added in later tasks.
#
# The legacy data/backend/edge (ECS/CloudFront/DynamoDB) module calls were removed
# as part of the EKS refactor. Those modules now live, for reference only, under
# eks-terraform/archive/legacy-modules/ and are intentionally not wired here.

module "network" {
  source = "../../modules/network"

  app_name             = var.app_name
  environment          = var.environment
  aws_region           = var.aws_region
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidr1  = var.public_subnet_cidr1
  public_subnet_cidr2  = var.public_subnet_cidr2
  private_subnet_cidr1 = var.private_subnet_cidr1
  private_subnet_cidr2 = var.private_subnet_cidr2
  enable_nat_gateway   = var.enable_nat_gateway
  enable_vpc_endpoints = var.enable_vpc_endpoints

  # Common tag set applied uniformly across module resources. Owner is derived
  # from var.owner so the module stays environment-independent.
  tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = var.owner
  }
}

# The ecr module owns the private image registry for the landing-page image.
# It is independent of the network module. CI/CD pushes commit-SHA-tagged images
# here and EKS nodes pull from it in later tasks. Repository identifiers are
# consumed via outputs, never hardcoded.
module "ecr" {
  source = "../../modules/ecr"

  app_name          = var.app_name
  environment       = var.environment
  repository_suffix = var.ecr_repository_suffix

  untagged_image_expiry_days = var.ecr_untagged_image_expiry_days
  max_tagged_images          = var.ecr_max_tagged_images

  tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = var.owner
  }
}

# The eks module owns the cluster, a managed node group, the cluster/node IAM
# roles, and the operator access entry. It consumes the private subnets from the
# network module. The public API endpoint is restricted to var.admin_public_cidr
# for local kubectl; automated in-cluster deploy is pending (see cicd task).
module "eks" {
  source = "../../modules/eks"

  app_name    = var.app_name
  environment = var.environment

  private_subnet_ids     = module.network.private_subnet_ids
  kubernetes_version     = var.kubernetes_version
  admin_public_cidr      = var.admin_public_cidr
  operator_principal_arn = var.operator_principal_arn

  node_instance_type = var.node_instance_type
  node_desired_size  = var.node_desired_size
  node_min_size      = var.node_min_size
  node_max_size      = var.node_max_size

  tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = var.owner
  }
}

# The cicd module owns the GitHub OIDC provider and the least-privilege IAM role
# GitHub Actions assumes (ECR push + eks:DescribeCluster, scoped to this repo and
# to the ecr/eks ARNs). It performs no in-cluster deploy: deployment is local for
# now (automated deploy pending a self-hosted runner).
module "cicd" {
  source = "../../modules/cicd"

  app_name    = var.app_name
  environment = var.environment

  github_owner    = var.github_owner
  github_repo     = var.github_repo
  github_branch   = var.github_branch
  github_owner_id = "158232901"
  github_repo_id  = "1402120083"

  ecr_repository_arn = module.ecr.ecr_repository_arn
  eks_cluster_arn    = module.eks.eks_cluster_arn
  # Cluster NAME (not ARN) for the GitHub Actions EKS access entry
  # (automated-eks-deployment). eks_application_namespace and
  # create_eks_access use the module defaults ("erudition" / true).
  eks_cluster_name = module.eks.eks_cluster_name

  tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = var.owner
  }
}
