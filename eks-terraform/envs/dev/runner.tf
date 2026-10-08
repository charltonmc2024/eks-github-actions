data "aws_ssm_parameter" "runner_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

data "aws_eks_cluster" "runner_target" {
  name = module.eks.eks_cluster_name
}

resource "aws_iam_role" "runner" {
  name = "${var.app_name}-${var.environment}-runner"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "runner_ssm" {
  role       = aws_iam_role.runner.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "runner" {
  name = "${var.app_name}-${var.environment}-runner"
  role = aws_iam_role.runner.name
}

resource "aws_security_group" "runner" {
  name_prefix = "${var.app_name}-${var.environment}-runner-"
  description = "Private GitHub Actions runner"
  vpc_id      = module.network.vpc_id
}

resource "aws_vpc_security_group_egress_rule" "runner_outbound" {
  security_group_id = aws_security_group.runner.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "runner_to_eks" {
  security_group_id = data.aws_eks_cluster.runner_target.vpc_config[0].cluster_security_group_id

  referenced_security_group_id = aws_security_group.runner.id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
  description                  = "GitHub runner access to EKS API"
}

resource "aws_instance" "runner" {
  ami                         = data.aws_ssm_parameter.runner_ami.value
  instance_type               = "t3.small"
  subnet_id                   = module.network.private_subnet_ids[0]
  associate_public_ip_address = false
  vpc_security_group_ids      = [aws_security_group.runner.id]
  iam_instance_profile        = aws_iam_instance_profile.runner.name

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  user_data = <<-EOF
    #!/bin/bash
    set -euxo pipefail
    systemctl enable --now amazon-ssm-agent
    dnf install -y git tar gzip unzip libicu
  EOF

  depends_on = [
    aws_iam_role_policy_attachment.runner_ssm,
    module.network
  ]

  tags = {
    Name = "${var.app_name}-${var.environment}-runner"
  }
}

output "runner_instance_id" {
  value = aws_instance.runner.id
}
