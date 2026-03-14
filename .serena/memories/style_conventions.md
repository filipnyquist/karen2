# Style and Conventions

## TypeScript Configuration

### Root tsconfig.json
- **Target:** ESNext
- **Module:** ESNext
- **Module Resolution:** bundler
- **Strict:** enabled
- **Composite:** enabled (for project references)
- **Declaration:** enabled with declaration maps

### Package-Level Configs
- Backend extends root config with `outDir: "./dist"`
- Frontend extends root config with additional React-specific settings

## Code Style

### Backend (Elysia)
- ES modules (`"type": "module"` in package.json)
- Import style: `import { Elysia } from "elysia"`
- Endpoint handlers use arrow functions: `.get("/path", () => "response")`
- Type exports: `export type App = typeof app;`

### Frontend (React)
- ES modules
- Functional components with hooks
- Import React hooks explicitly: `import { useEffect, useState } from "react"`
- Type annotations on state: `useState<string>("default")`

### API Client Pattern (Eden)
```typescript
// Import type from backend source
import type { App } from "../../backend/src/index";
import { treaty } from "@elysiajs/eden";

// Create typed client
export const eden = treaty<App>("http://localhost:3000");

// Usage with error handling
const { data, error } = await eden.test.get();
```

### Styling (Tailwind + DaisyUI)
- Tailwind utility classes used directly
- DaisyUI component classes (e.g., `card`, `bg-base-200`, `text-primary`)

## Naming Conventions
- Files: camelCase or PascalCase for components (e.g., `App.tsx`)
- Variables: camelCase
- Types: PascalCase
- Exports: Named exports preferred over default
