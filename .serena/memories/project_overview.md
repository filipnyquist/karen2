# Project Overview

## Purpose
Karen2 is the main event management platform for Blekinge studentkår. It is an all-in-one management platform for event management such as workers, guests, and more.

## Tech Stack
- **Runtime:** Bun (JavaScript/TypeScript runtime)
- **Monorepo:** Bun workspaces (`packages/*`)
- **Backend:** Elysia web framework with CORS support
- **Frontend:** React 19, Vite 5, TypeScript
- **Styling:** Tailwind CSS 3, DaisyUI 4
- **Type-Safe API:** Eden Treaty (`@elysiajs/eden`)

## Architecture

### Monorepo Structure
```
/
├── packages/
│   ├── backend/     # Elysia API server (port 3000)
│   └── frontend/    # React + Vite app (port 5173)
```

### Type-Safe API Pattern
The project uses Eden Treaty for end-to-end type-safe API communication:
1. Backend exports `App` type from `src/index.ts`
2. Frontend imports `App` type and creates Eden client in `src/eden.ts`
3. Frontend uses `eden.test.get()` pattern for API calls

No separate types package is needed - types are inferred directly from the Elysia app.

## System
- **OS:** Linux
- **Package Manager:** Bun
- **File Encoding:** UTF-8
