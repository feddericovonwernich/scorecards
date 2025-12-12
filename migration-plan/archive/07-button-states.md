# Phase 7: Button States Migration

## Objective

Migrate the button state management (loading, success, error states) from vanilla DOM manipulation to React component state.

## Current State Analysis

### File: `docs/src/api/workflow-triggers.ts`

Contains inline button state utilities (lines 16-78):

```typescript
const CHECKMARK_ICON = '<svg...>';
const X_ICON = '<svg...>';
const SPINNING_REFRESH_ICON = '<svg class="spinning"...>';

function setButtonLoading(button: HTMLButtonElement, title = 'Triggering...'): void {
  button.disabled = true;
  button.dataset.originalHtml = button.innerHTML;
  button.dataset.originalTitle = button.title;
  button.dataset.originalBg = button.style.backgroundColor;
  button.innerHTML = SPINNING_REFRESH_ICON;
  button.title = title;
}

async function setButtonSuccess(button: HTMLButtonElement, title = '✓ Triggered'): Promise<void> {
  button.innerHTML = CHECKMARK_ICON;
  button.title = title;
  button.style.backgroundColor = '#10b981';
  button.classList.add('success');
  await new Promise(resolve => setTimeout(resolve, 3000));
  resetButton(button);
}

async function setButtonError(button: HTMLButtonElement, title = '✗ Failed'): Promise<void> {
  button.innerHTML = X_ICON;
  button.title = title;
  button.style.backgroundColor = '#ef4444';
  button.classList.add('error');
  await new Promise(resolve => setTimeout(resolve, 3000));
  resetButton(button);
}

function resetButton(button: HTMLButtonElement): void {
  button.disabled = false;
  button.classList.remove('success', 'error');
  button.innerHTML = button.dataset.originalHtml || '';
  // ... restore original state
}
```

### Usage Patterns

These functions are used in:
1. `triggerServiceWorkflow()` - Single service trigger
2. `installService()` - Create installation PR
3. `triggerBulkWorkflows()` - Bulk workflow trigger

## Migration Steps

### Step 1: Create Button State Types

```typescript
// docs/src/types/button.ts

export type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export interface ButtonStateConfig {
  state: ButtonState;
  title?: string;
  autoResetMs?: number;
}
```

### Step 2: Create useButtonState Hook

```typescript
// docs/src/hooks/useButtonState.ts

import { useState, useCallback, useRef, useEffect } from 'react';

export type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface UseButtonStateOptions {
  autoResetDelay?: number;
}

interface UseButtonStateReturn {
  state: ButtonState;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  setLoading: () => void;
  setSuccess: (autoReset?: boolean) => void;
  setError: (autoReset?: boolean) => void;
  reset: () => void;
}

export function useButtonState(
  options: UseButtonStateOptions = {}
): UseButtonStateReturn {
  const { autoResetDelay = 3000 } = options;
  const [state, setState] = useState<ButtonState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  };

  const reset = useCallback(() => {
    clearPendingTimeout();
    setState('idle');
  }, []);

  const setLoading = useCallback(() => {
    clearPendingTimeout();
    setState('loading');
  }, []);

  const setSuccess = useCallback((autoReset = true) => {
    clearPendingTimeout();
    setState('success');
    if (autoReset) {
      timeoutRef.current = setTimeout(reset, autoResetDelay);
    }
  }, [autoResetDelay, reset]);

  const setError = useCallback((autoReset = true) => {
    clearPendingTimeout();
    setState('error');
    if (autoReset) {
      timeoutRef.current = setTimeout(reset, autoResetDelay);
    }
  }, [autoResetDelay, reset]);

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    setLoading,
    setSuccess,
    setError,
    reset,
  };
}
```

### Step 3: Create ActionButton Component

```typescript
// docs/src/components/ui/ActionButton/ActionButton.tsx

import { type ReactNode, type MouseEvent } from 'react';
import { type ButtonState } from '../../../hooks/useButtonState';
import styles from './ActionButton.module.css';

interface ActionButtonProps {
  children: ReactNode;
  state?: ButtonState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  variant?: 'default' | 'bulk' | 'neutral' | 'accent';
}

export function ActionButton({
  children,
  state = 'idle',
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Failed',
  onClick,
  disabled,
  className = '',
  title,
  variant = 'default',
}: ActionButtonProps) {
  const isDisabled = disabled || state === 'loading';

  const getContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <SpinningIcon />
            {loadingText}
          </>
        );
      case 'success':
        return (
          <>
            <CheckmarkIcon />
            {successText}
          </>
        );
      case 'error':
        return (
          <>
            <ErrorIcon />
            {errorText}
          </>
        );
      default:
        return children;
    }
  };

  const getTitle = () => {
    switch (state) {
      case 'loading':
        return loadingText;
      case 'success':
        return '✓ ' + successText;
      case 'error':
        return '✗ ' + errorText;
      default:
        return title;
    }
  };

  const variantClass = variant !== 'default' ? `trigger-btn-${variant}` : '';

  return (
    <button
      className={`trigger-btn ${variantClass} ${styles.actionButton} ${styles[state]} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      title={getTitle()}
      data-state={state}
    >
      {getContent()}
    </button>
  );
}

function SpinningIcon() {
  return (
    <svg
      className={styles.spinning}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
  );
}

function CheckmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}
```

### Step 4: Add CSS for Button States

```css
/* docs/src/components/ui/ActionButton/ActionButton.module.css */

