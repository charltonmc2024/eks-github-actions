# Erudition Solution — Product Context

## Purpose

This project is a beginner-friendly learning exercise. The goal is to take the
existing Erudition landing page and run it on Amazon EKS, using GitHub Actions
for CI/CD, Amazon ECR for container images, and Terraform for infrastructure.

The emphasis is on learning a clean, minimal, cost-conscious container
deployment path end to end — not on building the full assessment product.

---

## What We Are Building

Only the **Erudition landing page** (the existing Next.js marketing site) runs
on EKS. Preserve the landing page and its required assets exactly as they are.

Out of scope for this project (do not build these):

- Backend APIs as separate services
- DynamoDB
- S3 frontend hosting
- CloudFront
- Route 53
- ACM certificates
- Student/teacher assessment features, sign-in flows, or data storage

### Note on the existing `api/support` route

The Next.js app contains one route at `src/app/api/support/route.ts`. It is part
of the landing page's own server (not a separate backend service), so it stays
unchanged. It may still call the external `formsubmit.co` service to send a
support/contact email. Twilio SMS is optional: when the Twilio environment
variables are absent, SMS is skipped and email still works. Do not configure
Twilio secrets for this project.

---

## Learning Objectives

By completing this project a beginner should understand:

- How a Next.js app is containerized and served from a single Docker image.
- How Terraform provisions a VPC, an ECR repository, and an EKS cluster.
- How a small managed node group runs application pods in private subnets.
- How Kubernetes Deployments, Services, and health probes work.
- How GitHub Actions authenticates to AWS with OIDC (no stored access keys).
- How an image is tagged with the Git commit SHA, pushed to ECR, and deployed.
- How to reach a private, in-cluster Service with `kubectl port-forward`.
- Which AWS resources carry recurring cost and how to turn them off.

---

## Primary Users (of this project)

The audience is the learner operating the project, not application end users.
There are no student or teacher application features in scope.

---

## Engineering Goals

The deployment should be:

- Secure (least privilege, private workloads, no long-lived credentials)
- Automated (GitHub Actions builds and deploys)
- Cost-conscious (minimal always-on resources; easy to tear down)
- Reproducible (Infrastructure-as-Code with Terraform)
- Understandable (small, readable modules and manifests)

High availability, multi-environment promotion, and production hardening are
explicitly out of scope for this learning exercise.

---

## Current Environment Scope

The only environment is development.

Terraform deployment root:

`eks-terraform/envs/dev/`

Do not create `envs/staging/` or `envs/prod/` unless explicitly requested.

Reusable modules should remain environment-independent where practical so a
future environment could consume them without redesigning the architecture. Do
not create staging or production resources for future compatibility now.

---

## High-Level Architecture

```text
Developer
   |
   | kubectl port-forward
   v
Service (ClusterIP)
   |
   v
Deployment (2 replicas, landing page on :3000)
   |
   v
EKS managed node group (small nodes, private subnets)

GitHub Actions
   |
   | OIDC (no stored keys)
   v
AWS IAM role --> push image --> ECR --> kubectl rollout --> EKS API
```

Initial access to the running page is through `kubectl port-forward`. No public
load balancer, Ingress, CloudFront, or custom domain is created in this scope.

---

## Technology

### Application

- Next.js (standalone output)
- Node.js
- TypeScript
- Docker

### Infrastructure

- AWS
- Terraform

### Compute / Orchestration

- Amazon EKS (managed node group on EC2)
- Kubernetes (Deployment + ClusterIP Service)

### Registry

- Amazon ECR

### CI/CD

- GitHub Actions (with GitHub OIDC federation to AWS)

---

## Cost Principle

Prefer the lowest-cost architecture that satisfies the learning and security
goals. Verify current regional pricing before quoting figures (see
`conventions.md` for the recorded reference figures and date).

The two notable recurring costs in this design are the EKS control plane and,
if chosen, a NAT gateway. A NAT gateway is a **design choice**, not a mandatory
EKS charge — compare connectivity options before selecting the network design
(see `architecture.md`). Nodes (EC2) and ECR storage are additional variable
costs.

Do not add AWS services simply to increase complexity. Every recurring-cost
resource must have a clear learning, security, or functional purpose. Document
how to tear the environment down when not in use.
