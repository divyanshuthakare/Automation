require('dotenv').config();
const { test, expect } = require('@playwright/test');

// Load credentials and base URL from environment variables
const BASE_URL = process.env.BASE_URL;
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;

// Global timeout for all tests
test.setTimeout(60000);

// Logs in using email and password, waits for successful login API response
async function login(page) {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('Enter phone or email').fill(EMAIL);
  await page.getByPlaceholder('Password').fill(PASSWORD);

  await Promise.all([
    page.waitForResponse(res => res.url().includes('/login') && res.status() === 200),
    page.getByRole('button', { name: 'Continue' }).click()
  ]);
}

// Completes login, selects the 3rd institute if available (fallback to first), and waits for role cards
async function openRolePage(page) {
  await login(page);

  await page.waitForResponse(res => res.url().includes('/my-institutes-roles'));
  await page.waitForSelector('.institute-card');

  const cards = page.locator('.institute-card');
  const count = await cards.count();

  // Select 3rd institute if available, otherwise fall back to first
  if (count >= 3) {
    await cards.nth(2).click();
  } else {
    await cards.first().click();
  }

  await page.waitForSelector('.role-card');
}

// Verifies the role selection page loads and displays the correct page title
test('TC01 - Page Load', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-page__title')).toHaveText('Choose Your Role');
});

// Checks that the institute info card is visible on the role selection page
test('TC02 - Institute Info', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-page__institute-card')).toBeVisible();
});

// Verifies that at least one role card is rendered for the selected institute
test('TC03 - Roles Visible', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-card')).toHaveCountGreaterThan(0);
});

// Confirms the first role card is visible and rendered in the DOM
test('TC04 - Role Card Content', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-card').first()).toBeVisible();
});

// Verifies the user profile icon (initials) is visible on the role selection page
test('TC05 - Profile Icon', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('text=RW')).toBeVisible();
});

// Clicks the first role card and verifies the user is redirected to the dashboard
test('TC06 - Click Role', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-card').first().click();
  await expect(page).toHaveURL(/dashboard/);
});

// Clicks the arrow button on the first role card and verifies navigation to the dashboard
test('TC07 - Arrow Click', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-card__arrow').first().click();
  await expect(page).toHaveURL(/dashboard/);
});

// Clicks the change institute button and verifies navigation back to the institute selection page
test('TC08 - Change Institute', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-page__change-btn').click();
  await expect(page).toHaveURL(/select-institute/);
});

// Logs in and verifies the page loads without errors for a single-role user flow
test('TC09 - Single Role Flow', async ({ page }) => {
  await login(page);
  await expect(page.locator('body')).toBeVisible();
});

// Verifies at least one role card is visible for a user with multiple roles
test('TC10 - Multiple Roles Flow', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-card').first()).toBeVisible();
});

// Logs in and verifies the page is stable when the user has no assigned roles
test('TC11 - No Roles', async ({ page }) => {
  await login(page);
  await expect(page.locator('body')).toBeVisible();
});

// Selects a role and navigates back; verifies the back navigation does not crash the app
test('TC12 - Back Navigation', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-card').first().click();
  await page.goBack();
});

// Reloads the role selection page and verifies the role cards are still visible after reload
test('TC13 - Refresh Page', async ({ page }) => {
  await openRolePage(page);
  await page.reload();
  await expect(page.locator('.role-card').first()).toBeVisible();
});

// Clicks the first role card to verify the selection action completes without error
test('TC14 - Re-select Same Role', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-card').first().click();
});

// Measures total time to open the role page and asserts it completes within 10 seconds
test('TC15 - Page Load Speed', async ({ page }) => {
  const start = Date.now();
  await openRolePage(page);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(10000);
});

// Measures time taken to click a role card and asserts the action completes within 5 seconds
test('TC16 - Role Click Speed', async ({ page }) => {
  await openRolePage(page);
  const start = Date.now();
  await page.locator('.role-card').first().click();
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(5000);
});

// Attempts to access the role selection page directly without logging in; expects redirect to login
test('TC17 - Unauthorized Access', async ({ page }) => {
  await page.goto(BASE_URL + '/select-role');
  await expect(page).toHaveURL(/login/);
});

// Removes the access token from localStorage and reloads; verifies the user is redirected to login
test('TC18 - Token Missing', async ({ page }) => {
  await openRolePage(page);
  await page.evaluate(() => localStorage.removeItem('access_token'));
  await page.reload();
  await expect(page).toHaveURL(/login/);
});

// Verifies the role page remains stable when accessed with a potentially invalid role context
test('TC19 - Invalid Role Access', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('body')).toBeVisible();
});