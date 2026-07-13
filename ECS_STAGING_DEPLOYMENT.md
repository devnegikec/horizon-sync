# ECS Staging Deployment — staging-horizon-cluster (us-east-1)

Complete documentation of the current Horizon Sync staging deployment on AWS ECS, based on live account data.

---

## Account & Cluster Overview

| Item              | Value                                                  |
| ----------------- | ------------------------------------------------------ |
| AWS Account       | 287566806648                                           |
| IAM User          | devendra.n@ciphercode.ai                               |
| Region            | us-east-1                                              |
| ECS Cluster       | staging-horizon-cluster                                |
| Capacity Provider | FARGATE                                                |
| Active Services   | 6                                                      |
| Running Tasks     | 8                                                      |
| VPC               | vpc-a00dcedb (default VPC, 172.31.0.0/16)              |
| SSL Certificate   | \*.ciphercode.ai (ACM, ISSUED)                         |
| ALB DNS           | fastapi-alb-new-1791214058.us-east-1.elb.amazonaws.com |

---

## Architecture Diagram

```
                         Internet
                            │
                   ┌────────┴────────┐
                   │  ALB (fastapi-  │
                   │  alb-new)       │
                   │  :80 → HTTPS    │
                   │  :443 (TLS)     │
                   └────────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │ Path Routing on horizon.ciphercode.ai │
        ├───────────────────┼───────────────────┤
        │                   │                   │
   /api/v1/identity/*  /api/v1/core/*           /api/v1/search/*
        │              (catch-all)              │
        ▼                   ▼                   ▼
 ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 │  identity    │  │    core      │  │   search     │
 │  :8000       │  │    :8001     │  │   :8002      │
 │  (Fargate)   │  │  (Fargate)   │  │  (Fargate)   │
 └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
        │                 │                  │
        └─────────┬───────┘                  │
                  ▼                          │
        ┌──────────────┐                     │
        │  PostgreSQL  │◄────────────────────┘
        │  (Fargate)   │
        │  :5432       │
        └──────────────┘
                  │
        ┌──────────────┐
        │    Redis     │
        │  (Fargate)   │
        │  :6379       │
        └──────────────┘

   ┌──────────────┐
   │  Frontend    │  ← horizon.ciphercode.ai /* (default)
   │  :80         │  ← also core.ciphercode.ai
   └──────────────┘
```

---

## ECR Repositories

| Repository               | URI                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| staging-identity-service | 287566806648.dkr.ecr.us-east-1.amazonaws.com/staging-identity-service |
| core-staging-horizon     | 287566806648.dkr.ecr.us-east-1.amazonaws.com/core-staging-horizon     |
| search-staging-horizon   | 287566806648.dkr.ecr.us-east-1.amazonaws.com/search-staging-horizon   |
| horizon-postgres         | 287566806648.dkr.ecr.us-east-1.amazonaws.com/horizon-postgres         |
| horizon-frontend-sg      | 287566806648.dkr.ecr.us-east-1.amazonaws.com/horizon-frontend-sg      |

---

## ECS Services & Task Definitions

| Service Name                   | Task Definition          | CPU | Memory | Port | Desired | Running | Image                           |
| ------------------------------ | ------------------------ | --- | ------ | ---- | ------- | ------- | ------------------------------- |
| identity-task-service-w4pkivi7 | identity-task:8          | 512 | 1024   | 8000 | 1       | 1       | staging-identity-service:latest |
| core-service                   | core-staging-horizon:4   | 512 | 1024   | 8001 | 1       | 1       | core-staging-horizon:latest     |
| search-staging-horizon-service | search-staging-horizon:1 | 512 | 1024   | 8002 | 1       | 1       | search-staging-horizon:latest   |
| postgres-staging-service       | horizon-postgres-new:8   | 512 | 1024   | 5432 | 1       | 1       | horizon-postgres:latest         |
| horizon-redis-service          | horizon-redis:1          | 256 | 512    | 6379 | 1       | 1       | redis:7-alpine                  |
| horizon-sg-frontend-service    | horizon-sg-frontend:4    | 512 | 1024   | 80   | 1       | 1       | horizon-frontend-sg:latest      |

---

## Environment Variables per Service

### identity-service

