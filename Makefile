# SmartLabel AI - Makefile for deployment automation

.PHONY: help install build test deploy deploy-dev deploy-staging deploy-prod clean

# Variables
ENVIRONMENT ?= dev
AWS_REGION ?= us-east-1
STACK_NAME = smartlabel-api-$(ENVIRONMENT)

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)SmartLabel AI - Deployment Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	pnpm install

build: ## Build all packages
	@echo "$(GREEN)Building all packages...$(NC)"
	pnpm build

test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	pnpm test --if-present
	pnpm lint
	pnpm check-types

local: ## Start local development servers
	@echo "$(GREEN)Starting local development...$(NC)"
	pnpm dev

deploy-dev: ## Deploy to development environment
	@echo "$(GREEN)Deploying to development...$(NC)"
	./deploy.sh dev

deploy-staging: ## Deploy to staging environment
	@echo "$(GREEN)Deploying to staging...$(NC)"
	./deploy.sh staging

deploy-prod: ## Deploy to production environment
	@echo "$(GREEN)Deploying to production...$(NC)"
	@echo "$(RED)Production deployment requires confirmation$(NC)"
	@read -p "Are you sure you want to deploy to production? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	./deploy.sh prod

deploy: deploy-$(ENVIRONMENT) ## Deploy to specified environment (use ENVIRONMENT=xxx)

validate: ## Validate SAM template
	@echo "$(GREEN)Validating SAM template...$(NC)"
	cd apps/api && sam validate --template-file template-unified.yaml

build-python: ## Build Python Lambda containers
	@echo "$(GREEN)Building Python Lambda containers...$(NC)"
	cd apps/api/src/python/nutrition && docker build -t smartlabel-nutrition:latest .

test-api: ## Test API endpoints
	@echo "$(GREEN)Testing API endpoints...$(NC)"
	@API_URL=$$(aws cloudformation describe-stacks --stack-name $(STACK_NAME) --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text --region $(AWS_REGION)); \
	echo "Testing $$API_URL/hello"; \
	curl -s $$API_URL/hello | jq .; \
	echo "Testing $$API_URL/nutrition/health"; \
	curl -s $$API_URL/nutrition/health | jq .

logs: ## Tail Lambda function logs
	@echo "$(GREEN)Tailing Lambda logs...$(NC)"
	sam logs --stack-name $(STACK_NAME) --tail --region $(AWS_REGION)

stack-info: ## Show CloudFormation stack information
	@echo "$(GREEN)Stack Information for $(STACK_NAME)$(NC)"
	aws cloudformation describe-stacks --stack-name $(STACK_NAME) --query "Stacks[0].Outputs" --output table --region $(AWS_REGION)

delete-stack: ## Delete CloudFormation stack
	@echo "$(RED)Deleting stack $(STACK_NAME)...$(NC)"
	@read -p "Are you sure you want to delete the stack? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	aws cloudformation delete-stack --stack-name $(STACK_NAME) --region $(AWS_REGION)
	aws cloudformation wait stack-delete-complete --stack-name $(STACK_NAME) --region $(AWS_REGION)

clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	rm -rf apps/api/dist
	rm -rf apps/api/.aws-sam
	rm -rf apps/web/.next
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf packages/*/dist

setup-aws: ## Setup AWS resources (ECR, etc.)
	@echo "$(GREEN)Setting up AWS resources...$(NC)"
	@echo "Creating ECR repository..."
	aws ecr describe-repositories --repository-names smartlabel-nutrition --region $(AWS_REGION) 2>/dev/null || \
	aws ecr create-repository --repository-name smartlabel-nutrition --region $(AWS_REGION)

monitor: ## Open CloudWatch dashboard
	@echo "$(GREEN)Opening CloudWatch dashboard...$(NC)"
	@API_ID=$$(aws cloudformation describe-stacks --stack-name $(STACK_NAME) --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayRestApiId'].OutputValue" --output text --region $(AWS_REGION)); \
	open "https://$(AWS_REGION).console.aws.amazon.com/cloudwatch/home?region=$(AWS_REGION)#dashboards:name=SmartLabel-$(ENVIRONMENT)"

costs: ## Estimate monthly costs
	@echo "$(GREEN)Estimating monthly costs for $(ENVIRONMENT)...$(NC)"
	aws ce get-cost-forecast \
		--time-period Start=$$(date -u +%Y-%m-%d),End=$$(date -u -d "+30 days" +%Y-%m-%d) \
		--metric UNBLENDED_COST \
		--granularity MONTHLY \
		--filter file://cost-filter.json 2>/dev/null || echo "Cost estimation requires AWS Cost Explorer API access"