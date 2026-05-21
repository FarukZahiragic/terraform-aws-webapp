# Automated AWS Infrastructure & Web Application Deployment

![Terraform](https://img.shields.io/badge/Terraform-1.5+-blue?logo=terraform)
![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazon-aws)
![CI/CD](https://img.shields.io/badge/CI%2FCD-Automated-brightgreen?logo=github-actions)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)

A full-stack web application demonstrating automated cloud provisioning and deployment. The primary focus of this project is the underlying **Infrastructure-as-Code (IaC)** and the **CI/CD pipeline**, ensuring repeatable, scalable, and automated deployments to AWS.

## 🏗️ Architecture & Infrastructure

The cloud environment is entirely provisioned using **Terraform**, avoiding manual console configuration and ensuring environmental parity. 

* **Compute:** Containerized application compute layer deployed on AWS.
* **Database:** Managed relational database hosted on Amazon RDS.
* **Networking:** Custom VPC architecture featuring public and private subnets, internet gateways, and strict security groups to regulate inbound/outbound traffic.
* **State Management:** Terraform state is securely managed via a remote backend (utilizing S3 for storage and DynamoDB for state locking) to prevent race conditions during automated deployments.

## ⚙️ CI/CD Pipeline

The delivery lifecycle is automated to enable rapid iteration, consistent infrastructure updates, and safe deployments.

The pipeline executes the following stages upon code changes:
1. **Lint & Validation:** Runs static code analysis and `terraform validate` to ensure configuration integrity.
2. **Build & Package:** Builds the application Docker image and prepares it for deployment.
3. **Infrastructure Audit:** Runs `terraform plan` to detect any drift or upcoming changes to the AWS environment before applying.
4. **Deploy:** Executes `terraform apply` (auto-approved in CI) to update infrastructure, followed by rolling out the new container image to the compute instances.

## 🛠️ Technical Stack

### Operations & Infrastructure
* **IaC:** Terraform
* **Cloud Provider:** AWS (VPC, EC2/ECS, RDS, IAM, S3, DynamoDB)
* **Containerization:** Docker
* **Automation:** CI/CD Pipeline Configuration

### Application Layer
* **Architecture:** Containerized Web Frontend and Backend Services
* **Database:** Relational Database (Amazon RDS)

## 🚀 Running Locally

To run the application and infrastructure locally:

### 1. Application (Docker)
Ensure Docker is running, then execute:
```bash
docker-compose up --build