`EMAIL_ENABLED`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `PORT`, `DB_PORT`, `DB_USER`, `ENVIRONMENT`, `DB_POOL_SIZE`, `SECRET_KEY`, `DB_NAME`, `REFRESH_TOKEN_EXPIRE_DAYS`, `DB_HOST`, `DEBUG`, `RATE_LIMIT_PER_MINUTE`, `PASSWORD_RESET_TOKEN_EXPIRE_HOURS`, `DB_MAX_OVERFLOW`, `DATABASE_URL`, `SMTP_PORT`, `SMTP_PASSWORD`, `CORS_ALLOW_CREDENTIALS`, `LOG_LEVEL`, `DB_PASSWORD`

### core-service

`PORT`, `DB_PORT`, `DB_USER`, `ALGORITHM`, `DB_POOL_SIZE`, `ENVIRONMENT`, `APP_NAME`, `SECRET_KEY`, `DB_NAME`, `CORS_ORIGINS`, `IDENTITY_DATABASE_URL`, `APP_VERSION`, `DB_HOST`, `DEBUG`, `RATE_LIMIT_PER_MINUTE`, `DB_MAX_OVERFLOW`, `DATABASE_URL`, `CORS_ALLOW_CREDENTIALS`, `LOG_LEVEL`, `DB_PASSWORD`, `REDIS_URL`

### search-service

`PORT`, `IDENTITY_SERVICE_URL`, `CORE_SERVICE_URL`, `DB_PORT`, `DB_USER`, `SECRET_KEY`, `DB_HOST`, `SEARCH_MAX_RESULTS`, `SEARCH_DEFAULT_PAGE_SIZE`, `DATABASE_URL`, `REDIS_STREAM_NAME`, `DB_PASSWORD`, `REDIS_URL`

### postgres

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `PGDATA`

---

## Networking

### VPC

- VPC ID: `vpc-a00dcedb` (default VPC)
- CIDR: `172.31.0.0/16`
- All services use public subnets with `assignPublicIp: ENABLED`

### Subnets (all public, all services deployed across all 6)

| Subnet ID       | CIDR           | AZ         |
| --------------- | -------------- | ---------- |
| subnet-df793782 | 172.31.32.0/20 | us-east-1a |
| subnet-21b78b45 | 172.31.0.0/20  | us-east-1b |
| subnet-bd0b4192 | 172.31.80.0/20 | us-east-1c |
| subnet-f95745b2 | 172.31.16.0/20 | us-east-1d |
| subnet-488bc077 | 172.31.64.0/20 | us-east-1e |
| subnet-7b70b874 | 172.31.48.0/20 | us-east-1f |

### Security Group

All 6 services use the same security group: `sg-4810483f` (default)

| Direction | Protocol | Ports | Source/Dest        |
| --------- | -------- | ----- | ------------------ |
| Inbound   | TCP      | 80    | 0.0.0.0/0          |
| Inbound   | TCP      | 443   | 0.0.0.0/0          |
| Inbound   | All      | All   | sg-4810483f (self) |
| Outbound  | All      | All   | 0.0.0.0/0          |

---

## Load Balancer (ALB)

- Name: `fastapi-alb-new`
- Scheme: internet-facing
- DNS: `fastapi-alb-new-1791214058.us-east-1.elb.amazonaws.com`
- VPC: `vpc-a00dcedb`

### Listeners

| Port | Protocol | Action                               |
| ---- | -------- | ------------------------------------ |
| 80   | HTTP     | Redirect → HTTPS :443                |
| 81   | HTTP     | Redirect → HTTPS :443                |
| 82   | HTTP     | Forward → Frontend-TG                |
| 83   | HTTP     | Forward → search-staging-tg          |
| 443  | HTTPS    | Path-based routing (see rules below) |

### HTTPS (:443) Routing Rules — Host: `horizon.ciphercode.ai`

| Priority | Condition                                               | Target Group                      |
| -------- | ------------------------------------------------------- | --------------------------------- |
| 1        | Host: horizon.ciphercode.ai + Path: /api/v1/identity/\* | fastapi-tg-new (identity, :8000)  |
| 2        | Host: horizon.ciphercode.ai + Path: /api/v1/\*          | core-staging-tg (core, :8001)     |
| 3        | Host: horizon.ciphercode.ai + Path: /api/v1/search/\*   | search-staging-tg (search, :8002) |
| 4        | Host: core.ciphercode.ai                                | core-staging-tg (core, :8001)     |
| 5        | Host: horizon.ciphercode.ai + Path: /\*                 | Frontend-TG (frontend, :80)       |
| Default  | —                                                       | Frontend-TG (frontend, :80)       |

