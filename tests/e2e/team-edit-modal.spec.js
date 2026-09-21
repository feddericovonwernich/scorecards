/**
 * Team Edit Modal E2E Tests
 * Tests for the team creation and editing modal
 */

import { test, expect } from './coverage.js';
import { mockPAT } from './fixtures.js';
import {
  mockCatalogRequests,
  waitForCatalogLoad,
  setGitHubPAT,
  switchToTeamsView,
} from './test-helper.js';

// Selector for team-edit-modal
const TEAM_EDIT_MODAL_SELECTOR = '.team-edit-modal';

/**
 * Open the Team Dashboard (Teams view)
 * @param {import('@playwright/test').Page} page
 */
async function openTeamDashboard(page) {
  await switchToTeamsView(page);
  // Wait for teams view to load
  await expect(page.locator('.teams-grid')).toBeVisible();
}

/**
 * Open Team Edit Modal in create mode
 * @param {import('@playwright/test').Page} page
 */
async function openCreateTeamModal(page) {
  await openTeamDashboard(page);
  // Button text is "+ Create Team"
  await page.locator('button:has-text("Create Team")').click();
  // Wait for modal to appear - the Modal component uses .modal class
  await page.waitForSelector('.modal', { state: 'visible', timeout: 5000 });
}

/**
 * Close Team Edit Modal
 * @param {import('@playwright/test').Page} page
 */
async function closeTeamEditModal(page) {
  await page.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
}

/**
 * Mock GitHub workflow dispatch API
 * @param {import('@playwright/test').Page} page
 * @param {Object} options
 */
