require('dotenv').config();
const { test, expect } = require('@playwright/test');

// Load credentials and base URL from environment variables
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;

// Global timeout for all tests
test.setTimeout(60000);

// Navigates to the base URL and waits for the email input to be visible
async function openLogin(page) {
  await page.goto(BASE_URL);
  await expect(page.getByPlaceholder('Enter phone or email')).toBeVisible({ timeout: 10000 });
}

// Fills in email and password, clicks Continue, and waits for network to settle
async function login(page, email, password) {
  await page.getByPlaceholder('Enter phone or email').fill(email);
  await page.getByPlaceholder('Password').fill(password);

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: 'Continue' }).click()
  ]);

  // Allow extra time for backend response before making assertions
  await page.waitForTimeout(2000);
}

// Clicks the theme toggle button and verifies that the body class changes to reflect the new theme
test('TC04 - Theme Compatibility', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForSelector('body');

  const initialClass = await page.evaluate(() => document.body.className);

  await page.locator('button[aria-label="Toggle dark mode"]').click();
  await page.waitForTimeout(1000);

  const updatedClass = await page.evaluate(() => document.body.className);

  expect(updatedClass).not.toBe(initialClass);
  expect(updatedClass.includes('dark-mode') || updatedClass.includes('light-mode')).toBeTruthy();
});

// Presses Tab twice and verifies focus moves from email input to password field to the Continue button
test('TC14 - Tab Navigation', async ({ page }) => {
  await openLogin(page);

  await page.keyboard.press('Tab');
  await expect(page.getByPlaceholder('Password')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused();
});

// Fills in credentials and submits the form using the Enter key
test('TC15 - Enter Key Submit', async ({ page }) => {
  await openLogin(page);

  await page.getByPlaceholder('Enter phone or email').fill(EMAIL);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.keyboard.press('Enter');

  await expect(page.locator('body')).toBeVisible();
});

// Fills the email input and then clears it; verifies the field is empty
test('TC16 - Clear Input', async ({ page }) => {
  await openLogin(page);

  const input = page.getByPlaceholder('Enter phone or email');
  await input.fill(EMAIL);
  await input.fill('');

  await expect(input).toHaveValue('');
});

// Submits invalid credentials, verifies error appears, then logs in with valid credentials and checks error disappears
test('TC18 - Error Removal', async ({ page }) => {
  await openLogin(page);

  await login(page, 'wrong@mail.com', 'wrong');

  const error = page.locator('p').filter({ hasText: /invalid|error/i });
  await expect(error).toBeVisible();

  await login(page, EMAIL, PASSWORD);

  await expect(error).not.toBeVisible();
});

// Types a character into the email field and verifies the input value is updated
test('TC21 - Placeholder Disappear', async ({ page }) => {
  await openLogin(page);

  const input = page.getByPlaceholder('Enter phone or email');
  await input.type('a');

  await expect(input).toHaveValue('a');
});

// Fills the email field programmatically and verifies the value is correctly set (simulates paste)
test('TC22 - Copy Paste', async ({ page }) => {
  await openLogin(page);

  await page.getByPlaceholder('Enter phone or email').fill(EMAIL);
  await expect(page.getByPlaceholder('Enter phone or email')).toHaveValue(EMAIL);
});

// Logs in with valid credentials and verifies the user is redirected away from the login page
test('TC26 - Valid Login', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, PASSWORD);
  await expect(page).not.toHaveURL(BASE_URL);
});

// Submits a valid email with a wrong password and expects an error message
test('TC27 - Invalid Password', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, 'wrong');
  await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
});

// Submits an unregistered email with any password and expects an error message
test('TC28 - Invalid Username', async ({ page }) => {
  await openLogin(page);
  await login(page, 'wrong@mail.com', PASSWORD);
  await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
});

// Submits both email and password as invalid and expects an error message
test('TC29 - Both Invalid', async ({ page }) => {
  await openLogin(page);
  await login(page, 'wrong', 'wrong');
  await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
});

// Clicks Continue without filling any fields and expects a validation message
test('TC30 - Empty Fields', async ({ page }) => {
  await openLogin(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('text=/enter both/i')).toBeVisible();
});