.actionButton {
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.actionButton:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.loading {
  /* Loading state styles */
}

.success {
  background-color: #10b981 !important;
  border-color: #10b981 !important;
}

.error {
  background-color: #ef4444 !important;
  border-color: #ef4444 !important;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

### Step 5: Refactor Workflow Trigger Functions

Update `docs/src/api/workflow-triggers.ts` to return promises without DOM manipulation:

```typescript
// docs/src/api/workflow-triggers.ts

// REMOVE all button state utilities (lines 16-78)
// Keep only the API functions

/**
 * Trigger scorecard workflow for a single service
 * @returns true on success, false on failure
 */
export async function triggerServiceWorkflow(
  org: string,
  repo: string
): Promise<boolean> {
  const token = getToken();

  if (!token) {
    showToastGlobal('Please configure a GitHub PAT in Settings', 'warning');
    return false;
  }

  try {
    const { owner, name } = getRepoInfo();
    const response = await fetch(
      getWorkflowDispatchUrl(owner, name, WORKFLOWS.files.triggerService),
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': DEPLOYMENT.api.version,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main', inputs: { org, repo } }),
      }
    );

    if (response.status === 204) {
      showToastGlobal(`Workflow triggered for ${org}/${repo}`, 'success');
      return true;
    } else if (response.status === 401) {
      clearToken();
      showToastGlobal('Invalid GitHub token', 'error');
      return false;
    } else {
      const errorData = await response.json().catch(() => ({}));
      showToastGlobal(`Failed: ${errorData.message || response.statusText}`, 'error');
      return false;
    }
  } catch (error) {
    showToastGlobal(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

// Similar refactoring for installService() and triggerBulkWorkflows()
```

### Step 6: Update Components Using Trigger Functions

Update `docs/src/components/features/ServicesControls/ServicesControls.tsx`:

```typescript
import { useButtonState } from '../../../hooks/useButtonState';
import { ActionButton } from '../../ui/ActionButton';
import { triggerBulkWorkflows } from '../../../api/workflow-triggers';

export function ServicesControls() {
  const bulkStaleButton = useButtonState();
  const bulkAllButton = useButtonState();

  const handleBulkTriggerStale = async () => {
    const staleServices = services.filter(s => isServiceStale(s, checksHash) && s.installed);

    if (staleServices.length === 0) {
      showToast('No stale services', 'info');
      return;
    }

    if (!confirm(`Trigger ${staleServices.length} stale services?`)) {
      return;
    }

    bulkStaleButton.setLoading();
    const success = await triggerBulkWorkflows(staleServices);

    if (success) {
      bulkStaleButton.setSuccess();
    } else {
      bulkStaleButton.setError();
    }
  };

  return (
    <section className="controls">
      {/* ... other controls ... */}

      <ActionButton
        state={bulkStaleButton.state}
        onClick={handleBulkTriggerStale}
        loadingText="Triggering..."
        successText="Triggered!"
        errorText="Failed"
        variant="bulk"
      >
        <RefreshIcon />
        Re-run All Stale
      </ActionButton>

      <ActionButton
        state={bulkAllButton.state}
        onClick={handleBulkTriggerAll}
        loadingText="Triggering..."
        successText="Triggered!"
        errorText="Failed"
        variant="neutral"
      >
        <RefreshIcon />
        Re-run All Installed
      </ActionButton>
    </section>
  );
}
```

### Step 7: Update ServiceModal Trigger Button

The ServiceModal has a trigger button that needs the same treatment:

```typescript
// docs/src/components/features/ServiceModal/tabs/WorkflowsTab.tsx

import { useButtonState } from '../../../../hooks/useButtonState';
import { ActionButton } from '../../../ui/ActionButton';

export function WorkflowsTab({ org, repo }: { org: string; repo: string }) {
  const triggerButton = useButtonState();

  const handleTrigger = async () => {
    triggerButton.setLoading();
    const success = await triggerServiceWorkflow(org, repo);
    if (success) {
      triggerButton.setSuccess();
    } else {
      triggerButton.setError();
    }
  };

  return (
    <div className="workflows-tab">
      <ActionButton
        state={triggerButton.state}
        onClick={handleTrigger}
        loadingText="Triggering..."
        successText="Triggered!"
        errorText="Failed"
      >
        Trigger Workflow
      </ActionButton>
      {/* ... workflow runs list ... */}
    </div>
  );
}
```

## Verification Checklist

- [ ] Bulk Stale button shows loading spinner while triggering
- [ ] Bulk Stale button shows green checkmark on success for 3s
- [ ] Bulk Stale button shows red X on error for 3s
- [ ] Bulk All button has same behavior
- [ ] Service modal trigger button works correctly
- [ ] Install button works correctly
- [ ] Buttons are disabled during loading state
- [ ] Buttons auto-reset after success/error
- [ ] No DOM manipulation remains for button states

## Files Modified

| File | Action |
|------|--------|
| `docs/src/hooks/useButtonState.ts` | Create (new) |
| `docs/src/components/ui/ActionButton/ActionButton.tsx` | Create (new) |
| `docs/src/components/ui/ActionButton/ActionButton.module.css` | Create (new) |
| `docs/src/components/ui/ActionButton/index.ts` | Create (new) |
| `docs/src/api/workflow-triggers.ts` | Remove button DOM manipulation |
| `docs/src/components/features/ServicesControls/ServicesControls.tsx` | Use ActionButton |
| `docs/src/components/features/ServiceModal/tabs/WorkflowsTab.tsx` | Use ActionButton |

## Rollback Instructions

If issues arise:
1. `git checkout HEAD -- docs/src/api/workflow-triggers.ts`
2. Restore original button handling in components
3. Delete new hook and component files

## Notes for Executing Model

- **Requires Phase 2** (global state) to be complete
- **Requires Phase 5** (controls) to be complete
- The hook handles auto-reset timing - don't need manual setTimeout
- Button state is local to each button - use separate `useButtonState()` calls
- Keep toast notifications - they're separate from button state
- Test error scenarios (invalid token, network failure)
- Ensure spinning animation CSS is included