async function mockWorkflowDispatch(page, { status = 204 } = {}) {
  await page.route('**/api.github.com/repos/**/actions/workflows/update-team-registry.yml/dispatches', async (route) => {
    await route.fulfill({
      status,
      body: '',
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

test.describe('Team Edit Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogRequests(page);
    await page.goto('/');
    await waitForCatalogLoad(page);
  });

  test.describe('PAT Required', () => {
    test('should show PAT required message when no token', async ({ page }) => {
      await openTeamDashboard(page);
      await page.getByRole('button', { name: /Create Team/i }).click();

      // Should show PAT required message - Modal uses .modal class
      await page.waitForSelector('.modal', { state: 'visible', timeout: 5000 });
      const modal = page.locator('.modal-content');
      await expect(modal).toContainText('PAT Required');
      await expect(modal).toContainText('GitHub Personal Access Token');
    });

    test('should have Configure Token button when no PAT', async ({ page }) => {
      await openTeamDashboard(page);
      await page.getByRole('button', { name: /Create Team/i }).click();

      // Modal uses .modal class
      await page.waitForSelector('.modal', { state: 'visible', timeout: 5000 });
      // Use getByRole within the dialog to avoid matching both HTML and React buttons
      const configureButton = page.getByRole('dialog').getByRole('button', { name: /Configure Token/i });
      await expect(configureButton).toBeVisible();
      await configureButton.click();
      const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
      await expect(settings).toBeVisible();
      await expect(page.getByRole('dialog', { name: 'PAT Required' })).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(settings).toBeHidden();
      await expect(page.getByRole('button', { name: /Create Team/i })).toBeVisible();
    });
  });

  test.describe('Create Mode', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
      await mockWorkflowDispatch(page);
    });

    test('should open create team modal', async ({ page }) => {
      await openCreateTeamModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Create Team');
    });

    test('should show empty form in create mode', async ({ page }) => {
      await openCreateTeamModal(page);

      const nameInput = page.getByRole('textbox').filter({ hasText: '' }).first();
      // In create mode, form should be empty initially
      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal.locator('input').first()).toHaveValue('');
    });

    test('should display all form fields with correct labels and controls in create mode', async ({ page }) => {
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

    test('should auto-generate Team ID from name', async ({ page }) => {
      await openCreateTeamModal(page);

      // Find inputs by their placeholder or label
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      await nameInput.fill('Platform Engineering Team');

      // ID should be auto-generated
      const idInput = page.locator('input[placeholder="auto-generated-from-name"]');
      await expect(idInput).toHaveValue('platform-engineering-team');
    });

    test('should manage Create Team button state based on form validation', async ({ page }) => {
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

    test('should close modal when clicking Cancel', async ({ page }) => {
      await openCreateTeamModal(page);
      await closeTeamEditModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Alias Management', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
      await mockWorkflowDispatch(page);
    });

    test('should manage aliases through complete workflow - add via button, add via Enter, remove, and prevent duplicates', async ({ page }) => {
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
      const removeButton = modal.getByRole('button', { name: 'Remove alias removable-alias', exact: true });
      await removeButton.focus();
      await page.keyboard.press('Enter');
      await expect(modal).not.toContainText('removable-alias');
      await expect(aliasInput).toBeFocused();

      // Try to add duplicate
      await aliasInput.fill('test-alias');
      await aliasInput.press('Enter');

      // Should only have one instance
      const aliasCount = await modal.locator('span:has-text("test-alias")').count();
      expect(aliasCount).toBe(1);

      await closeTeamEditModal(page);
    });
  });

  test.describe('Form Submission', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
    });

    test('keeps focus in the dialog while an authenticated team save succeeds and then closes', async ({ page }) => {
      let releaseDispatch;
      let dispatchStarted;
      const dispatchReady = new Promise(resolve => { releaseDispatch = resolve; });
      const dispatchStartedPromise = new Promise(resolve => { dispatchStarted = resolve; });
      await page.route('**/api.github.com/repos/**/actions/workflows/update-team-registry.yml/dispatches', async route => {
        dispatchStarted();
        await dispatchReady;
        await route.fulfill({ status: 204 });
      });

      await openCreateTeamModal(page);
      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      const heading = modal.getByRole('heading', { name: 'Create Team', exact: true });
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      const createButton = modal.getByRole('button', { name: 'Create Team', exact: true });
      await nameInput.fill('New Test Team');
      await createButton.focus();
      await page.keyboard.press('Enter');
      await dispatchStartedPromise;

      await expect(modal.getByRole('button', { name: 'Saving...', exact: true })).toBeDisabled();
      await expect(heading).toBeFocused();
      await expect(modal.getByText('Triggering workflow...', { exact: true })).toBeVisible();

      releaseDispatch();
      await expect(modal.getByText(/Team creation workflow triggered/i)).toBeVisible();
      await expect(modal).toBeHidden({ timeout: 3000 });
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
    });

    test('should show error when team name is empty on save', async ({ page }) => {
      await openCreateTeamModal(page);

      // The Create Team button should be disabled when name is empty
      const createButton = page.locator(TEAM_EDIT_MODAL_SELECTOR).getByRole('button', { name: /Create Team/i });
      await expect(createButton).toBeDisabled();
    });

    test('keeps focus in the dialog and shows inline feedback when an authenticated team save fails', async ({ page }) => {
      let releaseDispatch;
      let dispatchStarted;
      const dispatchReady = new Promise(resolve => { releaseDispatch = resolve; });
      const dispatchStartedPromise = new Promise(resolve => { dispatchStarted = resolve; });
      await page.route('**/api.github.com/repos/**/actions/workflows/update-team-registry.yml/dispatches', async route => {
        dispatchStarted();
        await dispatchReady;
        await route.fulfill({
          status: 403,
          body: JSON.stringify({ message: 'Resource not accessible' }),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await openCreateTeamModal(page);
      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      const heading = modal.getByRole('heading', { name: 'Create Team', exact: true });
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      const createButton = modal.getByRole('button', { name: 'Create Team', exact: true });
      await nameInput.fill('Test Team 403');
      await createButton.focus();
      await page.keyboard.press('Enter');
      await dispatchStartedPromise;

      await expect(modal.getByRole('button', { name: 'Saving...', exact: true })).toBeDisabled();
      await expect(heading).toBeFocused();
      await expect(modal.getByText('Triggering workflow...', { exact: true })).toBeVisible();

      releaseDispatch();
      await expect(modal.getByText('Failed to save: Resource not accessible', { exact: true })).toBeVisible();
      await expect(createButton).toBeEnabled();
      await expect(heading).toBeFocused();
    });
  });

  test.describe('Edit Mode', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
      await mockWorkflowDispatch(page);
    });

    /**
     * Open Team Edit Modal in edit mode by clicking Edit button in team modal
     * @param {import('@playwright/test').Page} page
     * @param {string} teamName
     */
    async function openEditTeamModal(page, teamName) {
      await openTeamDashboard(page);

      // Click on team card to open team modal
      await page.locator('.team-card').filter({ hasText: teamName }).click();
      await page.waitForSelector('#team-modal', { state: 'visible', timeout: 5000 });

      // Click the Edit Team button in the team modal header
      await page.locator('#team-modal').getByRole('button', { name: /Edit Team/i }).click();

      // Wait for edit modal to appear
      await page.waitForSelector('.modal', { state: 'visible', timeout: 5000 });
    }

    test('should open edit modal from team modal', async ({ page }) => {
      await openEditTeamModal(page, 'Platform');

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Edit Team');
    });

    test('should pre-populate all form fields with existing team data in edit mode', async ({ page }) => {
      await openEditTeamModal(page, 'Platform');

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

      // Close edit modal using its own Cancel button
      await modal.getByRole('button', { name: /Cancel/i }).click();
      await expect(modal).not.toBeVisible();
    });

    test('should show Save Changes button instead of Create Team', async ({ page }) => {
      await openEditTeamModal(page, 'Platform');

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal.getByRole('button', { name: /Save Changes/i })).toBeVisible();
      // Should not show Create Team button
      await expect(modal.getByRole('button', { name: /Create Team/i })).not.toBeVisible();
    });

    test('should submit update successfully', async ({ page }) => {
      await openEditTeamModal(page, 'Platform');

      // Modify the name
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      await nameInput.clear();
      await nameInput.fill('Platform Updated');

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await modal.getByRole('button', { name: 'Save Changes', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(modal.getByRole('heading', { name: 'Edit Team', exact: true })).toBeFocused();
      await expect(modal.getByText(/workflow triggered|Changes will appear/i)).toBeVisible();
    });
  });
});
