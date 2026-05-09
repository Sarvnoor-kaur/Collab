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
  default     = "ap-south-1"
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

variable "k8s_instance_type" {
  description = "Kubernetes EC2 instance type"
  type        = string
  default     = "t2.medium"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "collabsphere-key"
}

variable "existing_jenkins_ip" {
  description = "IP of existing Jenkins server (optional - for reference only)"
  type        = string
  default     = "13.233.75.163"
}

# Security Group for Kubernetes (Only new EC2)
resource "aws_security_group" "k8s_sg" {
  name        = "collabsphere-k8s-sg"
  description = "Security group for Kubernetes cluster"

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
    Name = "collabsphere-k8s-sg"
  }
}

# Kubernetes EC2 Instance (NEW - Only this will be created)
resource "aws_instance" "kubernetes" {
  ami           = "ami-0dee22c13ea7a9a67" # Ubuntu 22.04 for ap-south-1
  instance_type = var.k8s_instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.k8s_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              
              # Update system
              apt-get update -y
              
              # Install Docker
              apt-get install -y docker.io docker-compose
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              
              # Install kubectl
              curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
              install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
              rm kubectl
              
              # Install Minikube
              curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
              install minikube-linux-amd64 /usr/local/bin/minikube
              rm minikube-linux-amd64
              
              # Start Minikube as ubuntu user
              su - ubuntu -c "minikube start --driver=docker --cpus=2 --memory=4096"
              su - ubuntu -c "minikube addons enable ingress"
              
              # Install Prometheus
              cd /home/ubuntu
              wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
              tar xvfz prometheus-*.tar.gz
              rm prometheus-*.tar.gz
              mv prometheus-* prometheus
              chown -R ubuntu:ubuntu prometheus
              
              # Install Grafana
              apt-get install -y software-properties-common
              add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
              wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
              apt-get update
              apt-get install -y grafana
              systemctl start grafana-server
              systemctl enable grafana-server
              
              echo "K8S_SETUP_COMPLETE" > /tmp/setup-complete.txt
              EOF

  tags = {
    Name = "CollabSphere-Kubernetes"
  }
}

# Outputs
output "existing_jenkins_ip" {
  value       = var.existing_jenkins_ip
  description = "Your existing Jenkins server IP (for reference)"
}

output "k8s_public_ip" {
  value       = aws_instance.kubernetes.public_ip
  description = "Public IP of NEW Kubernetes server"
}

output "k8s_private_ip" {
  value       = aws_instance.kubernetes.private_ip
  description = "Private IP of Kubernetes server (use this in Jenkins)"
}

output "frontend_url" {
  value       = "http://${aws_instance.kubernetes.public_ip}:30300"
  description = "Frontend URL (via Kubernetes NodePort)"
}

output "backend_url" {
  value       = "http://${aws_instance.kubernetes.public_ip}:30500"
  description = "Backend API URL (via Kubernetes NodePort)"
}

output "prometheus_url" {
  value       = "http://${aws_instance.kubernetes.public_ip}:9090"
  description = "Prometheus URL"
}

output "grafana_url" {
  value       = "http://${aws_instance.kubernetes.public_ip}:3001"
  description = "Grafana URL"
}

output "ssh_k8s" {
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_instance.kubernetes.public_ip}"
  description = "SSH command for NEW Kubernetes server"
}

output "next_steps" {
  value = <<-EOT
  
  ========================================
  ✅ Kubernetes EC2 Created!
  ========================================
  
  Your EXISTING Jenkins: ${var.existing_jenkins_ip}:8080
  NEW Kubernetes Server: ${aws_instance.kubernetes.public_ip}
  
  📋 Next Steps:
  
  1. Setup SSH from Jenkins to K8s:
     Read: EXISTING_JENKINS_SETUP.md
  
  2. Configure Jenkins credentials:
     - k8s-ssh-key (SSH private key)
     - k8s-server-ip (${aws_instance.kubernetes.private_ip})
  
  3. Update Jenkinsfile and deploy!
  
  ========================================
  EOT
  description = "Next steps to connect Jenkins with K8s"
}
