# GitHub OIDC federation for CI/CD. No long-lived AWS keys: GitHub Actions
# presents an OIDC token and assumes this role. The trust policy restricts the
# token subject to the specific repository (and branch, if provided).

# The GitHub Actions OIDC provider. Only one provider per issuer URL may exist
# per account, so create_oidc_provider can be set false to reference an existing
# one. The thumbprint list is required by the API; AWS now validates GitHub's
# certificate via its trust store, but a current root thumbprint is still passed.
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = merge(var.tags, { Name = "${local.name_prefix}-github-oidc" })
}

# Resolve the provider ARN whether we created it or are reusing an existing one.
data "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  oidc_provider_arn = var.create_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
}

# Trust policy: allow the GitHub OIDC provider to assume this role only for the
# configured repo/branch, and only with the sts.amazonaws.com audience.
data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.oidc_sub]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = local.role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
  tags               = merge(var.tags, { Name = local.role_name })
}

# Least-privilege permissions: ECR login (account-wide, as the API requires),
# push/pull scoped to the one repository ARN, and eks:DescribeCluster scoped to
# the one cluster ARN (so the workflow can build kubeconfig). No deploy verbs:
# in-cluster deployment is performed locally for now (pending a self-hosted
# runner), so this role intentionally cannot reach the EKS API beyond Describe.
data "aws_iam_policy_document" "permissions" {
  statement {
    sid       = "EcrAuthToken"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPushPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
      "ecr:DescribeImages",
      "ecr:ListImages",
    ]
    resources = [var.ecr_repository_arn]
  }

  statement {
    sid       = "EksDescribe"
    effect    = "Allow"
    actions   = ["eks:DescribeCluster"]
    resources = [var.eks_cluster_arn]
  }
}

resource "aws_iam_role_policy" "permissions" {
  name   = "${local.role_name}-policy"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.permissions.json
}
