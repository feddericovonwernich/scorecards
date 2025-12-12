/**
 * useButtonState Hook
 * Manages button state for async operations (idle, loading, success, error)
 * with automatic reset after success/error states
 */

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

/**
 * Hook for managing button states during async operations
 * @param options Configuration options
 * @param options.autoResetDelay Time in ms before auto-reset (default: 3000)
 * @returns Button state and control functions
 */
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

  const setSuccess = useCallback(
    (autoReset = true) => {
      clearPendingTimeout();
      setState('success');
      if (autoReset) {
        timeoutRef.current = setTimeout(reset, autoResetDelay);
      }
    },
    [autoResetDelay, reset]
  );

  const setError = useCallback(
    (autoReset = true) => {
      clearPendingTimeout();
      setState('error');
      if (autoReset) {
        timeoutRef.current = setTimeout(reset, autoResetDelay);
      }
    },
    [autoResetDelay, reset]
  );

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
