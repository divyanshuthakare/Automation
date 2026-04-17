require('dotenv').config();
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
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

/* ================= OPEN INSTITUTE ================= */

async function openInstitute(page) {
  await login(page);

  await page.waitForResponse(res =>
    res.url().includes('/my-institutes-roles') && res.status() === 200
  );

  await page.waitForSelector('.loader', { state: 'hidden', timeout: 15000 });
  await page.waitForSelector('.institute-card', { timeout: 15000 });
}

/* ================= TEST CASES ================= */

/* TC01 - Page Load */
test('TC01 - Page Load', async ({ page }) => {
  await openInstitute(page);

  await expect(page.locator('text=Hi')).toBeVisible();
  await expect(page.locator('input[placeholder="Search your institute..."]')).toBeVisible();
});

/* TC02 - Institute List Visible */
test('TC02 - Institute List Visible', async ({ page }) => {
  await openInstitute(page);

  const cards = page.locator('.institute-card');
  await expect(cards.first()).toBeVisible();
});

/* TC03 - Card Content Validation */
test('TC03 - Card Content', async ({ page }) => {
  await openInstitute(page);

  const card = page.locator('.institute-card').first();
  await expect(card).toBeVisible();
});

/* TC04 - Search Full Name */
test('TC04 - Search Full Name', async ({ page }) => {
  await openInstitute(page);

  const search = page.locator('input');
  await search.fill('TechSkills Development Institute');

  await expect(page.locator('.institute-card').first()).toBeVisible();
});

/* TC05 - Search Partial */
test('TC05 - Search Partial', async ({ page }) => {
  await openInstitute(page);

  await page.locator('input').fill('Tech');
  await expect(page.locator('.institute-card').first()).toBeVisible();
});

/* TC06 - Search No Result */
test('TC06 - No Result', async ({ page }) => {
  await openInstitute(page);

  await page.locator('input').fill('xyz123');
  await expect(page.locator('text=No institutes')).toBeVisible();
});

/* TC07 - Clear Search */
test('TC07 - Clear Search', async ({ page }) => {
  await openInstitute(page);

  const search = page.locator('input');
  await search.fill('abc');
  await search.fill('');

  await expect(page.locator('.institute-card').first()).toBeVisible();
});

/* TC08 - Click Card */
test('TC08 - Click Institute Card', async ({ page }) => {
  await openInstitute(page);

  await page.locator('.institute-card').first().click();
  await expect(page).not.toHaveURL(BASE_URL);
});

/* TC09 - Click Arrow */
test('TC09 - Click Arrow', async ({ page }) => {
  await openInstitute(page);

  await page.locator('.institute-card button').first().click();
  await expect(page).not.toHaveURL(BASE_URL);
});

test('TC10 - Location Display', async ({ page }) => {
  await openInstitute(page);

  const location = page.locator('.institute-card__location').first();

  // Check location visible
  await expect(location).toBeVisible();

  // Check empty nahiye
  await expect(location).not.toHaveText('');
});

/* TC11 - Empty Search */
test('TC11 - Empty Search', async ({ page }) => {
  await openInstitute(page);

  await page.locator('input').fill('');
  await expect(page.locator('.institute-card').first()).toBeVisible();
});

/* TC12 - Special Characters */
test('TC12 - Special Characters Search', async ({ page }) => {
  await openInstitute(page);

  await page.locator('input').fill('@@@###');
  await expect(page.locator('body')).toBeVisible();
});

/* TC13 - Fast Typing */
test('TC13 - Fast Typing', async ({ page }) => {
  await openInstitute(page);

  await page.locator('input').type('abcdef', { delay: 10 });
});

/* TC14 - Multiple Click */
test('TC14 - Multiple Click Safety', async ({ page }) => {
  await openInstitute(page);

  const card = page.locator('.institute-card').first();
  await card.click();
  await card.click();
});

/* TC15 - Profile Icon */
test('TC15 - Profile Icon Visible', async ({ page }) => {
  await openInstitute(page);

  await expect(page.locator('text=RW')).toBeVisible();
});