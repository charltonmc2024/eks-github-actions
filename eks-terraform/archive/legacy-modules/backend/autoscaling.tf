# autoscaling.tf

# Application Auto Scaling target for the ECS service's desired task count.
# Registering the service as a scalable target is what lets Auto Scaling adjust
# desired_count between the configured floor and ceiling. Bounds come from typed
# variables (defaults min 1 / max 2) so DEV stays cost-conscious and is tuned
# without editing module source (R9.1, R9.3, R9.4).
resource "aws_appautoscaling_target" "ecs" {
  service_namespace  = "ecs"
  scalable_dimension = "ecs:service:DesiredCount"
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.app.name}"
  min_capacity       = var.min_capacity
  max_capacity       = var.max_capacity
}

# Single target-tracking policy on average CPU utilization. One policy is all DEV
# needs: it scales out when average CPU rises above the target and back in when it
# falls, keeping idle capacity low. No step or scheduled policies are added, to
# avoid over-provisioning (R9.2). The target/dimension/namespace are taken from the
# scalable target above so the two stay in lockstep.
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name_prefix}-cpu-target-tracking"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  resource_id        = aws_appautoscaling_target.ecs.resource_id

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = var.cpu_target
  }
}
