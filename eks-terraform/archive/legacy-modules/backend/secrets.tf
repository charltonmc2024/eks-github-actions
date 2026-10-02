# secrets.tf
#
# Secrets policy (R7):
#
#   - No secret VALUE ever lives in Terraform source, tfvars, the Dockerfile, the
#     Jenkinsfile, or any committed file. This module only references an externally
#     managed secret by ARN; it never creates the secret or its value.
#   - This module creates NO aws_secretsmanager_secret and no secret-value resource.
#     The secret is owned outside this stack (Secrets Manager or SSM Parameter Store)
#     and supplied to the module as var.app_secret_arn (marked sensitive, no default
#     secret value) (R7.1, R7.4).
#   - In DEV, var.app_secret_arn defaults to null, so every resource below is
#     count-gated to zero. The default DEV plan therefore contains ZERO secret
#     resources and the task definition declares no secrets entry (R7.3).
#   - When a concrete ARN is supplied, secret injection happens through the task
#     definition `secrets` block (wired in ecs.tf via local.container_secrets, which
#     is empty when var.app_secret_arn == null), and the Execution_Role is granted
#     read access scoped to EXACTLY that one ARN — no wildcard resource (R7.2).
#
# The Execution_Role (not the Task_Role) reads the secret because the ECS agent
# resolves task-definition `secrets` at task start, before the application runs.

# Scoped read policy for the single supplied secret ARN. Gated on var.app_secret_arn:
# with the DEV default (null) this document is not created at all, so no secret-read
# permission appears in the plan. The resource is EXACTLY var.app_secret_arn — never a
# wildcard — so the execution role can read only this one secret. ssm:GetParameters is
# included so the same wiring works whether the ARN points at Secrets Manager or an SSM
# Parameter Store parameter; both actions are still scoped to the single ARN.
data "aws_iam_policy_document" "execution_secret" {
  count = var.app_secret_arn == null ? 0 : 1

  statement {
    sid    = "ReadAppSecret"
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "ssm:GetParameters",
    ]

    resources = [var.app_secret_arn]
  }
}

resource "aws_iam_policy" "execution_secret" {
  count = var.app_secret_arn == null ? 0 : 1

  name        = "${local.name_prefix}-ecs-execution-secret"
  description = "Scoped read access to exactly the injected application secret ARN for the ${local.name_prefix} ECS execution role."
  policy      = data.aws_iam_policy_document.execution_secret[0].json

  tags = merge(var.tags, { Name = "${local.name_prefix}-ecs-execution-secret" })
}

resource "aws_iam_role_policy_attachment" "execution_secret" {
  count = var.app_secret_arn == null ? 0 : 1

  role       = aws_iam_role.execution.name
  policy_arn = aws_iam_policy.execution_secret[0].arn
}
