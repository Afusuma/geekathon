# SmartLabel AI - AWS Unified Deployment Guide

## 🏗️ Architecture Overview

This deployment restructure implements a **unified serverless architecture** on AWS, consolidating all services into a single, manageable deployment pipeline.

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFront CDN                        │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼─────────┐                  ┌─────────▼─────────┐
│  AWS Amplify    │                  │  API Gateway      │
│  (Next.js App)  │                  │  (REST API)       │
└─────────────────┘                  └─────────┬─────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
          ┌─────────▼─────────┐    ┌──────────▼─────────┐    ┌──────────▼─────────┐
          │ TypeScript Lambda │    │  Python Lambda     │    │  Python Lambda     │
          │ Functions         │    │  (Container)       │    │  (Container)       │
          │ - Labels API      │    │  - Nutrition Gen   │    │  - Crisis Response │
          │ - Generate API    │    │  - Visual Labels   │    │  - Market Analysis │
          └─────────┬─────────┘    └──────────┬─────────┘    └──────────┬─────────┘
                    │                          │                          │
                    └──────────────────────────┼──────────────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
              ┌─────────▼─────────┐                       ┌──────────▼─────────┐
              │    DynamoDB       │                       │     S3 Buckets     │
              │  - Labels Table   │                       │  - Label Images    │
              │  - Crisis Logs    │                       │  - Static Assets   │
              └───────────────────┘                       └────────────────────┘
                                               │
                                    ┌──────────▼─────────┐
                                    │   AWS Bedrock      │
                                    │  (Claude AI)       │
                                    └────────────────────┘
```

## 📁 New Directory Structure

```
apps/
├── api/                           # Unified backend
│   ├── src/
│   │   ├── handlers/             # TypeScript Lambda handlers
│   │   │   ├── hello.ts
│   │   │   ├── labels.ts
│   │   │   └── generate.ts
│   │   └── python/               # Python Lambda handlers
│   │       └── nutrition/
│   │           ├── handler.py   # Main Lambda entry points
│   │           ├── aws_bedrock_client.py
│   │           ├── visual_label_creator.py
│   │           ├── label_generator.py
│   │           ├── crisis_response.py
│   │           ├── market_regulations.py
│   │           ├── requirements.txt
│   │           └── Dockerfile
│   ├── layers/                   # Lambda Layers
│   │   ├── nodejs/              # Shared Node.js dependencies
│   │   └── python/              # Shared Python dependencies
│   ├── template.yaml            # Original SAM template
│   └── template-unified.yaml   # New unified SAM template
└── web/                         # Frontend (unchanged)
```

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured with appropriate credentials
- Docker installed and running
- SAM CLI installed (`pip install aws-sam-cli`)
- Node.js 20.x and pnpm installed
- Python 3.11 installed

### Environment Setup

1. Copy environment files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2. Update the `.env` files with your AWS configuration

### Deployment Commands

```bash
# Install dependencies
make install

# Deploy to development
make deploy-dev

# Deploy to staging
make deploy-staging

# Deploy to production (requires confirmation)
make deploy-prod

# Or use the deployment script directly
./deploy.sh dev
```

## 📝 Deployment Steps

The deployment process handles:

1. **Dependencies Installation** - Installs all pnpm packages
2. **TypeScript Build** - Compiles TypeScript Lambda functions
3. **Lambda Layers** - Prepares shared dependencies
4. **Docker Build** - Builds Python Lambda containers
5. **ECR Push** - Pushes containers to Amazon ECR
6. **SAM Deploy** - Deploys the complete stack
7. **Frontend Deploy** - Deploys to AWS Amplify

## 🔧 Configuration

### SAM Template Parameters

- `Environment`: dev, staging, or prod
- `BedrockModelId`: AWS Bedrock model for AI operations

### Environment Variables

#### Backend (Lambda)
- `NODE_ENV`: Runtime environment
- `LABELS_TABLE`: DynamoDB table for labels
- `CRISIS_LOGS_TABLE`: DynamoDB table for crisis logs
- `LABELS_BUCKET`: S3 bucket for label storage
- `BEDROCK_REGION`: AWS region for Bedrock

#### Frontend (Next.js)
- `NEXT_PUBLIC_API_URL`: API Gateway endpoint
- `NEXT_PUBLIC_ENABLE_CRISIS_RESPONSE`: Feature flag
- `NEXT_PUBLIC_ENABLE_VISUAL_LABELS`: Feature flag

## 🛠️ Development

### Local Development

```bash
# Start both frontend and backend
pnpm dev

