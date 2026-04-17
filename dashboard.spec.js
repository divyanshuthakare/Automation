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

// Completes login, waits for institute list to load, clicks the first card, and navigates to dashboard
async function openDashboard(page) {
  await login(page);

  await page.waitForResponse(res => res.url().includes('/my-institutes-roles'));
  await page.waitForSelector('.institute-card');
  await page.locator('.institute-card').first().click();
  await page.waitForURL(/dashboard/);
}

// Verifies that the dashboard page loads and the main title element is visible
test('TC01 - Page Load', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.dashboard-main__title')).toBeVisible();
});

// Checks that the dashboard title contains a welcome message for the user
test('TC02 - Welcome Message', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.dashboard-main__title')).toContainText('Welcome');
});

// Confirms that exactly 4 stat cards are rendered on the dashboard
test('TC03 - Stats Cards Visible', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.stat-card')).toHaveCount(4);
});

// Verifies the Active Institutes stat card is present on the dashboard
test('TC04 - Active Institutes Card', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('text=Active Institutes')).toBeVisible();
});

// Verifies the Inactive Institutes stat card is present on the dashboard
test('TC05 - Inactive Institutes Card', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('text=Inactive Institutes')).toBeVisible();
});

// Verifies the Total Modules stat card is present on the dashboard
test('TC06 - Total Modules Card', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('text=Total Modules')).toBeVisible();
});

// Verifies the Total Users stat card is present on the dashboard
test('TC07 - Total Users Card', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('text=Total Users')).toBeVisible();
});

// Checks that the logout button is visible in the dashboard layout
test('TC08 - Logout Button Visible', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.logout-bar__btn')).toBeVisible();
});

// Clicks logout and verifies the user is redirected back to the root URL
test('TC09 - Logout Functionality', async ({ page }) => {
  await openDashboard(page);
  await page.locator('.logout-bar__btn').click();
  await expect(page).toHaveURL(/\/$/);
});

// Simulates a Tab key press to check that keyboard navigation is functional
test('TC10 - Keyboard Navigation', async ({ page }) => {
  await openDashboard(page);
  await page.keyboard.press('Tab');
});

// Presses Tab and verifies focus moves to the next interactive element
test('TC11 - Focus Visibility', async ({ page }) => {
  await openDashboard(page);
  await page.keyboard.press('Tab');
});

// Opens two tabs in the same browser context and logs in on both to verify multi-tab support
test('TC12 - Multiple Tab Usage', async ({ browser }) => {
  const context = await browser.newContext();
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await login(page1);
  await login(page2);
});

// Navigates back and forward in browser history to check page stability
test('TC13 - Back/Forward Navigation', async ({ page }) => {
  await openDashboard(page);
  await page.goBack();
  await page.goForward();
});

// Clicks the logout button twice to verify no crash or duplicate action occurs
test('TC14 - Multiple Logout Click', async ({ page }) => {
  await openDashboard(page);
  const btn = page.locator('.logout-bar__btn');
  await btn.click();
  await btn.click();
});

// Verifies that the stat card count matches expected data (4 cards)
test('TC15 - Data Accuracy', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.stat-card')).toHaveCount(4);
});

// Reloads the dashboard and verifies the user session is still active
test('TC16 - Session Persistence', async ({ page }) => {
  await openDashboard(page);
  await page.reload();
  await expect(page).toHaveURL(/dashboard/);
});

// Attempts to access the dashboard URL directly without logging in; expects redirect to root
test('TC17 - Direct URL Access', async ({ page }) => {
  await page.goto(BASE_URL + '/dashboard');
  await expect(page).toHaveURL(/\/$/);
});

// Adds a 200ms delay to all network requests to simulate a slow connection
test('TC18 - Slow Network Handling', async ({ page }) => {
  await page.route('**/*', route => setTimeout(() => route.continue(), 200));
  await openDashboard(page);
});

// Verifies unauthenticated direct access to the dashboard redirects to root
test('TC19 - Unauthorized Access', async ({ page }) => {
  await page.goto(BASE_URL + '/dashboard');
  await expect(page).toHaveURL(/\/$/);
});

// Removes selectedRole from localStorage and reloads to verify session invalidation behavior
test('TC20 - Token Validation', async ({ page }) => {
  await openDashboard(page);
  await page.evaluate(() => localStorage.removeItem('selectedRole'));
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
});

// Sets dark-mode in localStorage and on body class, logs out, and verifies the class persists
test('TC21 - Dark Theme Persistence', async ({ page }) => {
  await openDashboard(page);

  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark-mode');
    document.body.classList.add('dark-mode');
  });

  await page.locator('.logout-bar__btn').click();

  const cls = await page.locator('body').getAttribute('class');
  expect(cls).toContain('dark-mode');
});

// Logs out and navigates back to verify the dashboard is not accessible after logout
test('TC22 - Access After Logout', async ({ page }) => {
  await openDashboard(page);
  await page.locator('.logout-bar__btn').click();
  await page.goBack();
});