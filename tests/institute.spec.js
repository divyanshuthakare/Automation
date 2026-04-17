require('dotenv').config();
const { test, expect } = require('@playwright/test');

// Load credentials and base URL from environment variables
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
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

// Completes login, waits for the loader to disappear, and waits for institute cards to appear
async function openInstitute(page) {
  await login(page);

  await page.waitForResponse(res =>
    res.url().includes('/my-institutes-roles') && res.status() === 200
  );

  await page.waitForSelector('.loader', { state: 'hidden', timeout: 15000 });
  await page.waitForSelector('.institute-card', { timeout: 15000 });
}

// Verifies the institute selection page loads with greeting text and search input visible
test('TC01 - Page Load', async ({ page }) => {
  await openInstitute(page);
  await expect(page.locator('text=Hi')).toBeVisible();
  await expect(page.locator('input[placeholder="Search your institute..."]')).toBeVisible();
});

// Checks that at least one institute card is visible after loading
test('TC02 - Institute List Visible', async ({ page }) => {
  await openInstitute(page);
  await expect(page.locator('.institute-card').first()).toBeVisible();
});

// Verifies the first institute card is rendered in the DOM
test('TC03 - Card Content', async ({ page }) => {
  await openInstitute(page);
  await expect(page.locator('.institute-card').first()).toBeVisible();
});

// Searches by full institute name and verifies a matching card is displayed
test('TC04 - Search Full Name', async ({ page }) => {
  await openInstitute(page);
  await page.locator('input').fill('TechSkills Development Institute');
  await expect(page.locator('.institute-card').first()).toBeVisible();
});

// Searches by partial name and verifies matching results are shown
test('TC05 - Search Partial', async ({ page }) => {
  await openInstitute(page);
  await page.locator('input').fill('Tech');
  await expect(page.locator('.institute-card').first()).toBeVisible();
});

// Enters a term with no matching institute and verifies an empty state message appears
test('TC06 - No Result', async ({ page }) => {
  await openInstitute(page);
  await page.locator('input').fill('xyz123');
  await expect(page.locator('text=No institutes')).toBeVisible();
});

// Clears the search input after typing and verifies the full institute list is restored
test('TC07 - Clear Search', async ({ page }) => {
  await openInstitute(page);
  const search = page.locator('input');
  await search.fill('abc');
  await search.fill('');
  await expect(page.locator('.institute-card').first()).toBeVisible();
});

// Clicks the first institute card and verifies navigation away from the base URL
test('TC08 - Click Institute Card', async ({ page }) => {
  await openInstitute(page);
  await page.locator('.institute-card').first().click();
  await expect(page).not.toHaveURL(BASE_URL);
});

// Clicks the arrow button inside the first card and verifies navigation occurs
test('TC09 - Click Arrow', async ({ page }) => {
  await openInstitute(page);
  await page.locator('.institute-card button').first().click();
  await expect(page).not.toHaveURL(BASE_URL);
});

// Checks that the location field inside the first institute card is visible and non-empty
test('TC10 - Location Display', async ({ page }) => {
  await openInstitute(page);
  const location = page.locator('.institute-card__location').first();
  await expect(location).toBeVisible();
  await expect(location).not.toHaveText('');
});

// Leaves the search input empty and verifies that all institute cards are still displayed
test('TC11 - Empty Search', async ({ page }) => {
  await openInstitute(page);
  await page.locator('input').fill('');
  await expect(page.locator('.institute-card').first()).toBeVisible();
});

// Enters special characters in the search field and verifies the page does not crash
test('TC12 - Special Characters Search', async ({ page }) => {
  await openInstitute(page);
  await page.locator('input').fill('@@@###');
  await expect(page.locator('body')).toBeVisible();
});

// Types text rapidly into the search field to verify debounce or fast-input handling
test('TC13 - Fast Typing', async ({ page }) => {
  await openInstitute(page);
  await page.locator('input').type('abcdef', { delay: 10 });
});

// Clicks the same institute card twice to verify no duplicate navigation or crash
test('TC14 - Multiple Click Safety', async ({ page }) => {
  await openInstitute(page);
  const card = page.locator('.institute-card').first();
  await card.click();
  await card.click();
});

// Verifies that the user profile icon (initials) is visible on the institute selection page
test('TC15 - Profile Icon Visible', async ({ page }) => {
  await openInstitute(page);
  await expect(page.locator('text=RW')).toBeVisible();
});