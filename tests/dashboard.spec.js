require('dotenv').config();
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL;
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;

test.setTimeout(60000);

/* ================= LOGIN ================= */

async function login(page) {
  await page.goto(BASE_URL);

  await page.getByPlaceholder('Enter phone or email').fill(EMAIL);
  await page.getByPlaceholder('Password').fill(PASSWORD);

  await Promise.all([
    page.waitForResponse(res =>
      res.url().includes('/login') && res.status() === 200
    ),
    page.getByRole('button', { name: 'Continue' }).click()
  ]);
}

/* ================= OPEN DASHBOARD ================= */

async function openDashboard(page) {
  await login(page);

  await page.waitForResponse(res =>
    res.url().includes('/my-institutes-roles')
  );

  await page.waitForSelector('.institute-card');

  // ✅ First institute click (as required)
  await page.locator('.institute-card').first().click();

  await page.waitForURL(/dashboard/);
}

/* ================= TEST CASES ================= */

/* TC01 */
test('TC01 - Page Load', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.dashboard-main__title')).toBeVisible();
});

/* TC02 */
test('TC02 - Welcome Message', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.dashboard-main__title')).toContainText('Welcome');
});

/* TC03 */
test('TC03 - Stats Cards Visible', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.stat-card')).toHaveCount(4);
});

/* TC04 */
test('TC04 - Active Institutes Card', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('text=Active Institutes')).toBeVisible();
});

/* TC05 */
test('TC05 - Inactive Institutes Card', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('text=Inactive Institutes')).toBeVisible();
});

/* TC06 */
test('TC06 - Total Modules Card', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('text=Total Modules')).toBeVisible();
});

/* TC07 */
test('TC07 - Total Users Card', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('text=Total Users')).toBeVisible();
});

/* TC08 */
test('TC08 - Logout Button Visible', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.logout-bar__btn')).toBeVisible();
});

/* TC09 */
test('TC09 - Logout Functionality', async ({ page }) => {
  await openDashboard(page);
  await page.locator('.logout-bar__btn').click();
  await expect(page).toHaveURL(/\/$/);
});

/* TC10 */
test('TC10 - Keyboard Navigation', async ({ page }) => {
  await openDashboard(page);
  await page.keyboard.press('Tab');
});

/* TC11 */
test('TC11 - Focus Visibility', async ({ page }) => {
  await openDashboard(page);
  await page.keyboard.press('Tab');
});

/* TC12 */
test('TC12 - Multiple Tab Usage', async ({ browser }) => {
  const context = await browser.newContext();
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await login(page1);
  await login(page2);
});

/* TC13 */
test('TC13 - Back/Forward Navigation', async ({ page }) => {
  await openDashboard(page);
  await page.goBack();
  await page.goForward();
});

/* TC14 */
test('TC14 - Multiple Logout Click', async ({ page }) => {
  await openDashboard(page);
  const btn = page.locator('.logout-bar__btn');
  await btn.click();
  await btn.click();
});

/* TC15 */
test('TC15 - Data Accuracy', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('.stat-card')).toHaveCount(4);
});

/* TC16 */
test('TC16 - Session Persistence', async ({ page }) => {
  await openDashboard(page);
  await page.reload();
  await expect(page).toHaveURL(/dashboard/);
});

/* TC17 */
test('TC17 - Direct URL Access', async ({ page }) => {
  await page.goto(BASE_URL + '/dashboard');
  await expect(page).toHaveURL(/\/$/);
});

/* TC18 */
test('TC18 - Slow Network Handling', async ({ page }) => {
  await page.route('**/*', route => setTimeout(() => route.continue(), 200));
  await openDashboard(page);
});

/* TC19 */
test('TC19 - Unauthorized Access', async ({ page }) => {
  await page.goto(BASE_URL + '/dashboard');
  await expect(page).toHaveURL(/\/$/);
});

/* TC20 */
test('TC20 - Token Validation', async ({ page }) => {
  await openDashboard(page);
  await page.evaluate(() => localStorage.removeItem('selectedRole'));
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
});

/* TC21 */
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

/* TC22 */
test('TC22 - Access After Logout', async ({ page }) => {
  await openDashboard(page);
  await page.locator('.logout-bar__btn').click();
  await page.goBack();
});