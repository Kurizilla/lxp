# Phase 3 Build Orchestrator

Project workspace for Phase 3 of the LXP platform development.

## Overview

Phase 3 focuses on the build orchestration and automated task execution for the LXP project. This phase coordinates the implementation of features across multiple layers (backend, frontend, shared) through a structured task-driven approach.

## Structure

This workspace follows the Phase 3 Build Orchestrator methodology:

- **Task-Driven Development**: Each feature is broken into discrete tasks with clear definitions of done
- **Layer Separation**: Tasks are organized by layer (backend, frontend, shared, database)
- **Contract-First**: API contracts are defined before implementation
- **Verification Gates**: All changes must pass lint and test checks before completion

## Workflow

1. **Task Assignment**: Tasks are assigned with specific IDs (e.g., T1, T2, T3)
2. **TODO Planning**: Each task begins with a 5-12 step TODO list
3. **Implementation**: Code is developed following repository conventions
4. **Verification**: Health checks (lint, tests) must pass
5. **PR Creation**: Structured PRs with Definition of Done checklists

## Conventions

- **Naming**: Use `snake_case` for files and functions
- **Module Prefixes**: Use prefixes like `m01_`, `m02_` per foundation guidelines
- **File Placement**: Follow `repo_layout` specifications
- **Contracts**: Update API contracts when adding/modifying endpoints

## Branch Strategy

- **Main Branch**: `main` - stable releases
- **Feature Branches**: `phase3/<run_id>/<task_id>` - task-specific development

## Getting Started

1. Clone the repository
2. Checkout your assigned task branch
3. Review the task definition and contracts
4. Create your implementation TODO list
5. Implement, verify, and submit PR

## Health Checks

Before marking any task as complete:

```bash
# Run linting (if configured)
npm run lint   # or: pnpm lint / yarn lint

# Run tests (if configured)
npm test       # or: pnpm test / yarn test
```

## License

Proprietary - Kurizilla/LXP
