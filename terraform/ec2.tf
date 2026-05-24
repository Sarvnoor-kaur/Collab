# Terraform Configuration for Existing CollabSphere Infrastructure
# This file documents your existing 3 EC2 instances

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

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "collabsphere-key"
}

# Data sources to reference existing instances
data "aws_instance" "jenkins" {
  filter {
    name   = "tag:Name"
    values = ["jenkins-docker"]
  }

  filter {
    name   = "instance-state-name"
    values = ["running"]
  }
}

data "aws_instance" "k8s" {
  filter {
    name   = "tag:Name"
    values = ["k8s-server"]
  }

  filter {
    name   = "instance-state-name"
    values = ["running"]
  }
}

data "aws_instance" "monitoring" {
  filter {
    name   = "tag:Name"
    values = ["monitoring-se*"]
  }

  filter {
    name   = "instance-state-name"
    values = ["running"]
  }
}

# Outputs for existing instances
output "jenkins_instance_info" {
  value = {
    name          = "jenkins-docker"
    instance_id   = data.aws_instance.jenkins.id
    instance_type = data.aws_instance.jenkins.instance_type
    public_ip     = data.aws_instance.jenkins.public_ip
    private_ip    = data.aws_instance.jenkins.private_ip
    availability_zone = data.aws_instance.jenkins.availability_zone
  }
  description = "Jenkins EC2 instance information"
}

output "k8s_instance_info" {
  value = {
    name          = "k8s-server"
    instance_id   = data.aws_instance.k8s.id
    instance_type = data.aws_instance.k8s.instance_type
    public_ip     = data.aws_instance.k8s.public_ip
    private_ip    = data.aws_instance.k8s.private_ip
    availability_zone = data.aws_instance.k8s.availability_zone
  }
  description = "Kubernetes EC2 instance information"
}

output "monitoring_instance_info" {
  value = {
    name          = "monitoring-server"
    instance_id   = data.aws_instance.monitoring.id
    instance_type = data.aws_instance.monitoring.instance_type
    public_ip     = data.aws_instance.monitoring.public_ip
    private_ip    = data.aws_instance.monitoring.private_ip
    availability_zone = data.aws_instance.monitoring.availability_zone
  }
  description = "Monitoring EC2 instance information"
}

# Quick reference outputs
output "jenkins_url" {
  value       = "http://${data.aws_instance.jenkins.public_ip}:8080"
  description = "Jenkins URL"
}

output "frontend_url" {
  value       = "http://${data.aws_instance.k8s.public_ip}:30300"
  description = "Frontend URL (via Kubernetes NodePort)"
}

output "backend_url" {
  value       = "http://${data.aws_instance.k8s.public_ip}:30500"
  description = "Backend API URL (via Kubernetes NodePort)"
}

output "prometheus_url" {
  value       = "http://${data.aws_instance.monitoring.public_ip}:9090"
  description = "Prometheus URL"
}

output "grafana_url" {
  value       = "http://${data.aws_instance.monitoring.public_ip}:3001"
  description = "Grafana URL"
}

output "ssh_commands" {
  value = {
    jenkins    = "ssh -i ${var.key_name}.pem ubuntu@${data.aws_instance.jenkins.public_ip}"
    k8s        = "ssh -i ${var.key_name}.pem ubuntu@${data.aws_instance.k8s.public_ip}"
    monitoring = "ssh -i ${var.key_name}.pem ubuntu@${data.aws_instance.monitoring.public_ip}"
  }
  description = "SSH commands for all instances"
}

output "instance_summary" {
  value = <<-EOT
  
  ========================================
  ✅ CollabSphere Infrastructure Summary
  ========================================
  
  Instance 1: Jenkins-Docker
  - Type: ${data.aws_instance.jenkins.instance_type}
  - Zone: ${data.aws_instance.jenkins.availability_zone}
  - Public IP: ${data.aws_instance.jenkins.public_ip}
  - Private IP: ${data.aws_instance.jenkins.private_ip}
  - URL: http://${data.aws_instance.jenkins.public_ip}:8080
  
  Instance 2: Kubernetes (K3s)
  - Type: ${data.aws_instance.k8s.instance_type}
  - Zone: ${data.aws_instance.k8s.availability_zone}
  - Public IP: ${data.aws_instance.k8s.public_ip}
  - Private IP: ${data.aws_instance.k8s.private_ip}
  - Frontend: http://${data.aws_instance.k8s.public_ip}:30300
  - Backend: http://${data.aws_instance.k8s.public_ip}:30500
  
  Instance 3: Monitoring
  - Type: ${data.aws_instance.monitoring.instance_type}
  - Zone: ${data.aws_instance.monitoring.availability_zone}
  - Public IP: ${data.aws_instance.monitoring.public_ip}
  - Private IP: ${data.aws_instance.monitoring.private_ip}
  - Prometheus: http://${data.aws_instance.monitoring.public_ip}:9090
  - Grafana: http://${data.aws_instance.monitoring.public_ip}:3001
  
  ========================================
  📋 Jenkins Configuration:
  ========================================
  
  Use K8s PRIVATE IP in Jenkins: ${data.aws_instance.k8s.private_ip}
  
  ========================================
  EOT
  description = "Complete infrastructure summary"
}
