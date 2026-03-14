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

## Workflow Guidelines

**Commit often** - Make frequent, small commits with descriptive messages rather than large batches of changes. This helps track progress and makes it easier to revert specific changes if needed.

**Do not co-author commits** - Do not add co-author trailers (e.g., `Co-Authored-By: Claude...`) to commit messages.