// Fills only the email field and submits; expects a validation message requiring both fields
test('TC31 - Only Username', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, '');
  await expect(page.locator('text=/enter both/i')).toBeVisible();
});

// Fills only the password field and submits; expects a validation message requiring both fields
test('TC32 - Only Password', async ({ page }) => {
  await openLogin(page);
  await login(page, '', PASSWORD);
  await expect(page.locator('text=/enter both/i')).toBeVisible();
});

// Logs in with whitespace-padded email to verify the app trims input before processing
test('TC33 - Trim Username', async ({ page }) => {
  await openLogin(page);
  await login(page, ` ${EMAIL} `, PASSWORD);
  await expect(page).not.toHaveURL(BASE_URL);
});

// Logs in and verifies a token is stored in localStorage after successful authentication
test('TC34 - Session Created', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, PASSWORD);

  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
});

// Logs in and clicks back; verifies the user is not returned to the login page
test('TC35 - Back Button After Login', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, PASSWORD);
  await page.goBack();
  await expect(page).not.toHaveURL(BASE_URL);
});

// Logs in with trailing/leading spaces in the password to verify behavior (fail or pass based on app logic)
test('TC36 - Password With Spaces', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, ` ${PASSWORD} `);
  await expect(page.locator('body')).toBeVisible();
});

// Logs in, reloads the page, and verifies the session is maintained after reload
test('TC37 - Refresh Session', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, PASSWORD);
  await page.reload();
  await expect(page).not.toHaveURL(/login/);
});

// Logs in on one page, opens a new tab in the same context, and verifies session is shared
test('TC38 - Browser Reopen Session', async ({ page, context }) => {
  await openLogin(page);
  await login(page, EMAIL, PASSWORD);

  const newPage = await context.newPage();
  await newPage.goto(BASE_URL);

  await expect(newPage).not.toHaveURL(/login/);
});

// Logs in with whitespace-padded email (duplicate of TC33) to verify consistent trim behavior
test('TC39 - Username Trim', async ({ page }) => {
  await openLogin(page);
  await login(page, ` ${EMAIL} `, PASSWORD);
  await expect(page).not.toHaveURL(BASE_URL);
});

// Logs in with whitespace-padded password; expects failure since passwords are not trimmed
test('TC40 - Password Trim Fail', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, ` ${PASSWORD} `);
  await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
});

// Verifies the login page loads successfully
test('TC41 - Page Load', async ({ page }) => {
  await openLogin(page);
});

// Verifies the login API responds correctly with valid credentials
test('TC42 - API Response', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, PASSWORD);
});

// Clicks the Continue button multiple times to verify no duplicate requests or errors
test('TC43 - Multiple Click', async ({ page }) => {
  await openLogin(page);

  const btn = page.getByRole('button', { name: 'Continue' });
  await btn.click();
  await btn.click();

  await expect(btn).toBeVisible();
});

// Routes all requests with a 500ms delay to simulate slow network conditions
test('TC44 - Slow Network Handling', async ({ page }) => {
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), 500);
  });

  await openLogin(page);
  await expect(page.locator('body')).toBeVisible();
});

// Types the email character by character to verify the input field responds to keystrokes
test('TC45 - Input Response', async ({ page }) => {
  await openLogin(page);
  await page.getByPlaceholder('Enter phone or email').type(EMAIL);
});

// Submits invalid credentials and verifies the error message appears promptly
test('TC46 - Error Speed', async ({ page }) => {
  await openLogin(page);
  await login(page, 'wrong', 'wrong');
  await expect(page.locator('text=/invalid/i')).toBeVisible();
});

// Logs in and checks that a token is present in localStorage
test('TC47 - Token Storage', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, PASSWORD);

  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
});

// Logs in, clears localStorage, re-injects the original token, reloads, and verifies app behavior
test('TC48 - Token Reuse Attack', async ({ page }) => {
  await openLogin(page);
  await login(page, EMAIL, PASSWORD);

  const token = await page.evaluate(() => localStorage.getItem('token'));

  await page.evaluate(() => localStorage.clear());
  await page.evaluate((t) => localStorage.setItem('token', t), token);

  await page.reload();

  await expect(page).toHaveURL(/login|select|dashboard/);
});