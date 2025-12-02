/**
 * Service modal links tab component
 * @module ui/modals/service/links-tab
 */

import { escapeHtml } from '../../../utils/formatting.js';
import type { ServiceLink } from '../../../types/index.js';

/**
 * Renders links tab content
 */
export function renderLinksTab(links?: ServiceLink[]): string {
  if (!links || links.length === 0) {
    return '';
  }

  return `
        <div class="tab-content" id="links-tab">
            <ul class="link-list">
                ${links
    .map(
      (link) => `
                    <li class="link-item">
                        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="flex-shrink: 0; margin-right: 8px;">
                                <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path>
                            </svg>
                            <div class="link-content">
                                <strong class="link-name">${escapeHtml(link.name)}</strong>
                                ${link.description ? `<p class="link-description">${escapeHtml(link.description)}</p>` : ''}
                            </div>
                        </a>
                    </li>
                `
    )
    .join('')}
            </ul>
        </div>
    `;
}
