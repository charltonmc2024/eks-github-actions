# backup.tf — documentation only. No aws_backup_vault, aws_backup_plan, or
# aws_backup_selection resources are created.
#
# Point-in-time recovery (PITR) is the baseline recovery mechanism for the development
# App_Table (see the point_in_time_recovery block in dynamodb.tf). PITR provides
# continuous backups and restore to any second in the retention window, which satisfies
# the development recovery requirement at lower cost and complexity than AWS Backup.
#
# AWS Backup infrastructure is intentionally not introduced for development to avoid the
# added cost and operational overhead. If a formal backup schedule/retention policy is
# required later, AWS Backup resources would be added at that time.
