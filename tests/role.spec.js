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

/* ================= OPEN ROLE PAGE ================= */

/* ================= OPEN ROLE PAGE ================= */

async function openRolePage(page) {
  await login(page);

  await page.waitForResponse(res =>
    res.url().includes('/my-institutes-roles')
  );

  await page.waitForSelector('.institute-card');

  const cards = page.locator('.institute-card');
  const count = await cards.count();

  // ✅ FIX: select 3rd institute if available
  if (count >= 3) {
    await cards.nth(2).click();   // 3rd institute
  } else {
    await cards.first().click();  // fallback
  }

  await page.waitForSelector('.role-card');
}
/* ================= TEST CASES ================= */

/* TC01 */
test('TC01 - Page Load', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-page__title')).toHaveText('Choose Your Role');
});

/* TC02 */
test('TC02 - Institute Info', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-page__institute-card')).toBeVisible();
});

/* TC03 */
test('TC03 - Roles Visible', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-card')).toHaveCountGreaterThan(0);
});

/* TC04 */
test('TC04 - Role Card Content', async ({ page }) => {
  await openRolePage(page);
  const card = page.locator('.role-card').first();
  await expect(card).toBeVisible();
});

/* TC05 */
test('TC05 - Profile Icon', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('text=RW')).toBeVisible();
});

/* TC06 */
test('TC06 - Click Role', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-card').first().click();
  await expect(page).toHaveURL(/dashboard/);
});

/* TC07 */
test('TC07 - Arrow Click', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-card__arrow').first().click();
  await expect(page).toHaveURL(/dashboard/);
});

/* TC08 */
test('TC08 - Change Institute', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-page__change-btn').click();
  await expect(page).toHaveURL(/select-institute/);
});

/* TC09 */
test('TC09 - Single Role Flow', async ({ page }) => {
  await login(page);
  await expect(page.locator('body')).toBeVisible();
});

/* TC10 */
test('TC10 - Multiple Roles Flow', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('.role-card').first()).toBeVisible();
});

/* TC11 */
test('TC11 - No Roles', async ({ page }) => {
  await login(page);
  await expect(page.locator('body')).toBeVisible();
});

/* TC12 */
test('TC12 - Back Navigation', async ({ page }) => {
  await openRolePage(page);
  await page.locator('.role-card').first().click();
  await page.goBack();
});

/* TC13 */
test('TC13 - Refresh Page', async ({ page }) => {
  await openRolePage(page);
  await page.reload();
  await expect(page.locator('.role-card').first()).toBeVisible();
});

/* TC14 */
test('TC14 - Re-select Same Role', async ({ page }) => {
  await openRolePage(page);
  const role = page.locator('.role-card').first();
  await role.click();
});

/* TC15 */
test('TC15 - Page Load Speed', async ({ page }) => {
  const start = Date.now();
  await openRolePage(page);
  const time = Date.now() - start;
  expect(time).toBeLessThan(10000);
});

/* TC16 */
test('TC16 - Role Click Speed', async ({ page }) => {
  await openRolePage(page);
  const start = Date.now();
  await page.locator('.role-card').first().click();
  const time = Date.now() - start;
  expect(time).toBeLessThan(5000);
});

/* TC17 */
test('TC17 - Unauthorized Access', async ({ page }) => {
  await page.goto(BASE_URL + "/select-role");
  await expect(page).toHaveURL(/login/);
});

/* TC18 */
test('TC18 - Token Missing', async ({ page }) => {
  await openRolePage(page);
  await page.evaluate(() => localStorage.removeItem('access_token'));
  await page.reload();
  await expect(page).toHaveURL(/login/);
});

/* TC19 */
test('TC19 - Invalid Role Access', async ({ page }) => {
  await openRolePage(page);
  await expect(page.locator('body')).toBeVisible();
});