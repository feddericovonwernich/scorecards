/**
 * HelloReact - Proof of concept React component
 *
 * This component verifies React is properly integrated into the build.
 * It can be removed once we have real React components.
 */

import { useState, useEffect } from 'react';

interface HelloReactProps {
  name?: string;
}

export function HelloReact({ name = 'React' }: HelloReactProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        padding: '12px 20px',
        backgroundColor: 'var(--color-success, #22c55e)',
        color: 'white',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span role="img" aria-label="check">✓</span>
      {name} is working!
      <button
        onClick={() => setIsVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '0 4px',
          fontSize: '16px',
          opacity: 0.8,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
