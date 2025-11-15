# Hybrid Authentication Plan - PR Status Update Optimization

## Problem Statement

The GitHub API approach hits rate limits (60 requests/hour unauthenticated) with multiple services:
- Error: 403 Forbidden when loading catalog
- Breaks for users who load the page more than ~6 times/hour
- With 8 services = 9 API calls per page load

## Solution: Hybrid Approach

Use `raw.githubusercontent.com` by default (no rate limits) with **optional GitHub PAT** for users who want faster updates.

---

## Implementation Plan

### Phase 1: Revert to raw.githubusercontent.com (Immediate Fix)

**Objective:** Restore catalog functionality

**Changes:**
1. **docs/app.js** - Line 161-173:
   ```javascript
   // Revert to raw.githubusercontent.com
   const fetchPromises = registryFiles.map(async (path) => {
       const fileUrl = `${RAW_BASE_URL}/${path}?t=${Date.now()}`;
       const res = await fetch(fileUrl, { cache: 'no-cache' });
       if (res.ok) {
           return res.json();
       }
       return null;
   });
   ```

2. **docs/app.js** - Line 375-388:
   ```javascript
   // Revert detail modal fetching
   const resultsUrl = `${RAW_BASE_URL}/results/${org}/${repo}/results.json?t=${Date.now()}`;
   const registryUrl = `${RAW_BASE_URL}/registry/${org}/${repo}.json?t=${Date.now()}`;

   const [resultsRes, registryRes] = await Promise.all([
       fetch(resultsUrl, { cache: 'no-cache' }),
       fetch(registryUrl, { cache: 'no-cache' })
   ]);
   ```

**Result:** Catalog works again with 0-5 min CDN cache delay

---

### Phase 2: Add Optional GitHub PAT Support

**Objective:** Allow users to optionally provide PAT for faster updates (bypasses CDN)

#### 2.1 Add PAT Configuration UI

**File:** `docs/index.html`

Add settings button/icon in header (next to Refresh Data):
```html
<button id="settings-btn" class="settings-btn" onclick="openSettings()" title="Settings">
    <svg>...</svg> Settings
</button>
```

Create settings modal:
```html
<div id="settings-modal" class="modal hidden">
    <div class="modal-content">
        <button class="modal-close" onclick="closeSettings()">&times;</button>
        <h2>Settings</h2>

        <div class="setting-section">
            <h3>GitHub Personal Access Token (Optional)</h3>
            <p>Provide a GitHub PAT to bypass CDN caching and get faster PR status updates.</p>

            <label>
                <input type="checkbox" id="use-api-checkbox" onchange="toggleApiMode()">
                Use GitHub API (requires PAT)
            </label>

            <div id="pat-input-section" style="display: none;">
                <input
                    type="password"
                    id="github-pat-input"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value="">
                <button onclick="savePAT()">Save PAT</button>
                <button onclick="clearPAT()">Clear</button>

                <div class="help-text">
                    <strong>How to create a PAT:</strong>
                    <ol>
                        <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                        <li>Generate new token (classic)</li>
                        <li>No scopes needed (public read-only)</li>
                        <li>Copy and paste here</li>
                    </ol>

                    <strong>Benefits:</strong>
                    - Faster PR status updates (~30s vs 3-5 min)
                    - Bypasses CDN cache
                    - 5,000 requests/hour limit
                </div>
            </div>

            <div id="current-mode">
                Current mode: <strong id="mode-indicator">CDN (default)</strong>
            </div>
        </div>

        <div class="setting-section">
            <h3>Rate Limit Status</h3>
            <div id="rate-limit-info">
                <div>Remaining: <span id="rate-limit-remaining">-</span></div>
                <div>Resets at: <span id="rate-limit-reset">-</span></div>
            </div>
            <button onclick="checkRateLimit()">Check Rate Limit</button>
        </div>
    </div>
</div>
```

#### 2.2 Add JavaScript Functions

**File:** `docs/app.js`

