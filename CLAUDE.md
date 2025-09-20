# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the SmartLabel AI monorepo - a Geekathon 2025 project implementing AI-powered solutions for smart food factories. The project uses Turborepo to manage a full-stack application with Next.js frontend, AWS Lambda backend, and shared TypeScript packages.

## Architecture

```
smartlabel-ai/
├── apps/
│   ├── web/                 # Next.js frontend (port 3000)
│   └── api/                 # AWS Lambda backend (port 3001)
│       └── src/python/      # Python services for AI processing (port 5001)
├── packages/
│   ├── shared/              # Shared TypeScript types and schemas
│   ├── ui/                  # Shared React components
│   ├── eslint-config/       # ESLint configuration
│   └── typescript-config/   # TypeScript configuration
└── docs/                    # BMad Method documentation
```

## Development Commands

### Essential Commands
```bash
# Install dependencies
pnpm install

# Start both frontend and backend development servers
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type checking across all packages
pnpm check-types

# Format code
pnpm format
```

### Individual App Commands
```bash
# Frontend only (Next.js on port 3000)
pnpm dev:frontend
# Alternative: pnpm --filter=web dev

# Backend only (Lambda dev server on port 3001)
pnpm dev:backend
# Alternative: pnpm --filter=@repo/api dev

# Build specific package
pnpm --filter=@repo/shared build

# Test API package
pnpm --filter=@repo/api test
```

### AWS Deployment (API)
```bash
# Local SAM development
pnpm --filter=@repo/api dev:sam

# Deploy to AWS
pnpm --filter=@repo/api deploy

# Watch mode for TypeScript compilation
pnpm --filter=@repo/api dev:watch
```

### Python Services
```bash
# Run nutrition label service locally (Python server on port 5001)
cd apps/api/src/python/nutrition && python local_server.py

# Alternative: Start Python service through API dev
pnpm --filter=@repo/api dev  # This will also handle Python services
```

## Key Technologies

- **Monorepo**: Turborepo with pnpm workspaces
- **Frontend**: Next.js 15 with React 19, TanStack Query, Tailwind CSS
- **Backend**: AWS Lambda with TypeScript, Express dev server, Python services
- **AI Engine**: AWS Bedrock for nutrition label generation, Python-based processing
- **Shared**: TypeScript types built with tsup for dual CJS/ESM output
- **Infrastructure**: AWS SAM for serverless deployment

## Development Workflow

1. **Shared Types**: Always update types in `packages/shared/src/types.ts` when modifying API contracts
2. **Hot Reloading**: Both frontend and backend support hot reloading during development
3. **Type Safety**: Changes to shared types automatically propagate to both apps
4. **Testing**: API endpoint testing available at http://localhost:3001/hello
5. **Python Services**: AI nutrition services available at http://localhost:5001 (when running)
6. **Steel Thread**: End-to-end connectivity proven - frontend can successfully call backend APIs

## Important Files

- `turbo.json` - Turborepo task configuration with build dependencies
- `pnpm-workspace.yaml` - Workspace package definitions
- `apps/web/app/page.tsx` - Main frontend page with API integration example
- `apps/api/src/handlers/hello.ts` - Lambda function handlers
- `apps/api/src/python/nutrition/` - Python AI services for nutrition label generation
- `apps/api/template.yaml` - SAM template for AWS deployment
- `packages/shared/src/types.ts` - Shared TypeScript interfaces

## Package Manager

This project uses **pnpm** as the package manager. Always use pnpm commands, not npm or yarn.

## Testing the Setup

1. Run `pnpm dev` to start both servers
2. Visit http://localhost:3000 for the frontend
3. Test API connectivity by clicking "Call Hello API" button
4. Direct API test: `curl http://localhost:3001/hello`

## BMad Method Integration

This project follows the BMad Method for AI-driven development with documentation in the `docs/` directory organized by stories and architecture contexts.

*** CRITICAL: DO NOT COMMIT WITHOUT ASKING!!!!! ***