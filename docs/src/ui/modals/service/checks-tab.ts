/**
 * Service modal checks tab component
 * @module ui/modals/service/checks-tab
 */

import { escapeHtml } from '../../../utils/formatting.js';
import type { CheckResult, CheckStatus } from '../../../types/index.js';

/**
 * Groups checks by category (read from check metadata)
 */
export function groupChecksByCategory(
  checks: CheckResult[]
): Record<string, CheckResult[]> {
  const categories: Record<string, CheckResult[]> = {};

  checks.forEach((check) => {
    // Read category from check metadata, default to 'Other' if missing
    const category = check.category || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(check);
  });

  // Define category order for consistent display
  const categoryOrder = [
    'Scorecards Setup',
    'Documentation',
    'Testing & CI',
    'Configuration & Compliance',
    'Other',
  ];

  // Return categories in defined order (case-insensitive matching)
  const orderedCategories: Record<string, CheckResult[]> = {};
  categoryOrder.forEach((category) => {
    // Find matching category key (case-insensitive)
    const matchingKey = Object.keys(categories).find(
      (key) => key.toLowerCase() === category.toLowerCase()
    );
    if (matchingKey) {
      orderedCategories[category] = categories[matchingKey];
    }
  });

  return orderedCategories;
}

/**
 * Gets the status icon for a check
 */
function getStatusIcon(status: CheckStatus): string {
  switch (status) {
  case 'pass':
    return '\u2713';
  case 'excluded':
    return '\u2298';
  default:
    return '\u2717';
  }
}

/**
 * Renders a single check result
 */
function renderCheck(check: CheckResult): string {
  const isExcluded = check.status === 'excluded';

  return `
        <div class="check-result ${check.status}">
            <div class="check-name">
                ${getStatusIcon(check.status)} ${escapeHtml(check.name)}
            </div>
            <div class="check-description">${escapeHtml(check.description)}</div>
            ${
  isExcluded
    ? `
                <div class="check-excluded-notice">
                    <em>Excluded from scoring</em>
                </div>
            `
    : ''
}
            ${
  check.stdout && check.stdout.trim()
    ? `
                <div class="check-output">
                    <strong>Output:</strong><br>
                    ${escapeHtml(check.stdout.trim())}
                </div>
            `
    : ''
}
            ${
  check.stderr && check.stderr.trim() && check.status === 'fail'
    ? `
                <div class="check-output check-output-error">
                    <strong>Error:</strong><br>
                    ${escapeHtml(check.stderr.trim())}
                </div>
            `
    : ''
}
            <div class="check-meta">
                Weight: ${check.weight} | Duration: ${check.duration}s
            </div>
        </div>
    `;
}

/**
 * Renders checks tab content with collapsible category grouping
 */
export function renderChecksTab(checks: CheckResult[]): string {
  const categorizedChecks = groupChecksByCategory(checks);

  return `
        <div class="tab-content active" id="checks-tab">
            <div class="check-categories">
                ${Object.entries(categorizedChecks)
    .map(([category, categoryChecks]) => {
      const passCount = categoryChecks.filter(
        (c) => c.status === 'pass'
      ).length;
      const excludedCount = categoryChecks.filter(
        (c) => c.status === 'excluded'
      ).length;
      const activeCount = categoryChecks.length - excludedCount;
      const allPassed = passCount === activeCount && activeCount > 0;

      return `
                        <details class="check-category" open>
                            <summary class="check-category-header">
                                <span class="category-arrow">\u25BC</span>
                                <span class="category-name">${category}</span>
                                <span class="category-stats ${allPassed ? 'all-passed' : 'has-failures'}">
                                    ${passCount}/${activeCount} passed${excludedCount > 0 ? ` <span class="excluded-count">(${excludedCount} excluded)</span>` : ''}
                                </span>
                            </summary>
                            <div class="check-category-content">
                                ${categoryChecks.map((check) => renderCheck(check)).join('')}
                            </div>
                        </details>
                    `;
    })
    .join('')}
            </div>
        </div>
    `;
}
