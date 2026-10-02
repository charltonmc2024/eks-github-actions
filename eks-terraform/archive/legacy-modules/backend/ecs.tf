# ecs.tf

# A version-constraint block is technically necessary, so it is permitted here rather
# than creating a separate versions.tf (project standard: no organizational-only files).
terraform {
  required_version = "~> 1.16.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.67.0, < 7.0.0"
    }
  }
}

# name_prefix lives here rather than in a separate locals.tf (project standard).
locals {
  name_prefix = "${var.app_name}-${var.environment}"
}
# The awslogs driver needs the deploy region, but region is not a module input
# (it is inherited from the provider in envs/dev/providers.tf). This data source
# resolves it at plan time so no region string is hardcoded.
data "aws_region" "current" {}

# Secrets are wired only when a secret ARN is supplied. In DEV the default is null,
# so this evaluates to an empty list and the task definition contains no secret
# references — zero secret wiring appears in the plan (R7). When an ARN is provided,
# a single APP_SECRET environment secret is injected from that ARN.
locals {
  container_secrets = var.app_secret_arn == null ? [] : [
    {
      name      = "APP_SECRET"
      valueFrom = var.app_secret_arn
    }
  ]
}

# ECS cluster hosting the Fargate service. One cluster per environment; the service
# and task definition below run on FARGATE launch type, so no EC2 capacity is managed.
resource "aws_ecs_cluster" "this" {
  name = "${local.name_prefix}-cluster"

  tags = merge(var.tags, { Name = "${local.name_prefix}-cluster" })
}

# Fargate task definition for the application container (R3.1, R3.5–R3.8).
#
# The task is stateless: no volume block and no persistent storage are declared, so
# tasks are disposable and horizontally scalable. awsvpc networking gives each task
# its own ENI in the private subnets. The image is pulled by an immutable tag
# (var.image_tag, e.g. a Git SHA) rather than relying solely on 'latest', so each
# deploy references a specific, reproducible build.
resource "aws_ecs_task_definition" "app" {
  family                   = "${local.name_prefix}-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory

  # Two least-privilege roles: the execution role lets the ECS agent pull the image
  # and ship logs; the task role is what the application assumes to reach DynamoDB.
  execution_role_arn = aws_iam_role.execution.arn
  task_role_arn      = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "${local.name_prefix}-app"
      image     = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      # Ship container stdout/stderr to the application log group via the awslogs
      # driver. Region comes from the data source so it is never hardcoded (R8.1).
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = data.aws_region.current.region
          "awslogs-stream-prefix" = "app"
        }
      }

      # Empty in DEV (app_secret_arn = null); populated only when a secret ARN is
      # supplied, keeping the DEV plan free of any secret wiring (R7).
      secrets = local.container_secrets
    }
  ])
}

# ECS Fargate service running the application (R3.1–R3.4, R10.4).
#
# Tasks run in the private subnets with no public IP: the only inbound path is
# CloudFront VPC Origin -> internal ALB -> ECS_SG (R3.2, R10.4). The service
# registers task ENIs with the IP target group so the ALB routes to them, and the
# container_name here MUST match the container in the task definition above.
# depends_on the listener enforces the standard ECS+ALB ordering: the target group
# must be attached to a listener before the service begins registering targets.
resource "aws_ecs_service" "app" {
  name            = "${local.name_prefix}-svc"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "${local.name_prefix}-app"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.http]

  tags = merge(var.tags, { Name = "${local.name_prefix}-svc" })
}
