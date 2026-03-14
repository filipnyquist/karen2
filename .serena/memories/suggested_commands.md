# Suggested Commands

## Development Entrypoints

### Backend (port 3000)
```bash
cd packages/backend && bun run dev
```
Runs Elysia server with hot reload via `--hot` flag.

### Frontend (port 5173)
```bash
cd packages/frontend && bun run dev
```
Runs Vite dev server.

### Both from Root
```bash
# Backend
bun run --filter backend dev

# Frontend
bun run --filter frontend dev
```

## Build Commands

### Frontend Build
```bash
cd packages/frontend && bun run build
```
Runs TypeScript compiler (`tsc`) followed by Vite build.

### Frontend Preview
```bash
cd packages/frontend && bun run preview
```
Preview the production build locally.

## Dependency Management

### Install Dependencies
```bash
bun install
```
Installs all dependencies for root and workspaces.

## System Commands (Linux)

### File Operations
```bash
ls -la              # List files
cd <dir>            # Change directory
find . -name "*.ts" # Find files by name
grep -r "pattern"   # Search in files
```

### Git Operations
```bash
git status          # Check status
git add <file>      # Stage file
git commit -m "msg" # Commit
git push            # Push to remote
```

## Project-Specific Notes
- Backend runs on port 3000
- Frontend runs on port 5173 (Vite default)
- CORS is configured to allow frontend origin