### Target Groups & Health

| Target Group      | Port | Health Check | Current Status                            |
| ----------------- | ---- | ------------ | ----------------------------------------- |
| fastapi-tg-new    | 8000 | /health      | healthy                                   |
| core-staging-tg   | 8001 | /health      | healthy (1 draining from previous deploy) |
| search-staging-tg | 8002 | /health      | healthy                                   |
| Frontend-TG       | 80   | /            | healthy                                   |

---

## SSL/TLS Certificate

- ARN: `arn:aws:acm:us-east-1:287566806648:certificate/ab76c123-9cae-4b3e-91d4-b808b00e33c3`
- Domain: `*.ciphercode.ai` + `ciphercode.ai`
- Status: ISSUED
- TLS Policy: `ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09`

---

## Database (PostgreSQL on Fargate)

Currently running PostgreSQL as a Fargate task (not RDS).

- Task: `horizon-postgres-new:8`
- Image: `horizon-postgres:latest` (custom image in ECR)
- CPU: 512, Memory: 1024
- Port: 5432
- No RDS instances found in the account

> **Note:** This means the database is ephemeral — if the Fargate task restarts, data could be lost unless you have an EFS volume or EBS mount attached. Consider migrating to RDS for production durability.

---

## Redis (on Fargate)

- Task: `horizon-redis:1`
- Image: `redis:7-alpine` (public Docker Hub image)
- CPU: 256, Memory: 512
- Port: 6379

---

## How to Redeploy a Service

```bash
# 1. Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 287566806648.dkr.ecr.us-east-1.amazonaws.com

# 2. Build and push (example: core-service)
docker build -t core-staging-horizon:latest ./core-service
docker tag core-staging-horizon:latest 287566806648.dkr.ecr.us-east-1.amazonaws.com/core-staging-horizon:latest
docker push 287566806648.dkr.ecr.us-east-1.amazonaws.com/core-staging-horizon:latest

# 3. Force new deployment
aws ecs update-service \
  --cluster staging-horizon-cluster \
  --service core-service \
  --force-new-deployment \
  --region us-east-1
```

Repeat with the appropriate repo name and service name for identity or search.

---

## Useful Commands

```bash
# Check all service statuses
aws ecs describe-services \
  --cluster staging-horizon-cluster \
  --services identity-task-service-w4pkivi7 core-service search-staging-horizon-service \
  --query 'services[].{name:serviceName,running:runningCount,desired:desiredCount}' \
  --region us-east-1

# View recent logs for core-service
aws logs tail /ecs/core-staging-horizon --follow --region us-east-1

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:287566806648:targetgroup/core-staging-tg/5c76758a370b3694 \
  --region us-east-1

# List running tasks
aws ecs list-tasks --cluster staging-horizon-cluster --region us-east-1
```

---

## Observations & Recommendations

1. **PostgreSQL on Fargate is risky** — Fargate tasks are ephemeral. If the postgres task restarts, you lose data unless EFS is mounted. Strongly consider migrating to RDS for staging/production.

2. **No Secrets Manager usage** — All env vars (including `DB_PASSWORD`, `SECRET_KEY`, `SMTP_PASSWORD`) are set as plain-text environment variables in task definitions. Move sensitive values to AWS Secrets Manager and reference them via the `secrets` field in the task definition.

3. **Single security group for everything** — ALB, ECS tasks, database, and Redis all share `sg-4810483f` (default). Create separate security groups so the database only accepts traffic from ECS tasks, not the internet.

4. **All tasks have public IPs** — Every service including Postgres and Redis has `assignPublicIp: ENABLED`. Database and Redis should not be publicly accessible. Use private subnets + NAT Gateway for backend services.

5. **No auto-scaling configured** — All services run with `desiredCount: 1`. Add auto-scaling policies for the application services (identity, core, search) to handle traffic spikes.

6. **ALB routing order issue** — Rule 2 (`/api/v1/*`) has higher priority than Rule 3 (`/api/v1/search/*`), which means search requests will be caught by the core-service rule and never reach the search service. Move the search rule to priority 2 (or lower number than the catch-all `/api/v1/*` rule).

7. **No EFS volume for Postgres** — Verify if the postgres task definition has an EFS volume attached for data persistence. Without it, a task restart means full data loss.