Add configuration state:
```javascript
// API Mode Configuration
let apiMode = 'cdn'; // 'cdn' or 'api'
let githubPAT = null;

// Load saved preferences on init
function loadPreferences() {
    const savedMode = localStorage.getItem('api_mode');
    const savedPAT = localStorage.getItem('github_pat');

    if (savedMode === 'api' && savedPAT) {
        apiMode = 'api';
        githubPAT = savedPAT;
        updateModeIndicator();
    }
}

function toggleApiMode() {
    const checkbox = document.getElementById('use-api-checkbox');
    const patSection = document.getElementById('pat-input-section');

    if (checkbox.checked) {
        patSection.style.display = 'block';
    } else {
        patSection.style.display = 'none';
        apiMode = 'cdn';
        githubPAT = null;
        localStorage.setItem('api_mode', 'cdn');
        localStorage.removeItem('github_pat');
        updateModeIndicator();
    }
}

function savePAT() {
    const input = document.getElementById('github-pat-input');
    const pat = input.value.trim();

    if (!pat) {
        showToast('Please enter a valid PAT', 'error');
        return;
    }

    // Test the PAT
    testPAT(pat).then(valid => {
        if (valid) {
            githubPAT = pat;
            apiMode = 'api';
            localStorage.setItem('github_pat', pat);
            localStorage.setItem('api_mode', 'api');
            updateModeIndicator();
            showToast('PAT saved successfully! Using GitHub API mode.', 'success');
            closeSettings();
        } else {
            showToast('Invalid PAT. Please check and try again.', 'error');
        }
    });
}

async function testPAT(pat) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${pat}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

function clearPAT() {
    githubPAT = null;
    apiMode = 'cdn';
    localStorage.removeItem('github_pat');
    localStorage.setItem('api_mode', 'cdn');
    document.getElementById('github-pat-input').value = '';
    document.getElementById('use-api-checkbox').checked = false;
    document.getElementById('pat-input-section').style.display = 'none';
    updateModeIndicator();
    showToast('PAT cleared. Using CDN mode.', 'info');
}

function updateModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    if (apiMode === 'api' && githubPAT) {
        indicator.textContent = 'GitHub API (fast, authenticated)';
        indicator.style.color = '#4caf50';
    } else {
        indicator.textContent = 'CDN (default, may be cached)';
        indicator.style.color = '#999';
    }
}

async function checkRateLimit() {
    try {
        const headers = apiMode === 'api' && githubPAT
            ? { 'Authorization': `token ${githubPAT}` }
            : {};

        const response = await fetch('https://api.github.com/rate_limit', { headers });
        const data = await response.json();

        document.getElementById('rate-limit-remaining').textContent =
            data.rate.remaining + ' / ' + data.rate.limit;
        document.getElementById('rate-limit-reset').textContent =
            new Date(data.rate.reset * 1000).toLocaleTimeString();

        if (data.rate.remaining < 10) {
            showToast('Warning: Low rate limit remaining!', 'warning');
        }
    } catch (error) {
        showToast('Failed to check rate limit', 'error');
    }
}

function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');

    // Update UI to reflect current state
    if (apiMode === 'api' && githubPAT) {
        document.getElementById('use-api-checkbox').checked = true;
        document.getElementById('pat-input-section').style.display = 'block';
        document.getElementById('github-pat-input').value = githubPAT;
    }

    updateModeIndicator();
    checkRateLimit();
}

function closeSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}
```

#### 2.3 Update Fetch Functions

**File:** `docs/app.js`

