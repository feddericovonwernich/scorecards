/**
 * React Component Entry Point
 *
 * This file initializes React and mounts React component islands
 * alongside the existing vanilla JavaScript application.
 *
 * Components are mounted to #react-root as "islands" that coexist
 * with the vanilla JS DOM manipulation.
 */

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { HelloReact } from './HelloReact.js';

/**
 * Initialize React root and mount components
 */
export function initReact(): void {
  const container = document.getElementById('react-root');

  if (!container) {
    console.warn('React root element not found');
    return;
  }

  const root = createRoot(container);

  root.render(
    <StrictMode>
      <HelloReact name="React" />
    </StrictMode>
  );
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReact);
  } else {
    initReact();
  }
}
