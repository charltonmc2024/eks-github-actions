# outputs.tf
#
# Exposes only the non-secret App_Table identifiers that downstream consumers
# (the backend/ECS module, the dev root re-exports, CI/CD, and operators) need.
# No GSI-name output is declared: nothing in the current scope needs a GSI name
# to build an IAM index ARN or query. If the backend/IAM design later requires
# GSI1/GSI2 names, they would be added at that point.

output "dynamodb_table_name" {
  description = "Name of the single-table DynamoDB App_Table. Consumed by the backend module for IAM policy resource ARNs and by application runtime configuration."
  value       = aws_dynamodb_table.app.name
  sensitive   = false
}

output "dynamodb_table_arn" {
  description = "ARN of the single-table DynamoDB App_Table. Consumed by the backend module to scope least-privilege IAM permissions for ECS tasks."
  value       = aws_dynamodb_table.app.arn
  sensitive   = false
}

output "dynamodb_table_id" {
  description = "ID of the single-table DynamoDB App_Table. For DynamoDB tables this equals the table name and is exposed for consumers that reference the table by id."
  value       = aws_dynamodb_table.app.id
  sensitive   = false
}
