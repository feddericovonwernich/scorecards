/**
 * Generic tab management utility
 */

export interface TabConfig {
  containerId: string;
  tabButtonSelector?: string;
  tabContentSelector?: string;
  activeClass?: string;
  getTabContentId?: (tabName: string) => string;
  onActivate?: Record<string, () => void>;
}

export interface TabManager {
  switchTab: (tabName: string, event?: Event) => void;
  getActiveTab: () => string | null;
}

/**
 * Create a tab manager for a modal
 */
export function createTabManager(config: TabConfig): TabManager {
  const {
    containerId,
    tabButtonSelector = '.tab-btn',
    tabContentSelector = '.tab-content',
    activeClass = 'active',
    getTabContentId = (tabName: string) => `${tabName}-tab`,
    onActivate = {},
  } = config;

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container not found: ${containerId}`);
  }

  /**
   * Switch to a specific tab
   */
  function switchTab(tabName: string, event?: Event): void {
    // Remove active from all buttons
    container.querySelectorAll(tabButtonSelector).forEach((btn) => {
      btn.classList.remove(activeClass);
    });

    // Remove active from all content
    container.querySelectorAll(tabContentSelector).forEach((content) => {
      content.classList.remove(activeClass);
    });

    // Activate clicked button
    if (event?.target) {
      (event.target as HTMLElement).classList.add(activeClass);
    } else {
      const btn = container.querySelector(
        `${tabButtonSelector}[data-tab="${tabName}"]`
      );
      if (btn) {
        btn.classList.add(activeClass);
      }
    }

    // Activate content
    const content = document.getElementById(getTabContentId(tabName));
    if (content) {
      content.classList.add(activeClass);
    }

    // Call activation callback if exists
    if (onActivate[tabName]) {
      onActivate[tabName]();
    }
  }

  /**
   * Get currently active tab name
   */
  function getActiveTab(): string | null {
    const activeBtn = container.querySelector<HTMLElement>(
      `${tabButtonSelector}.${activeClass}`
    );
    return activeBtn?.dataset.tab || null;
  }

  return { switchTab, getActiveTab };
}
