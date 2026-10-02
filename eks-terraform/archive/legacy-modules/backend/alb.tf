# alb.tf
#
# Backend-owned security groups for the internal ALB and the ECS tasks.
# 01-network exposes no security groups, so the backend owns ALB_SG and ECS_SG.
#
# Traffic path: CloudFront -> VPC Origin -> internal ALB (ALB_SG) -> ECS tasks (ECS_SG).
# Ingress is never opened to 0.0.0.0/0 (aws-security steering): the ALB accepts
# traffic only from the AWS-managed CloudFront origin-facing prefix list, and the
# ECS tasks accept traffic only from the ALB security group (SG-to-SG).
#
# The ALB, target group, and listener are appended to this file by later tasks (5.2, 5.3).

# AWS-managed prefix list of the CloudFront origin-facing IP ranges. Used as the ALB
# ingress source so only CloudFront (via the VPC Origin) can reach the internal ALB,
# rather than opening the listener to the whole VPC or the internet.
data "aws_ec2_managed_prefix_list" "cloudfront_origin_facing" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# Security group for the internal ALB.
resource "aws_security_group" "alb_sg" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Internal ALB security group; ingress restricted to the CloudFront VPC Origin path."
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# Allow inbound traffic to the ALB listener only from the CloudFront origin-facing
# prefix list, keeping the internal ALB unreachable from arbitrary CIDRs.
resource "aws_vpc_security_group_ingress_rule" "alb_from_cloudfront" {
  security_group_id = aws_security_group.alb_sg.id
  description       = "Allow the CloudFront VPC Origin path to reach the ALB listener."
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront_origin_facing.id
  ip_protocol       = "tcp"
  from_port         = var.alb_listener_port
  to_port           = var.alb_listener_port
}

# Allow the ALB to reach the ECS tasks (and health checks) on the container port.
resource "aws_vpc_security_group_egress_rule" "alb_egress_all" {
  security_group_id = aws_security_group.alb_sg.id
  description       = "Allow the ALB to forward traffic to ECS tasks."
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# Security group for the ECS Fargate tasks.
resource "aws_security_group" "ecs_sg" {
  name        = "${local.name_prefix}-ecs-sg"
  description = "ECS task security group; ingress only from the ALB security group."
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-ecs-sg"
  })
}

# Only the ALB may reach the tasks, on the container port (SG-to-SG). Tasks are never
# reachable directly from any CIDR.
resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  security_group_id            = aws_security_group.ecs_sg.id
  description                  = "Allow the ALB to reach ECS tasks on the container port."
  referenced_security_group_id = aws_security_group.alb_sg.id
  ip_protocol                  = "tcp"
  from_port                    = var.container_port
  to_port                      = var.container_port
}

# Open egress so tasks can reach the DEV private-egress path provided by 01-network:
# the NAT Gateway for ECR/CloudWatch Logs/STS/general outbound, plus the S3 and
# DynamoDB Gateway endpoints for those services. No interface endpoints, no endpoint SG.
resource "aws_vpc_security_group_egress_rule" "ecs_egress_all" {
  security_group_id = aws_security_group.ecs_sg.id
  description       = "Allow ECS tasks outbound to the private-egress path."
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# Internal Application Load Balancer. Placed in the private subnets and reachable
# only through the CloudFront VPC Origin (via ALB_SG), never from the public internet.
# ALB access logs are intentionally disabled in DEV: no access_logs block is enabled
# and no S3 access-log bucket is created here (that ownership belongs to a dedicated
# logging/observability module if ever required).
resource "aws_lb" "app" {
  name               = "${local.name_prefix}-alb"
  load_balancer_type = "application"
  internal           = true
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# IP target group for the Fargate awsvpc tasks (target_type = "ip" is required because
# Fargate tasks register by IP, not by instance). Health checks hit the configurable
# application path on the traffic port so the ALB only routes to healthy tasks.
resource "aws_lb_target_group" "app" {
  name        = "${local.name_prefix}-tg"
  target_type = "ip"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id

  health_check {
    path     = var.health_check_path
    protocol = "HTTP"
    port     = "traffic-port"
  }

  # Stickiness disabled: the application is stateless and no documented requirement
  # for sticky sessions exists, so requests are free to land on any healthy task.
  stickiness {
    enabled = false
    type    = "lb_cookie"
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-tg"
  })
}

# HTTP listener for the internal ALB. The CloudFront VPC Origin reaches the ALB over
# HTTP on the private VPC Origin path (see vpc-origin.tf), so this listener terminates no
# TLS: no ssl_policy, no certificate_arn, and no ACM certificate. CloudFront owns the
# separate viewer-TLS connection in 04-edge (default *.cloudfront.net cert). The
# ALB-to-ECS hop remains plain HTTP on the container port.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = var.alb_listener_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
