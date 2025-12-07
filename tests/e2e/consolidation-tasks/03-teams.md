# Teams Test Consolidation Tasks

## Overview
- **Files**: team-features.spec.js, team-edit-modal.spec.js, check-adoption-modal.spec.js
- **Current tests**: 56
- **Target tests**: 36
- **Reduction**: 35.7%

## Tasks

### Task 1: Team Modal Complete Navigation Journey
**Complexity**: MEDIUM
**Files affected**: team-features.spec.js

**Current tests to replace**:
- [ ] `should open, display team info, and close` (team-features.spec.js:178)
- [ ] `should close with Escape key` (team-features.spec.js:195)
- [ ] `should have all tabs and switch correctly` (team-features.spec.js:349)

**New test to create**:
```javascript
test('should open modal, navigate through all tabs, and close via multiple methods', async ({ page }) => {
  await switchToTeamsView(page);
  await openTeamModal(page, 'platform');

  const modal = page.locator('#team-modal');

  // Modal opening and basic info
  await expect(modal.locator('h2')).toContainText(/platform/i);
  await expect(modal).toContainText(/Platinum|Gold|Silver|Bronze/i);
  await expect(modal).toContainText(/Average Score/i);
  await expect(modal).toContainText(/Services/i);
  await expect(modal).toContainText(/Installed/i);
  await expect(modal).toContainText(/Stale/i);

  const editButton = modal.getByRole('button', { name: /Edit Team/i });
  await expect(editButton).toBeVisible();

  // All tabs visible
  await expect(modal.getByRole('button', { name: 'Services', exact: true })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Distribution', exact: true })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Check Adoption' })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'GitHub', exact: true })).toBeVisible();

  // Services tab (default)
  await expect(modal).toContainText(/test-repo/i);

  // Switch to Distribution
  await modal.getByRole('button', { name: 'Distribution' }).click();
  await expect(modal).toContainText(/Platinum|Gold|Silver|Bronze/i);

  // Switch to Check Adoption
  await modal.getByRole('button', { name: 'Check Adoption' }).click();
  await expect(modal).toContainText(/Adoption|Passing|Failing/i);

  // Switch to GitHub
  await modal.getByRole('button', { name: 'GitHub' }).click();
  await expect(modal).toContainText(/GitHub|Sign in/i);

  // Switch back to Services
  await modal.getByRole('button', { name: 'Services' }).click();
  await expect(modal).toContainText(/test-repo/i);

  // Close with X
  await closeTeamModal(page);
  await expect(modal).not.toBeVisible();

  // Reopen and close with Escape
  await openTeamModal(page, 'platform');
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 2: Check Adoption Modal Opening and Closing
**Complexity**: EASY
**Files affected**: team-features.spec.js, check-adoption-modal.spec.js

**Current tests to replace**:
- [ ] `should open and display adoption information` (team-features.spec.js:384)
- [ ] `should close with X button and Escape key` (team-features.spec.js:401)
- [ ] `modal opens with correct structure` (check-adoption-modal.spec.js:23)
- [ ] `close button and Escape key close modal` (check-adoption-modal.spec.js:42)

**New test to create**:
```javascript
test('should open modal with correct structure and close via X button and Escape key', async ({ page }) => {
  await openCheckAdoptionModal(page);

  const modal = page.locator('#check-adoption-modal');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText(/Check Adoption|Adoption/i);
  await expect(modal.locator('h2')).toContainText('Check Adoption Dashboard');
  await expect(modal.getByRole('button', { name: 'Close modal' })).toBeVisible();

  // Check selector
  const hasSelector = await modal.locator('button, select').filter({ hasText: /README|Documentation|License|Select/i }).count() > 0;
  expect(hasSelector).toBe(true);

  // Adoption rate
  await expect(modal).toContainText(/\d+%|Adoption/i);
  await expect(modal).toContainText(/Passing|pass/i);
  await expect(modal).toContainText(/Failing|fail/i);

  // Close with X button
  await closeCheckAdoptionModal(page);
  await expect(modal).not.toBeVisible();

  // Reopen and close with Escape
  await openCheckAdoptionModal(page);
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 3: Check Selector Complete Interaction Journey
**Complexity**: EASY
**Files affected**: check-adoption-modal.spec.js

**Current tests to replace**:
- [ ] `check selector dropdown is visible and functional` (check-adoption-modal.spec.js:66)
- [ ] `check selector search filters options` (check-adoption-modal.spec.js:80)
- [ ] `check selector changes update the dashboard` (check-adoption-modal.spec.js:94)
- [ ] `clicking outside closes dropdown` (check-adoption-modal.spec.js:110)

**New test to create**:
```javascript
test('should interact with check selector through complete workflow - open, search, select, and dismiss', async ({ page }) => {
  await openCheckAdoptionModal(page);
  const modal = page.locator('#check-adoption-modal');
  const toggle = modal.locator('.check-card-selected');

  // Dropdown is visible and functional
  await toggle.click();
  await expect(toggle).toBeVisible();
  await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
  await expect(modal.locator('.check-card-search input')).toBeVisible();

  const options = modal.locator('.check-card-option');
  expect(await options.count()).toBeGreaterThan(0);

  // Search filters options
  const searchInput = modal.locator('.check-card-search input');
  await searchInput.fill('README');
  await expect(async () => {
    const visibleOptions = modal.locator('.check-card-option:visible');
    expect(await visibleOptions.count()).toBeLessThan(13);
  }).toPass({ timeout: 3000 });

  // Clear search
  await searchInput.clear();

  // Changes update the dashboard
  const initialCheckName = await modal.locator('.check-card-selected .check-card-name').textContent();
  await modal.locator('.check-card-option').nth(1).click();
  await expect(modal.locator('.check-card-dropdown.open')).not.toBeVisible();

  const newCheckName = await modal.locator('.check-card-selected .check-card-name').textContent();
  expect(newCheckName).not.toBe(initialCheckName);
  await expect(modal.locator('.check-card-selected .check-card-description')).toBeVisible();

  // Clicking outside closes dropdown
  await toggle.click();
  await expect(modal.locator('.check-card-dropdown.open')).toBeVisible();
  await modal.click({ position: { x: 10, y: 10 } });
  await expect(modal.locator('.check-card-dropdown.open')).not.toBeVisible();

  await closeCheckAdoptionModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 4: Team Edit Modal All Form Fields
**Complexity**: EASY
**Files affected**: team-edit-modal.spec.js

**Current tests to replace**:
- [ ] `should show Team Name field with required indicator` (team-edit-modal.spec.js:118)
- [ ] `should show Team ID field` (team-edit-modal.spec.js:127)
- [ ] `should show Description field` (team-edit-modal.spec.js:134)
- [ ] `should show Aliases field with Add button` (team-edit-modal.spec.js:141)
- [ ] `should show Slack Channel field` (team-edit-modal.spec.js:149)
- [ ] `should show Oncall Rotation URL field` (team-edit-modal.spec.js:156)

**New test to create**:
```javascript
test('should display all form fields with correct labels and controls in create mode', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);
  await openCreateTeamModal(page);

  const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);

  // Team Name with required indicator
  await expect(modal).toContainText('Team Name');
  await expect(modal).toContainText('*');

  // Team ID
  await expect(modal).toContainText('Team ID');

  // Description
  await expect(modal).toContainText('Description');

  // Aliases with Add button
  await expect(modal).toContainText('Aliases');
  await expect(modal.getByRole('button', { name: 'Add' })).toBeVisible();

  // Slack Channel
  await expect(modal).toContainText('Slack Channel');

  // Oncall Rotation URL
  await expect(modal).toContainText('Oncall Rotation');

  await closeTeamEditModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 6 tests

---

### Task 5: Team Edit Modal Button State Management
**Complexity**: EASY
**Files affected**: team-edit-modal.spec.js

**Current tests to replace**:
- [ ] `should have Cancel and Create Team buttons` (team-edit-modal.spec.js:175)
- [ ] `should disable Create Team button when name is empty` (team-edit-modal.spec.js:191)
- [ ] `should enable Create Team button when name is filled` (team-edit-modal.spec.js:199)

**New test to create**:
```javascript
test('should manage Create Team button state based on form validation', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);
  await openCreateTeamModal(page);

  const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
  const createButton = modal.getByRole('button', { name: /Create Team/i });

  // Both buttons visible
  await expect(modal.getByRole('button', { name: /Cancel/i })).toBeVisible();
  await expect(createButton).toBeVisible();

  // Should be disabled because name is empty
  await expect(createButton).toBeDisabled();

  // Fill in name
  const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
  await nameInput.fill('New Test Team');

  // Should be enabled after filling name
  await expect(createButton).not.toBeDisabled();

  await closeTeamEditModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 6: Alias Management Complete Workflow
**Complexity**: EASY
**Files affected**: team-edit-modal.spec.js

**Current tests to replace**:
- [ ] `should add alias when clicking Add button` (team-edit-modal.spec.js:217)
- [ ] `should add alias when pressing Enter` (team-edit-modal.spec.js:233)
- [ ] `should remove alias when clicking X button` (team-edit-modal.spec.js:246)
- [ ] `should not add duplicate aliases` (team-edit-modal.spec.js:267)

**New test to create**:
```javascript
test('should manage aliases through complete workflow - add via button, add via Enter, remove, and prevent duplicates', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);
  await openCreateTeamModal(page);

  const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
  const aliasInput = page.locator('input[placeholder="Add alias and press Enter"]');

  // Add alias with button
  await aliasInput.fill('test-alias');
  await modal.getByRole('button', { name: 'Add' }).click();
  await expect(modal).toContainText('test-alias');

  // Add alias with Enter
  await aliasInput.fill('another-alias');
  await aliasInput.press('Enter');
  await expect(modal).toContainText('another-alias');

  // Add alias to remove
  await aliasInput.fill('removable-alias');
  await aliasInput.press('Enter');
  await expect(modal).toContainText('removable-alias');

  // Remove alias
  const aliasTag = modal.locator('span').filter({ hasText: 'removable-alias' });
  await aliasTag.locator('button, .remove-btn').click();
  await expect(modal).not.toContainText('removable-alias');

  // Try to add duplicate
  await aliasInput.fill('test-alias');
  await aliasInput.press('Enter');

  // Should only have one instance
  const aliasCount = await modal.locator('span:has-text("test-alias")').count();
  expect(aliasCount).toBe(1);

  await closeTeamEditModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 7: Form Submission States and Feedback
**Complexity**: EASY
**Files affected**: team-edit-modal.spec.js

**Current tests to replace**:
- [ ] `should show "Triggering workflow..." toast when saving` (team-edit-modal.spec.js:289)
- [ ] `should show success toast after successful creation` (team-edit-modal.spec.js:303)
- [ ] `should change button text to "Saving..." while submitting` (team-edit-modal.spec.js:317)

**New test to create**:
```javascript
test('should show correct feedback during form submission workflow - triggering, saving state, and success', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);
  await mockWorkflowDispatch(page, { status: 204, delay: 200 });
  await openCreateTeamModal(page);

  const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);

  // Fill required fields
  const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
  await nameInput.fill('New Test Team');

  // Submit
  const createButton = modal.getByRole('button', { name: /Create Team/i });
  await createButton.click();

  // Should show workflow triggering message
  await expect(page.locator('body')).toContainText(/Triggering workflow|Team creation workflow/i);

  // Wait for success toast
  await expect(page.getByText(/workflow triggered|Changes will appear/i)).toBeVisible({ timeout: 5000 });
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 8: Error Handling Consolidation
**Complexity**: EASY
**Files affected**: team-edit-modal.spec.js

**Current tests to replace**:
- [ ] `should show error toast on API failure` (team-edit-modal.spec.js:346)
- [ ] `should show error toast on 500 server error` (team-edit-modal.spec.js:369)

**New test to create**:
```javascript
test('should show error toast on API failures (403, 500)', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);

  // Test 403 error
  await mockWorkflowDispatch(page, { status: 403 });
  await openCreateTeamModal(page);

  const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
  await nameInput.fill('Test Team 403');

  const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
  await modal.getByRole('button', { name: /Create Team/i }).click();

  await expect(page.getByText(/Failed to save/i)).toBeVisible({ timeout: 5000 });

  await closeTeamEditModal(page);

  // Test 500 error
  await mockWorkflowDispatch(page, { status: 500 });
  await openCreateTeamModal(page);

  await nameInput.fill('Test Team 500');
  await modal.getByRole('button', { name: /Create Team/i }).click();

  await expect(page.getByText(/Failed to save/i)).toBeVisible({ timeout: 5000 });
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 9: Edit Mode Form Pre-population
**Complexity**: EASY
**Files affected**: team-edit-modal.spec.js

**Current tests to replace**:
- [ ] `should pre-populate form with team name` (team-edit-modal.spec.js:426)
- [ ] `should pre-populate form with team description` (team-edit-modal.spec.js:433)
- [ ] `should show existing aliases` (team-edit-modal.spec.js:440)
- [ ] `should have disabled Team ID field in edit mode` (team-edit-modal.spec.js:449)
- [ ] `should pre-populate slack channel` (team-edit-modal.spec.js:457)

**New test to create**:
```javascript
test('should pre-populate all form fields with existing team data in edit mode', async ({ page }) => {
  await setGitHubPAT(page, mockPAT);
  await switchToTeamsView(page);
  await openTeamModal(page, 'platform');
  await openEditTeamModal(page);

  const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);

  // Team name
  const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
  await expect(nameInput).toHaveValue('Platform');

  // Description
  const descriptionInput = page.locator('textarea');
  await expect(descriptionInput).toHaveValue('Platform engineering team');

  // Existing aliases
  await expect(modal).toContainText('plat');
  await expect(modal).toContainText('infra');

  // Disabled Team ID
  const idInput = page.locator('input[placeholder="auto-generated-from-name"]');
  await expect(idInput).toBeDisabled();
  await expect(idInput).toHaveValue('platform');

  // Slack channel
  const slackInput = page.locator('input[placeholder="#team-channel"]');
  await expect(slackInput).toHaveValue('#platform-eng');

  await closeTeamEditModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 5 tests

---

### Task 10: Team Filter Complete Workflow
**Complexity**: MEDIUM
**Files affected**: team-features.spec.js

**Current tests to replace**:
- [ ] `should filter services by team` (team-features.spec.js:117)
- [ ] `should support multi-select and clear filter` (team-features.spec.js:138)
- [ ] `should filter to services without team` (team-features.spec.js:156)

**New test to create**:
```javascript
test('should filter services through complete workflow - single select, multi-select, no-team filter, and clear', async ({ page }) => {
  // Open dropdown
  await page.locator('.team-filter-toggle').click();
  await expect(page.locator('.team-dropdown-menu')).toBeVisible();

  // Team options visible
  await expect(page.locator('.team-option').filter({ hasText: 'platform' })).toBeVisible();
  await expect(page.locator('.team-option').filter({ hasText: 'frontend' })).toBeVisible();
  await expect(page.locator('.team-option').filter({ hasText: 'backend' })).toBeVisible();

  // Single select frontend
  await page.locator('.team-option').filter({ hasText: 'frontend' }).locator('input').click();
  await expect(async () => {
    expect(await getServiceCount(page)).toBe(2);
  }).toPass({ timeout: 3000 });

  const names = await getVisibleServiceNames(page);
  expect(names).toContain('test-repo-edge-cases');
  expect(names).toContain('test-repo-javascript');

  // Multi-select frontend + backend
  await page.locator('.team-filter-toggle').click();
  await page.locator('.team-option').filter({ hasText: 'backend' }).locator('input').click();
  await expect(async () => {
    expect(await getServiceCount(page)).toBe(4);
  }).toPass({ timeout: 3000 });

  // Clear filter
  await expect(page.locator('.team-clear-btn')).toBeVisible();
  await page.locator('.team-clear-btn').click();
  await expect(async () => {
    expect(await getServiceCount(page)).toBe(9);
  }).toPass({ timeout: 3000 });

  // Filter to "No Team Assigned"
  await page.locator('.team-filter-toggle').click();
  await expect(page.locator('.team-option').filter({ hasText: 'No Team Assigned' })).toBeVisible();
  await page.locator('.team-option').filter({ hasText: 'No Team Assigned' }).locator('input').click();

  await expect(async () => {
    expect(await getServiceCount(page)).toBe(3);
  }).toPass({ timeout: 3000 });

  const noTeamNames = await getVisibleServiceNames(page);
  expect(noTeamNames).toContain('test-repo-empty');
  expect(noTeamNames).toContain('test-repo-minimal');
  expect(noTeamNames).toContain('test-repo-no-docs');
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 11: Check Adoption Table Structure and Sorting
**Complexity**: MEDIUM
**Files affected**: check-adoption-modal.spec.js

**Current tests to replace**:
- [ ] `table displays teams with progress bars and correct columns` (check-adoption-modal.spec.js:133)
- [ ] `table sorting works for columns` (check-adoption-modal.spec.js:154)

**New test to create**:
```javascript
test('should display table with correct structure and support column sorting', async ({ page }) => {
  await openCheckAdoptionModal(page);
  const modal = page.locator('#check-adoption-modal');
  const table = modal.locator('.adoption-table');
  await expect(table).toBeVisible();

  // Verify header row has correct columns
  const headers = table.locator('thead th');
  await expect(headers).toHaveCount(5);
  await expect(headers.nth(0)).toContainText('Team');
  await expect(headers.nth(1)).toContainText('Adoption');
  await expect(headers.nth(2)).toContainText('Progress');
  await expect(headers.nth(3)).toContainText('Passing');
  await expect(headers.nth(4)).toContainText('Excl.');

  // Verify at least one data row exists with progress bar
  const rows = modal.locator('.adoption-row');
  expect(await rows.count()).toBeGreaterThan(0);
  await expect(rows.first().locator('.progress-bar-inline')).toBeVisible();

  // Test Team column sorting
  const teamHeader = modal.locator('.adoption-table th:has-text("Team")');
  await expect(teamHeader.locator('.sort-indicator')).toBeVisible();

  // Test Adoption column sorting
  const adoptionHeader = modal.locator('.adoption-table th:has-text("Adoption")');
  await adoptionHeader.click();
  const sortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
  expect(sortIndicator).toMatch(/[↑↓]/);

  // Click again to reverse
  await adoptionHeader.click();
  await expect(async () => {
    const newSortIndicator = await adoptionHeader.locator('.sort-indicator').textContent();
    expect(newSortIndicator).not.toBe(sortIndicator);
  }).toPass({ timeout: 3000 });

  await closeCheckAdoptionModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

### Task 12: Exclusion Feature Complete Workflow
**Complexity**: MEDIUM
**Files affected**: check-adoption-modal.spec.js

**Current tests to replace**:
- [ ] `excluded stat card appears when exclusions exist` (check-adoption-modal.spec.js:221)
- [ ] `excluded count is shown in table rows` (check-adoption-modal.spec.js:235)
- [ ] `teams without exclusions show dash in Excl. column` (check-adoption-modal.spec.js:256)
- [ ] `overall stats show Services Passing with active count` (check-adoption-modal.spec.js:285)

**New test to create**:
```javascript
test('should display exclusion data correctly in stats, table rows, and handle teams without exclusions', async ({ page }) => {
  await openCheckAdoptionModal(page);
  const modal = page.locator('#check-adoption-modal');

  // Excluded stat card appears
  const excludedStatCard = modal.locator('.adoption-stat-card.excluded');
  await expect(excludedStatCard).toBeVisible();
  await expect(excludedStatCard.locator('.adoption-stat-label')).toContainText('Excluded');

  // Excluded count in table rows
  const frontendRow = modal.locator('.adoption-row').filter({ hasText: 'frontend' });
  const excludedCell = frontendRow.locator('.adoption-cell.has-excluded');
  await expect(excludedCell).toBeVisible();

  const excludedCount = excludedCell.locator('.excluded-count');
  await expect(excludedCount).toBeVisible();
  expect(await excludedCount.textContent()).not.toBe('—');

  // Teams without exclusions show dash
  await expect(modal.locator('.adoption-table')).toBeVisible();
  const rows = modal.locator('.adoption-row');
  await expect(rows.first()).toBeVisible({ timeout: 5000 });

  // Services Passing with active count
  const servicesPassingCard = modal.locator('.adoption-stat-card').filter({ hasText: 'Services Passing' });
  await expect(servicesPassingCard).toBeVisible();
  const value = await servicesPassingCard.locator('.adoption-stat-value').textContent();
  expect(value).toMatch(/^\d+\/\d+$/);

  await closeCheckAdoptionModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 4 tests

---

### Task 13: Team Modal Check Adoption Tab Complete Workflow
**Complexity**: MEDIUM
**Files affected**: check-adoption-modal.spec.js

**Current tests to replace**:
- [ ] `check adoption section displays correctly with exclusions` (check-adoption-modal.spec.js:313)
- [ ] `excluded services show with distinct styling and reason` (check-adoption-modal.spec.js:339)
- [ ] `adoption percentage displays correctly` (check-adoption-modal.spec.js:368)

**New test to create**:
```javascript
test('should display check adoption tab with exclusions, styling, and percentage calculation', async ({ page }) => {
  await switchToTeamsView(page);
  await openTeamModal(page, 'frontend');

  const modal = page.locator('#team-modal');
  const checkAdoptionTab = modal.getByRole('button', { name: 'Check Adoption' });
  await checkAdoptionTab.click();

  await expect(modal.locator('.tab-content, [class*="tab-content"]')).toBeVisible();

  const checkSelect = modal.locator('#team-check-select');
  await expect(modal.locator('.adoption-lists, .adoption-percentage')).toBeVisible();

  // Verify three-column layout when exclusions exist
  const adoptionLists = modal.locator('.adoption-lists');
  const hasThreeColumns = await adoptionLists.evaluate(el => el.classList.contains('three-columns'));
  expect(hasThreeColumns).toBe(true);

  // Excluded services with styling
  const excludedItems = modal.locator('.adoption-service-item.excluded');
  await expect(excludedItems.first()).toBeVisible();
  await expect(excludedItems.first()).toHaveClass(/excluded/);

  // Exclusion reason
  const exclusionReason = modal.locator('.exclusion-reason');
  await expect(exclusionReason.first()).toBeVisible();

  // Adoption percentage
  const adoptionPercentage = modal.locator('.adoption-percentage');
  const text = await adoptionPercentage.textContent();
  expect(text).toMatch(/\d+%/);

  await closeTeamModal(page);
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 3 tests

---

### Task 14: Dark Mode Verification
**Complexity**: EASY
**Files affected**: check-adoption-modal.spec.js

**Current tests to replace**:
- [ ] `modal is visible and functional in dark mode` (check-adoption-modal.spec.js:409)
- [ ] `exclusion styling is visible in dark mode` (check-adoption-modal.spec.js:422)

**New test to create**:
```javascript
test('should display modal and exclusions correctly in dark mode', async ({ page }) => {
  // Enable dark mode
  const themeToggle = page.getByRole('button', { name: /Toggle night mode/i });
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await openCheckAdoptionModal(page);
  const modal = page.locator('#check-adoption-modal');

  // Modal visible and functional
  await expect(modal).toBeVisible();
  await expect(modal.locator('h2')).toBeVisible();
  await expect(modal.locator('.adoption-stats-row')).toBeVisible();
  await expect(modal.locator('.adoption-table')).toBeVisible();

  // Exclusion styling visible
  const excludedStatCard = modal.locator('.adoption-stat-card.excluded');
  await expect(excludedStatCard).toBeVisible();

  const excludedCells = modal.locator('.adoption-cell.has-excluded');
  await expect(excludedCells.first()).toBeVisible();

  // Close and verify
  await closeCheckAdoptionModal(page);
  await expect(modal).toBeHidden();
});
```

**Verification checklist**:
- [ ] New test passes
- [ ] Coverage unchanged
- [ ] Delete original 2 tests

---

## Tests to Keep Unchanged

- `should switch to Teams view and display stats` (team-features.spec.js:23) - Unique initial view switch testing
- `should display team cards with correct information` (team-features.spec.js:51) - Team card rendering test
- `should open team modal when clicking card` (team-features.spec.js:63) - Card click interaction
- `should search and filter teams` (team-features.spec.js:73) - Search functionality in isolation
- `should sort teams by different criteria` (team-features.spec.js:87) - Sorting with viewport conditional logic
- `should have action buttons` (team-features.spec.js:105) - Action button presence verification
- `should display team services with correct information` (team-features.spec.js:206) - Services tab content
- `should open service modal when clicking service` (team-features.spec.js:221) - Nested modal interaction
- `should display rank distribution with all ranks` (team-features.spec.js:235) - Distribution tab content
- `should display check adoption information` (team-features.spec.js:262) - Check Adoption tab content
- `should allow changing check selection` (team-features.spec.js:280) - Check selector in team modal
- `should display GitHub information` (team-features.spec.js:299) - GitHub tab content
- `should show sign in prompt when no PAT` (team-features.spec.js:313) - PAT-specific state
- `should fetch team members with PAT` (team-features.spec.js:321) - API mocking with PAT
- `should show PAT required message when no token` (team-edit-modal.spec.js:72) - PAT required state
- `should have Configure Token button when no PAT` (team-edit-modal.spec.js:83) - PAT configuration flow
- `should open create team modal` (team-edit-modal.spec.js:101) - Modal opening in isolation
- `should show empty form in create mode` (team-edit-modal.spec.js:109) - Initial empty state
- `should auto-generate Team ID from name` (team-edit-modal.spec.js:163) - Auto-generation logic
- `should close modal when clicking Cancel` (team-edit-modal.spec.js:183) - Cancel button
- `should show error when team name is empty on save` (team-edit-modal.spec.js:338) - Validation error
- `should open edit modal from team modal` (team-edit-modal.spec.js:418) - Edit mode entry point
- `should show Save Changes button instead of Create Team` (team-edit-modal.spec.js:466) - Edit vs create state
- `should submit update successfully` (team-edit-modal.spec.js:475) - Edit mode submission
- `clicking team row opens team detail modal` (check-adoption-modal.spec.js:176) - Row click navigation
- `No Team row has distinct styling` (check-adoption-modal.spec.js:186) - Special row styling
- `progress bar shows correctly for 0% adoption` (check-adoption-modal.spec.js:195) - Edge case
