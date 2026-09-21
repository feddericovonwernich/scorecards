/**
 * Tabs Component
 * Tab navigation with support for conditional tabs and scroll arrows
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  showScrollArrows?: boolean;
}

/**
 * Tabs component with optional scroll arrows
 */
export function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  className = '',
  showScrollArrows = false,
}: TabsProps) {
  const visibleTabs = tabs.filter((tab) => !tab.hidden);
  const tabSignature = visibleTabs.map((tab) => `${tab.id}:${tab.label}`).join('|');

  const initialTab = defaultTab || visibleTabs[0]?.id || '';
  const [internalActiveTab, setInternalActiveTab] = useState(initialTab);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Use controlled or uncontrolled active tab
  const activeTab = controlledActiveTab ?? internalActiveTab;

  // Handle tab change
  const handleTabClick = (tabId: string) => {
    if (!controlledActiveTab) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  // Check scroll position for arrows
  const checkScrollArrows = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container || !showScrollArrows) {return;}

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
  }, [showScrollArrows]);

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsContainerRef.current;
    if (!container) {return;}

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Recalculate when tab content or the scroll container's width changes.
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) {return;}

    const resizeObserver = new ResizeObserver(checkScrollArrows);
    resizeObserver.observe(container);
    checkScrollArrows();

    return () => resizeObserver.disconnect();
  }, [tabSignature, checkScrollArrows]);

  // Find active tab content
  const activeTabContent = visibleTabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={`tabs-container ${className}`}>
      <div className="tabs-wrapper">
        {showScrollArrows && showLeftArrow && (
          <button
            type="button"
            className="tab-scroll-arrow tab-scroll-left"
            onClick={() => scrollTabs('left')}
            aria-label="Scroll tabs left"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z" />
            </svg>
          </button>
        )}

        <div
          ref={tabsContainerRef}
          className="tabs"
          onScroll={checkScrollArrows}
        >
          {visibleTabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              disabled={tab.disabled}
              data-tab={tab.id}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {showScrollArrows && showRightArrow && (
          <button
            type="button"
            className="tab-scroll-arrow tab-scroll-right"
            onClick={() => scrollTabs('right')}
            aria-label="Scroll tabs right"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        )}
      </div>

      <div className="tab-content active">
        {activeTabContent}
      </div>
    </div>
  );
}

export default Tabs;
