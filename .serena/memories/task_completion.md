# Task Completion Checklist

## Before Marking Complete

### Code Quality
- [ ] TypeScript compiles without errors (`tsc`)
- [ ] Code follows project conventions (see style_conventions.md)

### Testing (when implemented)
- [ ] Run tests: `bun test` (when available)
- [ ] Test the feature manually in browser

### Verification Steps
1. **Backend changes:**
   - Restart backend server
   - Verify endpoints work (e.g., `curl http://localhost:3000/test`)

2. **Frontend changes:**
   - Verify dev server still runs
   - Check browser console for errors
   - Test UI interactions

3. **Full integration:**
   - Start both backend and frontend
   - Verify type-safe API communication works
   - Check CORS if backend/frontend origins changed

### Build Check (for production changes)
```bash
cd packages/frontend && bun run build
```
Ensure build completes without errors.

## Git Workflow

**Commit often** - Make frequent, small commits with descriptive messages rather than large batches of changes. This helps track progress and makes it easier to revert specific changes if needed.

**Do not co-author commits** - Do not add co-author trailers (e.g., `Co-Authored-By: Claude...`) to commit messages.

## After Completion
- Update or create documentation if needed
- Commit changes with descriptive message
