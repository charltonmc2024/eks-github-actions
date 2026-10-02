# iam.tf
#
# Two distinct, least-privilege IAM roles back the ECS Fargate task (R6.1):
#   - Execution_Role: assumed by the ECS agent to pull the image from ECR and write
#     container logs to CloudWatch. Uses the AWS-managed execution policy only (R6.2).
#   - Task_Role: assumed by the running application container to call DynamoDB with
#     exactly the four actions the 16 access patterns require, scoped to the App_Table
#     and its indexes (R5, R6.3).
#
# No IAM user and no long-lived access key are created; the ECS service principal
# assumes these roles via STS at task start, so no AWS credentials are embedded
# anywhere (R6.4). Trust is restricted to the ECS task service principal only (R6.5).

# Trust policy shared by both roles: only the ECS task runtime principal may assume
# them via sts:AssumeRole. Scoping the principal to ecs-tasks.amazonaws.com keeps the
# roles unusable by any other service or account (R6.5).
data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    sid     = "EcsTasksAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# --- Execution_Role (R6.1, R6.2) ---
# The ECS agent uses this role to pull the image and ship logs; the application does
# not use it. It carries only the AWS-managed execution policy, never AdministratorAccess.
resource "aws_iam_role" "execution" {
  name               = "${local.name_prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = merge(var.tags, { Name = "${local.name_prefix}-ecs-execution" })
}

# AmazonECSTaskExecutionRolePolicy grants exactly ECR image pull and CloudWatch Logs
# writes required at task start. Attaching the AWS-managed policy avoids hand-rolling
# (and drifting from) those permissions. No AdministratorAccess is attached (R6.2).
resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# --- Task_Role (R6.1, R6.3) ---
# The running application container assumes this role to reach DynamoDB. It holds only
# the scoped DynamoDB policy below and never AdministratorAccess or wildcard permissions.
resource "aws_iam_role" "task" {
  name               = "${local.name_prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = merge(var.tags, { Name = "${local.name_prefix}-ecs-task" })
}

# Least-privilege DynamoDB access (R5.2, R5.3). The five actions are exactly those the
# developer-defined access patterns AP1..AP16 use, including the answer-submission hot
# path's atomic TransactWriteItems: no Scan, no DeleteItem, no BatchGetItem, no
# BatchWriteItem, no dynamodb:* and no table-management actions. The resource scope is
# exactly the App_Table ARN plus its index ARNs, derived from the injected table ARN
# via ${var.dynamodb_table_arn}/index/* — never Resource "*" and never a hardcoded ARN.
data "aws_iam_policy_document" "task_dynamodb" {
  statement {
    sid    = "AppTableLeastPrivilege"
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      # Required by the answer-submission hot path, which atomically writes the response,
      # conditionally updates the ability estimate, and updates the seen set in one
      # transaction. Distinct IAM action not implied by PutItem/UpdateItem; the
      # transaction operates on base-table items, so the table ARN scope covers it.
      "dynamodb:TransactWriteItems",
    ]

    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",
    ]
  }
}

resource "aws_iam_policy" "task_dynamodb" {
  name        = "${local.name_prefix}-ecs-task-dynamodb"
  description = "Least-privilege DynamoDB access for the ${local.name_prefix} application task role (GetItem, PutItem, UpdateItem, Query, TransactWriteItems on the App_Table and its indexes)."
  policy      = data.aws_iam_policy_document.task_dynamodb.json

  tags = merge(var.tags, { Name = "${local.name_prefix}-ecs-task-dynamodb" })
}

resource "aws_iam_role_policy_attachment" "task_dynamodb" {
  role       = aws_iam_role.task.name
  policy_arn = aws_iam_policy.task_dynamodb.arn
}
