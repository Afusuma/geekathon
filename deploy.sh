#!/bin/bash
# SmartLabel AI - Unified AWS Deployment Script

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="smartlabel-api-${ENVIRONMENT}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SmartLabel AI - AWS Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "Stack: ${YELLOW}${STACK_NAME}${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}[1/7] Installing dependencies...${NC}"
pnpm install

# Step 2: Build TypeScript Lambda functions
echo -e "${YELLOW}[2/7] Building TypeScript functions...${NC}"
cd apps/api
pnpm build
cd ../..

# Step 3: Prepare Lambda layers
echo -e "${YELLOW}[3/7] Preparing Lambda layers...${NC}"

# Python layer
echo "Installing Python dependencies for layer..."
cd apps/api/layers/python
pip install -r requirements.txt -t python/lib/python3.11/site-packages/ --platform manylinux2014_x86_64 --only-binary=:all:
cd ../../../..

# Node.js layer
echo "Installing Node.js dependencies for layer..."
cd apps/api/layers/nodejs
npm install --production
cd ../../../..

# Step 4: Build Python Lambda containers
echo -e "${YELLOW}[4/7] Building Python Lambda containers...${NC}"
cd apps/api/src/python/nutrition

# Build Docker images for Python functions
docker build -t smartlabel-nutrition:latest .

# Tag images for ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker tag smartlabel-nutrition:latest ${ECR_REPOSITORY}/smartlabel-nutrition:latest

cd ../../../../..

# Step 5: Push to ECR (create repository if needed)
echo -e "${YELLOW}[5/7] Pushing images to ECR...${NC}"

# Create ECR repository if it doesn't exist
aws ecr describe-repositories --repository-names smartlabel-nutrition --region ${AWS_REGION} 2>/dev/null || \
aws ecr create-repository --repository-name smartlabel-nutrition --region ${AWS_REGION}

# Get ECR login token
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPOSITORY}

# Push images
docker push ${ECR_REPOSITORY}/smartlabel-nutrition:latest

# Step 6: Deploy with SAM
echo -e "${YELLOW}[6/7] Deploying with SAM...${NC}"
cd apps/api

sam build --template-file template-unified.yaml --use-container

sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name ${STACK_NAME} \
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
    --parameter-overrides Environment=${ENVIRONMENT} \
    --region ${AWS_REGION} \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

cd ../..

# Step 7: Deploy frontend to Amplify
echo -e "${YELLOW}[7/7] Deploying frontend to Amplify...${NC}"
if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "Building frontend for production..."
    cd apps/web
    pnpm build

    # Get API Gateway URL from CloudFormation output
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name ${STACK_NAME} \
        --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
        --output text \
        --region ${AWS_REGION})

    echo "API URL: ${API_URL}"

    # Update environment variables
    echo "NEXT_PUBLIC_API_URL=${API_URL}" > .env.production

    # Trigger Amplify deployment
    if [ ! -z "$AMPLIFY_APP_ID" ]; then
        aws amplify start-deployment --app-id ${AMPLIFY_APP_ID} --branch-name ${ENVIRONMENT}
    else
        echo -e "${YELLOW}Skipping Amplify deployment (AMPLIFY_APP_ID not set)${NC}"
    fi

    cd ../..
fi

# Output deployment information
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

# Get stack outputs
aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs" \
    --output table \
    --region ${AWS_REGION}

echo ""
echo -e "${GREEN}API Endpoints:${NC}"
echo -e "  Health Check: ${API_URL}/hello"
echo -e "  Labels API: ${API_URL}/labels"
echo -e "  Nutrition Generate: ${API_URL}/nutrition/generate"
echo -e "  Crisis Response: ${API_URL}/nutrition/crisis-response"
echo ""

# Run tests if in dev environment
if [ "$ENVIRONMENT" = "dev" ]; then
    echo -e "${YELLOW}Running API tests...${NC}"
    curl -s ${API_URL}/hello | jq .
    curl -s ${API_URL}/nutrition/health | jq .
fi