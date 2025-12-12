# Phase 9: Theme Service Removal

## Objective

Remove the deprecated `theme.ts` vanilla service. The `useTheme` hook already provides full theme functionality for React components.

## Current State

- `docs/src/services/theme.ts` - Deprecated vanilla theme service (113 lines)
- `docs/src/hooks/useTheme.ts` - React hook replacement (already in use)
- Theme is exported to `window.ScorecardModules.theme`
- Theme functions are NOT exported as individual window globals

## Prerequisites

- Verify `useTheme` hook is working correctly
- Verify no code calls `window.ScorecardModules.theme` methods

## Implementation Steps

### Step 1: Verify No External Usage

Search for any usage of theme service outside React hook:

```bash
# Check for direct theme service usage
grep -r "ScorecardModules.theme" docs/src/
grep -r "theme\.initTheme\|theme\.toggleTheme\|theme\.getCurrentTheme" docs/src/
```

### Step 2: Remove from ScorecardModules

In `docs/src/main.ts`:

1. Remove import:
   ```typescript
   // REMOVE this line
   import * as theme from './services/theme.js';
   ```

2. Remove from ScorecardModules object:
   ```typescript
   const ScorecardModules = {
     // ...
     // REMOVE this line
     theme,
     // ...
   };
   ```

3. Remove from ES6 exports at bottom of file:
   ```typescript
   export {
     // ...
     // REMOVE this line
     theme,
     // ...
   };
   ```

### Step 3: Delete Theme Service File

```bash
rm docs/src/services/theme.ts
```

### Step 4: Update globals.d.ts

In `docs/src/types/globals.d.ts`, remove theme from ScorecardModules interface if present.

## Verification

1. Run build: `npm run build`
2. Run linting: `npm run lint`
3. Run tests: `npx playwright test`
4. Manual test: Toggle theme in browser, refresh page, verify persistence

## Estimated Changes

- **Files modified**: 2 (main.ts, globals.d.ts)
- **Files deleted**: 1 (theme.ts)
- **Lines removed**: ~115

## Rollback

If issues arise, restore theme.ts from git and add back the imports/exports.
