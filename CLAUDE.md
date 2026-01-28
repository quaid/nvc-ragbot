# NVC RAGbot

> **Project Name:** nvc-ragbot
> **Last Updated:** 2026-01-21
> **Project Root:** /Volumes/Cody/projects/nvc-ragbot

## Overview

NVC RAGbot is a RAG-powered chatbot customized for Nonviolent Communication (NVC) content. Based on the ragbot-starter template, this project integrates with ZeroDB for vector storage and semantic search capabilities.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev
```

## Project Structure

```
nvc-ragbot/
├── CLAUDE.md              # This file - project context
├── app/                   # Next.js application routes
├── components/            # React components
├── lib/                   # Utility libraries
├── scripts/               # Build and utility scripts
├── __tests__/             # Test suites
├── .claude/
│   ├── commands/          # Slash commands (symlinked + local)
│   ├── skills/            # Modular skills (symlinked from core)
│   └── developer_guide.md # ZeroDB API reference
└── public/                # Static assets
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
```

## Technology Stack

- **Framework:** Next.js 14+
- **UI:** React, Tailwind CSS
- **AI:** OpenAI API for embeddings and chat
- **Vector DB:** ZeroDB
- **Testing:** Jest

## Key Configuration

### Environment Variables

Required in `.env`:
- `OPENAI_API_KEY` - OpenAI API key for embeddings and chat
- `ZERODB_API_KEY` - ZeroDB project API key
- `ZERODB_PROJECT_ID` - ZeroDB project UUID

### ZeroDB Integration

See `.claude/developer_guide.md` for complete ZeroDB API reference.

**Critical Requirements:**
- Model: `BAAI/bge-small-en-v1.5`
- Vector dimensions: 384
- Endpoint prefix: `/database/` for vector operations

## Available Slash Commands

### ZeroDB Operations
- `/zerodb-vector-*` - Vector embeddings and semantic search
- `/zerodb-table-*` - NoSQL table operations
- `/zerodb-file-*` - File storage operations
- `/zerodb-memory-*` - Agent memory operations
- `/zerodb-postgres-*` - PostgreSQL database operations

### Google Analytics
- `/ga-*` - GA4 data queries and reporting

### Project Management
- `/init-new-project` - Initialize new projects
- `/reinit-project` - Update existing project configuration

## Issue Tracking (MANDATORY)

**Before ANY code changes:**
1. Create GitHub issue first (or find existing)
2. Use issue template with acceptance criteria
3. Reference issue in branch name: `feature/123-description`
4. Reference issue in all commits: `Refs #123`
5. Link PR to issue: `Closes #123`

See `.claude/rules/ISSUE_TRACKING_ENFORCEMENT.md` for full requirements.

**Backlog:** https://github.com/quaid/nvc-ragbot/issues

## Git Workflow

- All commits require human approval
- No AI attribution in commit messages
- Follow conventional commit format when appropriate
- See `.claude/skills/git-workflow/` for detailed guidelines

## Upstream Repository

This project is forked from [AINative-Studio/ragbot-starter](https://github.com/AINative-Studio/ragbot-starter).

To sync with upstream:
```bash
git fetch upstream
git merge upstream/main
```

## Custom NVC Focus

This chatbot will be customized for:
- NVC (Nonviolent Communication) training content
- Empathy exercises and practice scenarios
- Feelings and needs vocabulary
- Conflict resolution guidance