Modify `loadServices()` to use hybrid approach:
```javascript
async function loadServices() {
    try {
        // Use GitHub API to get all registry files
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch repository tree: ${response.status}`);
        }

        const treeData = await response.json();
        const registryFiles = treeData.tree
            .filter(item => item.path.startsWith('registry/') && item.path.endsWith('.json'))
            .map(item => item.path);

        if (registryFiles.length === 0) {
            throw new Error('No services registered yet');
        }

        // Fetch files based on mode
        const fetchPromises = registryFiles.map(async (path) => {
            if (apiMode === 'api' && githubPAT) {
                // Use GitHub API with PAT (fast, no CDN cache)
                const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
                const res = await fetch(apiUrl, {
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/vnd.github.raw',
                        'Authorization': `token ${githubPAT}`
                    }
                });
                if (res.ok) {
                    return res.json();
                }
                return null;
            } else {
                // Use raw.githubusercontent.com (slower, CDN cached, but no rate limits)
                const fileUrl = `${RAW_BASE_URL}/${path}?t=${Date.now()}`;
                const res = await fetch(fileUrl, { cache: 'no-cache' });
                if (res.ok) {
                    return res.json();
                }
                return null;
            }
        });

        const results = await Promise.all(fetchPromises);
        allServices = results.filter(service => service !== null);
        filteredServices = [...allServices];

        await fetchCurrentChecksHash();
        updateStats();
        filterAndRenderServices();

        // Show mode indicator in UI
        if (apiMode === 'api') {
            showToast('Loaded via GitHub API (fast mode)', 'success');
        }

    } catch (error) {
        console.error('Error loading services:', error);

        // Handle rate limit errors
        if (error.message.includes('403') && apiMode === 'api') {
            showToast('GitHub API rate limit exceeded. Falling back to CDN mode.', 'warning');
            apiMode = 'cdn';
            // Retry with CDN
            setTimeout(() => loadServices(), 1000);
            return;
        }

        document.getElementById('services-grid').innerHTML = `
            <div class="empty-state">
                <h3>No Services Found</h3>
                <p>No services have run scorecards yet, or the registry is not available.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #999;">
                    Error: ${error.message}
                </p>
            </div>
        `;
    }
}
```

Apply same pattern to `showServiceDetail()`.

#### 2.4 Update Initialization

**File:** `docs/app.js`

```javascript
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences(); // Load saved API mode and PAT
    loadServices();
    setupEventListeners();
});
```

---

### Phase 3: Add UI Indicators

**Show current mode in header:**
```html
<div class="api-mode-badge">
    <span id="api-mode-indicator">CDN Mode</span>
</div>
```

**Update on mode change:**
- CDN mode: Gray badge "CDN Mode (may be cached)"
- API mode: Green badge "API Mode (fast)"

**Add to refresh button:**
- When in API mode: "Refresh Data (API)"
- When in CDN mode: "Refresh Data (CDN - may be cached)"

---

### Phase 4: Styling

**File:** `docs/styles.css`

```css
/* Settings Button */
.settings-btn {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.settings-btn:hover {
    background: #e0e0e0;
}

/* Settings Modal */
.setting-section {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
}

.setting-section:last-child {
    border-bottom: none;
}

.setting-section h3 {
    margin-bottom: 10px;
    color: #2c3e50;
}

.setting-section p {
    color: #7f8c8d;
    margin-bottom: 15px;
}

#pat-input-section {
    margin-top: 15px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

#github-pat-input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-family: monospace;
}

.help-text {
    margin-top: 15px;
    font-size: 0.9rem;
    color: #666;
}

.help-text ol {
    margin-left: 20px;
    margin-top: 8px;
}

.help-text strong {
    display: block;
    margin-top: 10px;
    color: #2c3e50;
}

#current-mode {
    margin-top: 15px;
    padding: 10px;
    background: #e3f2fd;
    border-radius: 6px;
}

#rate-limit-info {
    margin: 15px 0;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
}

#rate-limit-info div {
    margin-bottom: 8px;
}

/* API Mode Badge */
.api-mode-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

.api-mode-badge.api {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1px solid #4caf50;
}

