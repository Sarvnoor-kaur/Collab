terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.medium"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "collabsphere-key"
}

# Security Group
resource "aws_security_group" "collabsphere_sg" {
  name        = "collabsphere-sg"
  description = "Security group for CollabSphere application"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # Frontend
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Frontend"
  }

  # Backend
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Backend API"
  }

  # Jenkins
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Jenkins"
  }

  # Prometheus
  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Prometheus"
  }

  # Grafana
  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Grafana"
  }

  # Kubernetes NodePort - Frontend
  ingress {
    from_port   = 30300
    to_port     = 30300
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kubernetes Frontend NodePort"
  }

  # Kubernetes NodePort - Backend
  ingress {
    from_port   = 30500
    to_port     = 30500
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kubernetes Backend NodePort"
  }

  # Outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "collabsphere-sg"
  }
}

# EC2 Instance
resource "aws_instance" "collabsphere" {
  ami     = "ami-0f5ee92e2d63afc18" # Ubuntu 22.04 (update for your region)
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.collabsphere_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  # Minimal user_data - just update system
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              EOF

  tags = {
    Name = "CollabSphere-Server"
  }
}

# Outputs
output "instance_public_ip" {
  value       = aws_instance.collabsphere.public_ip
  description = "Public IP of EC2 instance"
}

output "instance_id" {
  value       = aws_instance.collabsphere.id
  description = "ID of EC2 instance"
}

output "jenkins_url" {
  value       = "http://${aws_instance.collabsphere.public_ip}:8080"
  description = "Jenkins URL"
}

output "frontend_url" {
  value       = "http://${aws_instance.collabsphere.public_ip}:3000"
  description = "Frontend URL"
}

output "backend_url" {
  value       = "http://${aws_instance.collabsphere.public_ip}:5000"
  description = "Backend API URL"
}
