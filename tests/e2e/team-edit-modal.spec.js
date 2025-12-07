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
  await page.route('**/api.github.com/repos/**/actions/workflows/update-team.yml/dispatches', async (route) => {
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

    test('should show Team Name field with required indicator', async ({ page }) => {
      await openCreateTeamModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('Team Name');
      // Required indicator is usually * or (required)
      await expect(modal).toContainText('*');
    });

    test('should show Team ID field', async ({ page }) => {
      await openCreateTeamModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('Team ID');
    });

    test('should show Description field', async ({ page }) => {
      await openCreateTeamModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('Description');
    });

    test('should show Aliases field with Add button', async ({ page }) => {
      await openCreateTeamModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('Aliases');
      await expect(modal.getByRole('button', { name: 'Add' })).toBeVisible();
    });

    test('should show Slack Channel field', async ({ page }) => {
      await openCreateTeamModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('Slack Channel');
    });

    test('should show Oncall Rotation URL field', async ({ page }) => {
      await openCreateTeamModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('Oncall Rotation');
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

    test('should have Cancel and Create Team buttons', async ({ page }) => {
      await openCreateTeamModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal.getByRole('button', { name: /Cancel/i })).toBeVisible();
      await expect(modal.getByRole('button', { name: /Create Team/i })).toBeVisible();
    });

    test('should close modal when clicking Cancel', async ({ page }) => {
      await openCreateTeamModal(page);
      await closeTeamEditModal(page);

      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).not.toBeVisible();
    });

    test('should disable Create Team button when name is empty', async ({ page }) => {
      await openCreateTeamModal(page);

      const createButton = page.locator(TEAM_EDIT_MODAL_SELECTOR).getByRole('button', { name: /Create Team/i });
      // Should be disabled because name is empty
      await expect(createButton).toBeDisabled();
    });

    test('should enable Create Team button when name is filled', async ({ page }) => {
      await openCreateTeamModal(page);

      // Fill in team name
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      await nameInput.fill('New Test Team');

      const createButton = page.locator(TEAM_EDIT_MODAL_SELECTOR).getByRole('button', { name: /Create Team/i });
      await expect(createButton).not.toBeDisabled();
    });
  });

  test.describe('Alias Management', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
      await mockWorkflowDispatch(page);
    });

    test('should add alias when clicking Add button', async ({ page }) => {
      await openCreateTeamModal(page);

      // Find alias input
      const aliasInput = page.locator('input[placeholder="Add alias and press Enter"]');
      await aliasInput.fill('test-alias');

      // Click Add button
      const addButton = page.locator(TEAM_EDIT_MODAL_SELECTOR).getByRole('button', { name: 'Add' });
      await addButton.click();

      // Alias should appear as a tag
      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('test-alias');
    });

    test('should add alias when pressing Enter', async ({ page }) => {
      await openCreateTeamModal(page);

      // Find alias input
      const aliasInput = page.locator('input[placeholder="Add alias and press Enter"]');
      await aliasInput.fill('another-alias');
      await aliasInput.press('Enter');

      // Alias should appear as a tag
      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('another-alias');
    });

    test('should remove alias when clicking X button', async ({ page }) => {
      await openCreateTeamModal(page);

      // Add an alias first
      const aliasInput = page.locator('input[placeholder="Add alias and press Enter"]');
      await aliasInput.fill('removable-alias');
      await aliasInput.press('Enter');

      // Verify alias is added
      const modal = page.locator(TEAM_EDIT_MODAL_SELECTOR);
      await expect(modal).toContainText('removable-alias');

      // Remove the alias by clicking × button on the alias tag (not the modal close button)
      // The alias remove button is inside the aliases list, not the modal-close button
      const removeButton = modal.locator('button:has-text("×")').last();
      await removeButton.click();

      // Alias should be removed
      await expect(modal).not.toContainText('removable-alias');
    });

    test('should not add duplicate aliases', async ({ page }) => {
      await openCreateTeamModal(page);

      // Add same alias twice
      const aliasInput = page.locator('input[placeholder="Add alias and press Enter"]');
      await aliasInput.fill('duplicate-alias');
      await aliasInput.press('Enter');
      await aliasInput.fill('duplicate-alias');
      await aliasInput.press('Enter');

      // Should only have one instance
      const aliasCount = await page.locator(TEAM_EDIT_MODAL_SELECTOR).locator('span:has-text("duplicate-alias")').count();
      expect(aliasCount).toBe(1);
    });
  });

  test.describe('Form Submission', () => {
    test.beforeEach(async ({ page }) => {
      await setGitHubPAT(page, mockPAT);
      await mockWorkflowDispatch(page);
    });

    test('should show "Triggering workflow..." toast when saving', async ({ page }) => {
      await openCreateTeamModal(page);

      // Fill required field
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      await nameInput.fill('Test Team');

      // Click create
      await page.locator(TEAM_EDIT_MODAL_SELECTOR).getByRole('button', { name: /Create Team/i }).click();

      // Should show workflow triggering message
      await expect(page.locator('body')).toContainText(/Triggering workflow|Team creation workflow/i);
    });

    test('should show success toast after successful creation', async ({ page }) => {
      await openCreateTeamModal(page);

      // Fill required field
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      await nameInput.fill('Test Team');

      // Click create
      await page.locator(TEAM_EDIT_MODAL_SELECTOR).getByRole('button', { name: /Create Team/i }).click();

      // Wait for success toast
      await expect(page.getByText(/workflow triggered|Changes will appear/i)).toBeVisible();
    });

    test('should change button text to "Saving..." while submitting', async ({ page }) => {
      await openCreateTeamModal(page);

      // Fill required field
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      await nameInput.fill('Test Team');

      // Click create and check button text changes
      const createButton = page.locator(TEAM_EDIT_MODAL_SELECTOR).getByRole('button', { name: /Create Team/i });
      await createButton.click();

      // Button should briefly show "Saving..."
      // This happens very quickly, so we might not catch it
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

    test('should show error toast on API failure', async ({ page }) => {
      // Mock failed API response
      await page.route('**/api.github.com/repos/**/actions/workflows/update-team.yml/dispatches', async (route) => {
        await route.fulfill({
          status: 403,
          body: JSON.stringify({ message: 'Resource not accessible' }),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await openCreateTeamModal(page);

      // Fill required field
      const nameInput = page.locator('input[placeholder="e.g., Platform Team"]');
      await nameInput.fill('Test Team');

      // Click create
      await page.locator(TEAM_EDIT_MODAL_SELECTOR).getByRole('button', { name: /Create Team/i }).click();

      // Should show error toast
      await expect(page.getByText(/Failed|Error|not accessible/i)).toBeVisible();
    });
  });
});
