/**
 * ViewContainer Component
 * Manages visibility of view content based on current view state
 */

import { type ReactNode, useEffect, useRef } from 'react';
import { useAppStore, selectCurrentView } from '../../stores/appStore.js';
import type { ViewType } from './Navigation.js';

interface ViewContainerProps {
  viewId: ViewType;
  children: ReactNode;
}

/**
 * ViewContainer - Controls which view is visible
 * Manages DOM classes for backwards compatibility with CSS
 */
export function ViewContainer({ viewId, children }: ViewContainerProps) {
  const currentView = useAppStore(selectCurrentView);
  const isActive = currentView === viewId;
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync active class with DOM for backwards compatibility
  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    if (isActive) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      id={`${viewId}-view`}
      className={`view-content ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-labelledby={`${viewId}-tab`}
      hidden={!isActive}
    >
      {children}
    </div>
  );
}

export default ViewContainer;
