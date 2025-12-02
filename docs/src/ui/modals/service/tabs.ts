/**
 * Service modal tab navigation components
 * @module ui/modals/service/tabs
 */

import { getOpenAPIInfo } from './api-tab.js';
import type { ServiceResults } from '../../../types/index.js';

// Window types are defined in types/globals.d.ts

/**
 * Renders tab navigation
 */
export function renderTabs(data: ServiceResults): string {
  const leftArrowSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
  const rightArrowSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

  return `
        <div class="tabs-container">
            <button class="tabs-scroll-btn tabs-scroll-left" onclick="scrollTabs('left')" aria-label="Scroll tabs left">
                ${leftArrowSvg}
            </button>
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab(event, 'checks')">Check Results</button>
                ${getOpenAPIInfo(data).hasSpec ? '<button class="tab-btn" onclick="switchTab(event, \'api\')">API Specification</button>' : ''}
                ${data.service.links && data.service.links.length > 0 ? '<button class="tab-btn" onclick="switchTab(event, \'links\')">Links</button>' : ''}
                ${data.recent_contributors && data.recent_contributors.length > 0 ? '<button class="tab-btn" onclick="switchTab(event, \'contributors\')">Contributors</button>' : ''}
                <button class="tab-btn" onclick="switchTab(event, 'workflows')">Workflow Runs</button>
                <button class="tab-btn" onclick="switchTab(event, 'badges')">Badges</button>
            </div>
            <button class="tabs-scroll-btn tabs-scroll-right" onclick="scrollTabs('right')" aria-label="Scroll tabs right">
                ${rightArrowSvg}
            </button>
        </div>
    `;
}

/**
 * Switches between tabs in the service modal
 */
export function switchTab(event: Event, tabName: string): void {
  // Remove active class from all tab buttons and content
  document
    .querySelectorAll('.tab-btn')
    .forEach((btn) => btn.classList.remove('active'));
  document
    .querySelectorAll('.tab-content')
    .forEach((content) => content.classList.remove('active'));

  // Add active class to clicked button and corresponding content
  (event.target as HTMLElement).classList.add('active');
  document.getElementById(`${tabName}-tab`)?.classList.add('active');

  // Lazy load workflow runs when workflows tab is opened
  if (tabName === 'workflows' && !window.serviceWorkflowLoaded) {
    window.loadWorkflowRunsForService();
  }
}

/**
 * Scrolls the tabs container left or right
 */
export function scrollTabs(direction: 'left' | 'right'): void {
  const tabsContainer = document.querySelector('.tabs');
  if (!tabsContainer) {
    return;
  }

  const scrollAmount = 150;
  const newScrollLeft =
    direction === 'left'
      ? tabsContainer.scrollLeft - scrollAmount
      : tabsContainer.scrollLeft + scrollAmount;

  tabsContainer.scrollTo({
    left: newScrollLeft,
    behavior: 'smooth',
  });
}

/**
 * Updates the visibility of tab scroll arrows based on scroll position
 */
export function updateTabScrollArrows(): void {
  const tabsContainer = document.querySelector('.tabs');
  const leftBtn = document.querySelector('.tabs-scroll-left');
  const rightBtn = document.querySelector('.tabs-scroll-right');

  if (!tabsContainer || !leftBtn || !rightBtn) {
    return;
  }

  const scrollLeft = tabsContainer.scrollLeft;
  const maxScroll = tabsContainer.scrollWidth - tabsContainer.clientWidth;

  // Show left arrow if not at the beginning
  if (scrollLeft > 5) {
    leftBtn.classList.add('visible');
  } else {
    leftBtn.classList.remove('visible');
  }

  // Show right arrow if not at the end
  if (scrollLeft < maxScroll - 5) {
    rightBtn.classList.add('visible');
  } else {
    rightBtn.classList.remove('visible');
  }
}

/**
 * Initializes tab scroll arrows event listeners
 */
export function initTabScrollArrows(): void {
  const tabsContainer = document.querySelector('.tabs');
  if (!tabsContainer) {
    return;
  }

  // Update arrows on scroll
  tabsContainer.addEventListener('scroll', updateTabScrollArrows);

  // Initial check after a small delay to ensure layout is complete
  setTimeout(updateTabScrollArrows, 100);
}
