/**
 * Service modal badges tab component
 * @module ui/modals/service/badges-tab
 */

import { getRawBaseUrl } from '../../../api/registry.js';

/**
 * Renders badges tab content
 */
export function renderBadgesTab(org: string, repo: string): string {
  const rawBaseUrl = getRawBaseUrl();
  return `
        <div class="tab-content" id="badges-tab">
            <h4 class="tab-section-header">Badge Preview</h4>
            <div class="badge-preview-container">
                <img src="https://img.shields.io/endpoint?url=${rawBaseUrl}/badges/${org}/${repo}/score.json" alt="Score Badge" style="height: 20px;">
                <img src="https://img.shields.io/endpoint?url=${rawBaseUrl}/badges/${org}/${repo}/rank.json" alt="Rank Badge" style="height: 20px;">
            </div>

            <h4 class="tab-section-header" style="margin-bottom: 10px;">Add to Your README</h4>
            <p class="tab-section-description">
                Copy the markdown below:
            </p>

            <div style="position: relative; margin-bottom: 15px;">
                <button onclick="copyBadgeCode('score-badge-${org}-${repo}', event)" class="copy-button">Copy</button>
                <pre id="score-badge-${org}-${repo}" class="badge-code-block">![Score](https://img.shields.io/endpoint?url=${rawBaseUrl}/badges/${org}/${repo}/score.json)</pre>
            </div>

            <div style="position: relative;">
                <button onclick="copyBadgeCode('rank-badge-${org}-${repo}', event)" class="copy-button">Copy</button>
                <pre id="rank-badge-${org}-${repo}" class="badge-code-block">![Rank](https://img.shields.io/endpoint?url=${rawBaseUrl}/badges/${org}/${repo}/rank.json)</pre>
            </div>
        </div>
    `;
}