# Frontend only (port 3000)
pnpm dev:frontend

# Backend only (port 3001)
pnpm dev:backend
```

### Testing

```bash
# Run all tests
make test

# Test deployed APIs
make test-api

# View Lambda logs
make logs
```

## 📊 Monitoring

### CloudWatch Dashboards

The deployment automatically creates CloudWatch dashboards for:
- API Gateway metrics
- Lambda function performance
- DynamoDB throttling
- Error rates and alarms

### View Logs

```bash
# Tail Lambda logs
sam logs --stack-name smartlabel-api-dev --tail

# Or use the Makefile
make logs
```

## 🔒 Security

- All Lambda functions use IAM roles with least privilege
- DynamoDB tables have point-in-time recovery enabled
- S3 buckets have versioning and encryption enabled
- API Gateway has throttling and request validation
- Secrets stored in AWS Secrets Manager (not in code)

## 💰 Cost Optimization

- **Lambda**: Pay only for execution time
- **DynamoDB**: On-demand billing for unpredictable workloads
- **S3**: Lifecycle policies to transition to cheaper storage
- **API Gateway**: Caching enabled for repeated requests
- **CloudFront**: CDN caching for static assets

### Estimated Monthly Costs (Development)
- Lambda: ~$5-10
- DynamoDB: ~$5-10
- S3: ~$2-5
- API Gateway: ~$3-5
- **Total: ~$15-35/month**

## 🚨 Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker daemon
   sudo systemctl start docker  # Linux
   open -a Docker  # macOS
   ```

2. **ECR repository not found**
   ```bash
   make setup-aws
   ```

3. **SAM build fails**
   ```bash
   # Clean and rebuild
   make clean
   make build
   ```

4. **Stack already exists**
   ```bash
   # Delete existing stack
   make delete-stack
   ```

## 📚 API Endpoints

After deployment, the following endpoints are available:

### TypeScript Lambda Functions
- `GET /hello` - Health check
- `GET /labels` - List all labels
- `POST /labels` - Create new label
- `GET /labels/{id}` - Get label by ID
- `DELETE /labels/{id}` - Delete label
- `POST /generate` - Generate label with AI

### Python Lambda Functions
- `POST /nutrition/generate` - Generate nutrition labels
- `POST /nutrition/crisis-response` - Crisis response analysis
- `POST /nutrition/visual` - Generate visual labels only
- `GET /nutrition/health` - Python service health check

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy-aws.yml`) automatically:

1. Runs tests on every push
2. Deploys to staging on push to `staging` branch
3. Deploys to production on push to `main` branch
4. Supports manual deployment via workflow dispatch

## 📈 Next Steps

1. **Add Custom Domain**: Configure Route 53 and API Gateway custom domain
2. **Enable WAF**: Add AWS WAF for additional security
3. **Setup Monitoring**: Configure detailed CloudWatch alarms
4. **Add Caching**: Implement ElastiCache for frequently accessed data
5. **Enable X-Ray**: Add distributed tracing for debugging

## 🤝 Support

For issues or questions:
1. Check CloudWatch logs: `make logs`
2. View stack information: `make stack-info`
3. Review this guide and troubleshooting section
4. Contact the DevOps team

---

**Created by Winston 🏗️ - SmartLabel AI Architect**