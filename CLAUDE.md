# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Karen2 is an event management platform for Blekinge studentkår. It is a Bun monorepo with a React frontend and Elysia backend.

## Architecture

**Monorepo Structure:**
- Root uses Bun workspaces (`packages/*`)
- `packages/backend/` - Elysia (Bun web framework) API server
- `packages/frontend/` - React 19 + Vite + Tailwind CSS + DaisyUI

**Type-Safe API:**
The frontend uses Eden Treaty (`@elysiajs/eden`) for end-to-end type-safe API calls. The `App` type is exported from the backend and imported by the frontend's `eden.ts` to create a type-safe client. No separate types package is needed.

```typescript
// Frontend: packages/frontend/src/eden.ts
import { treaty } from "@elysiajs/eden";
import type { App } from "../../backend/src/index";
export const eden = treaty<App>("http://localhost:3000");
```

## Development Commands

**Install dependencies:**
```bash
bun install
```

**Run backend (port 3000):**
```bash
cd packages/backend && bun run dev
# or from root (if filter works)
bun run --filter backend dev
```

**Run frontend (port 5173):**
```bash
cd packages/frontend && bun run dev
```

**Build frontend:**
```bash
cd packages/frontend && bun run build
```

## Technology Stack

- **Runtime:** Bun
- **Backend:** Elysia (`elysia`), CORS (`@elysiajs/cors`)
- **Frontend:** React 19, Vite 5, TypeScript
- **Styling:** Tailwind CSS 3, DaisyUI 4
- **API Client:** Eden Treaty (`@elysiajs/eden`)

## Available MCPs/Plugins

Claude Code in this project has access to several MCP (Model Context Protocol) servers that provide additional capabilities:

### Context7 (`plugin:context7:context7`)
**Purpose**: Retrieve up-to-date documentation and code examples for any programming library.

**Tools**:
- `resolve-library-id` - Resolve package name to Context7-compatible library ID
- `query-docs` - Query documentation for code examples

**Use when**: Need documentation for libraries, frameworks, or APIs.

### Serena (`plugin:serena:serena`)
**Purpose**: Semantic coding tools for codebase navigation and editing.

**Key tools**:
- `read_file`, `create_text_file`, `replace_content` - File operations
- `find_symbol`, `find_referencing_symbols` - Symbol navigation
- `replace_symbol_body`, `insert_after_symbol` - Symbol editing
- `search_for_pattern` - Pattern search across codebase
- `write_memory`, `read_memory`, `list_memories` - Memory management
- `execute_shell_command` - Shell execution

**Use when**: Code editing, refactoring, understanding codebase structure.

### Playwright (`plugin:playwright:playwright`)
**Purpose**: Browser automation and testing.

**Key tools**:
- `browser_navigate`, `browser_click`, `browser_type` - Page interaction
- `browser_snapshot`, `browser_take_screenshot` - Page capture
- `browser_evaluate`, `browser_run_code` - Execute JS in browser
- `browser_fill_form`, `browser_select_option` - Form interaction
- `browser_console_messages`, `browser_network_requests` - Debugging

**Use when**: Testing UI, taking screenshots, browser automation.

### GitHub MCP (`mcp__github__*`)
**Purpose**: GitHub API operations.

**Key tools**:
- `issue_read`, `issue_write` - Issue management
- `pull_request_read`, `update_pull_request` - PR management
- `create_pull_request`, `merge_pull_request` - PR workflow
- `create_branch`, `push_files` - Git operations
- `search_code`, `search_issues`, `search_pull_requests` - Search

**Use when**: GitHub operations, PR management, issue tracking.

## Claude Skills

Claude Code has access to specialized skills for different tasks. **Always use appropriate skills** when working on this project:

| Task Type | Skill to Use |
|-----------|--------------|
| Building new features | `feature-dev` |
| Creating UI components | `frontend-design` |
| Planning implementation | `superpowers:brainstorming`, `superpowers:writing-plans` |
| Executing plans | `superpowers:executing-plans` |
| Debugging bugs | `superpowers:systematic-debugging` |
| Writing tests | `superpowers:test-driven-development` |
| Code review | `code-review:code-review`, `superpowers:requesting-code-review` |
| Creating commits/PRs | `commit-commands:commit`, `commit-commands:commit-push-pr` |
| Using worktrees | `superpowers:using-git-worktrees` |
| Updating CLAUDE.md | `claude-md-management:revise-claude-md` |

**Rule of thumb**: If a skill exists for the task at hand, use it. Skills provide structured workflows and best practices.

## Workflow Guidelines

**Commit often** - Make frequent, small commits with descriptive messages rather than large batches of changes. This helps track progress and makes it easier to revert specific changes if needed.

**Do not co-author commits** - Do not add co-author trailers (e.g., `Co-Authored-By: Claude...`) to commit messages.