.api-mode-badge.cdn {
    background: rgba(158, 158, 158, 0.2);
    color: #999;
    border: 1px solid #999;
}
```

---

## User Experience Flow

### Default User (No PAT)
1. Opens catalog → loads via CDN
2. Sees "CDN Mode" indicator
3. PR status updates in 3-5 minutes (CDN cache)
4. Can click "Refresh Data" to force reload
5. Works perfectly, just slower updates

### Advanced User (With PAT)
1. Opens catalog → sees "CDN Mode"
2. Clicks "Settings" button
3. Enables "Use GitHub API"
4. Enters read-only PAT (no scopes needed)
5. Clicks "Save PAT"
6. System tests PAT → shows "API Mode (fast)"
7. Subsequent loads use GitHub API
8. PR status updates in ~30-60 seconds
9. 5,000 requests/hour limit (plenty for personal use)

---

## Security Considerations

1. **PAT Storage:**
   - Stored in localStorage (client-side only)
   - Never sent to any server except GitHub
   - User can clear anytime

2. **PAT Permissions:**
   - NO SCOPES NEEDED for read-only public repo access
   - Just increases rate limit from 60 to 5,000/hour
   - Safe to use read-only PAT

3. **Fallback:**
   - If PAT is invalid → auto-fallback to CDN mode
   - If rate limit exceeded → auto-fallback to CDN mode
   - Graceful degradation

---

## Implementation Checklist

- [ ] Phase 1: Revert to raw.githubusercontent.com (immediate fix)
- [ ] Commit and push Phase 1
- [ ] Verify catalog works again
- [ ] Phase 2: Add settings UI to index.html
- [ ] Phase 2: Add JavaScript functions to app.js
- [ ] Phase 2: Update fetch logic for hybrid mode
- [ ] Phase 3: Add mode indicators
- [ ] Phase 4: Add styling
- [ ] Test both modes (CDN and API)
- [ ] Test PAT validation
- [ ] Test rate limit checking
- [ ] Test fallback behavior
- [ ] Update documentation

---

## Testing Plan

1. **Test CDN Mode (Default):**
   - Load catalog without PAT
   - Verify services load
   - Check "CDN Mode" indicator
   - Create installation PR
   - Wait 3-5 minutes
   - Click refresh
   - Verify PR appears

2. **Test API Mode (With PAT):**
   - Click Settings
   - Enable API mode
   - Enter valid PAT (no scopes)
   - Verify "API Mode" indicator
   - Load catalog
   - Create installation PR
   - Wait 30-60 seconds
   - Click refresh
   - Verify PR appears quickly

3. **Test Rate Limit:**
   - Load catalog 10 times rapidly
   - Check rate limit status
   - Verify remaining count decreases

4. **Test Fallback:**
   - Enter invalid PAT
   - Verify auto-fallback to CDN mode
   - Verify error message shown

---

## Files to Modify

1. **docs/app.js** (~200 lines added)
   - Add configuration state
   - Add PAT management functions
   - Update loadServices() for hybrid mode
   - Update showServiceDetail() for hybrid mode
   - Add settings modal handlers

2. **docs/index.html** (~100 lines added)
   - Add settings button
   - Add settings modal
   - Add API mode indicator badge

3. **docs/styles.css** (~150 lines added)
   - Settings button styles
   - Settings modal styles
   - API mode badge styles
   - Form input styles

---

## Estimated Effort

- Phase 1 (Revert): 15 minutes
- Phase 2 (Hybrid logic): 2-3 hours
- Phase 3 (UI indicators): 1 hour
- Phase 4 (Styling): 1 hour
- Testing: 1 hour

**Total: 5-6 hours**

---

## Future Optimization (Phase 5)

**Consolidated Registry File:**

Instead of N separate files, generate a single `registry/all-services.json`:
```json
{
  "services": [
    {...},
    {...}
  ],
  "generated_at": "2025-11-15T12:00:00Z",
  "count": 8
}
```

**Benefits:**
- Only 1 API call instead of N+1
- Can use GitHub API even without PAT (within 60/hour limit)
- Faster initial load
- Simpler caching

**Implementation:**
- Modify action/entrypoint.sh to generate consolidated file
- Update app.js to fetch single file
- Fallback to per-file fetching if consolidated file missing

---

## Notes

- This plan maintains backwards compatibility
- No breaking changes for existing users
- Opt-in enhancement for advanced users
- Graceful fallback ensures reliability
- Can be implemented incrementally
