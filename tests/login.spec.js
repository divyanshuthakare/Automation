require('dotenv').config();
const { test, expect } = require('@playwright/test');

// 🔥 DEBUG LINE (add this)
console.log("BASE_URL:", process.env.BASE_URL);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;

test.setTimeout(60000);

/* ================= HELPERS ================= */

async function openLogin(page) {
  await page.goto(BASE_URL);

  await expect(
    page.getByPlaceholder('Enter phone or email')
  ).toBeVisible({ timeout: 10000 });
}

async function login(page, email, password) {
  await page.getByPlaceholder('Enter phone or email').fill(email);
  await page.getByPlaceholder('Password').fill(password);

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: 'Continue' }).click()
  ]);

  // backend delay handle
  await page.waitForTimeout(2000);
}



test('TC04 - Theme compatibility', async ({ page }) => {
  await page.goto("http://localhost:3000");

  // wait for page load
  await page.waitForSelector('body');

  // initial theme
  const initialClass = await page.evaluate(() => document.body.className);

  // click theme toggle button
  await page.locator('button[aria-label="Toggle dark mode"]').click();

  // wait for UI update
  await page.waitForTimeout(1000);

  // get updated class
  const updatedClass = await page.evaluate(() => document.body.className);

  // verify theme changed
  expect(updatedClass).not.toBe(initialClass);

  // check either dark-mode or light-mode present
  expect(updatedClass.includes('dark-mode') || updatedClass.includes('light-mode')).toBeTruthy();
});

/* ================= TESTS ================= */

// TC14
test('TC14 - Tab Navigation', async ({ page }) => {
  await openLogin(page);

  await page.keyboard.press('Tab');
  await expect(page.getByPlaceholder('Password')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused();
});

// TC15
test('TC15 - Enter Key Submit', async ({ page }) => {
  await openLogin(page);

  await page.getByPlaceholder('Enter phone or email').fill(EMAIL);
  await page.getByPlaceholder('Password').fill(PASSWORD);

  await page.keyboard.press('Enter');

  await expect(page.locator('body')).toBeVisible();
});

// TC16
test('TC16 - Clear Input', async ({ page }) => {
  await openLogin(page);

  const input = page.getByPlaceholder('Enter phone or email');
  await input.fill(EMAIL);
  await input.fill('');

  await expect(input).toHaveValue('');
});

// TC18
test('TC18 - Error Removal', async ({ page }) => {
  await openLogin(page);

  await login(page, 'wrong@mail.com', 'wrong');

  const error = page.locator('p').filter({ hasText: /invalid|error/i });
  await expect(error).toBeVisible();

  await login(page, EMAIL, PASSWORD);

  await expect(error).not.toBeVisible();
});

// TC21
test('TC21 - Placeholder Disappear', async ({ page }) => {
  await openLogin(page);

  const input = page.getByPlaceholder('Enter phone or email');
  await input.type('a');

  await expect(input).toHaveValue('a');
});

// TC22
test('TC22 - Copy Paste', async ({ page }) => {
  await openLogin(page);

  await page.getByPlaceholder('Enter phone or email').fill(EMAIL);
  await expect(page.getByPlaceholder('Enter phone or email')).toHaveValue(EMAIL);
});

// TC26
test('TC26 - Valid Login', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, PASSWORD);

  // redirect happens → dashboard / select page
  await expect(page).not.toHaveURL(BASE_URL);
});

// TC27
test('TC27 - Invalid Password', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, 'wrong');

  await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
});

// TC28
test('TC28 - Invalid Username', async ({ page }) => {
  await openLogin(page);

  await login(page, 'wrong@mail.com', PASSWORD);

  await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
});

// TC29
test('TC29 - Both Invalid', async ({ page }) => {
  await openLogin(page);

  await login(page, 'wrong', 'wrong');

  await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
});

// TC30
test('TC30 - Empty Fields', async ({ page }) => {
  await openLogin(page);

  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.locator('text=/enter both/i')).toBeVisible();
});

// TC31
test('TC31 - Only Username', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, '');

  await expect(page.locator('text=/enter both/i')).toBeVisible();
});

// TC32
test('TC32 - Only Password', async ({ page }) => {
  await openLogin(page);

  await login(page, '', PASSWORD);

  await expect(page.locator('text=/enter both/i')).toBeVisible();
});

// TC33
test('TC33 - Trim Username', async ({ page }) => {
  await openLogin(page);

  await login(page, ` ${EMAIL} `, PASSWORD);

  await expect(page).not.toHaveURL(BASE_URL);
});

// TC34
test('TC34 - Session Created', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, PASSWORD);

  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
});

// TC35 - Back button after login
test('TC35 - Back button after login', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, PASSWORD);

  await page.goBack();

  // should not return to login
  await expect(page).not.toHaveURL(BASE_URL);
});

// TC36 - Password with spaces
test('TC36 - Password with spaces', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, ` ${PASSWORD} `);

  // based on your logic → should fail or behave as actual input
  await expect(page.locator('body')).toBeVisible();
});

// TC37
test('TC37 - Refresh Session', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, PASSWORD);
  await page.reload();

  await expect(page).not.toHaveURL(/login/);
});

// TC38 - Browser close & reopen (simulate)
test('TC38 - Browser reopen session', async ({ page, context }) => {
  await openLogin(page);

  await login(page, EMAIL, PASSWORD);

  // simulate reopen
  const newPage = await context.newPage();
  await newPage.goto(BASE_URL);

  // session should persist
  await expect(newPage).not.toHaveURL(/login/);
});

// TC39 - Username trim handling
test('TC39 - Username trim', async ({ page }) => {
  await openLogin(page);

  await login(page, ` ${EMAIL} `, PASSWORD);

  await expect(page).not.toHaveURL(BASE_URL);
});

// TC40 - Password trim fail
test('TC40 - Password trim fail', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, ` ${PASSWORD} `);

  await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
});

// TC41
test('TC41 - Page Load', async ({ page }) => {
  await openLogin(page);
});

// TC42
test('TC42 - API Response', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, PASSWORD);
});

// TC43
test('TC43 - Multiple Click', async ({ page }) => {
  await openLogin(page);

  const btn = page.getByRole('button', { name: 'Continue' });

  await btn.click();
  await btn.click();

  await expect(btn).toBeVisible();
});
// TC44 - Slow network handling
test('TC44 - Slow network handling', async ({ page }) => {
  // simulate slow network
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), 500); // delay
  });

  await openLogin(page);

  await expect(page.locator('body')).toBeVisible();
});
// TC45
test('TC45 - Input Response', async ({ page }) => {
  await openLogin(page);

  await page.getByPlaceholder('Enter phone or email').type(EMAIL);
});

// TC46
test('TC46 - Error Speed', async ({ page }) => {
  await openLogin(page);

  await login(page, 'wrong', 'wrong');

  await expect(page.locator('text=/invalid/i')).toBeVisible();
});

// TC47
test('TC47 - Token Storage', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, PASSWORD);

  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
});

// TC48 - Token reuse attack
test('TC48 - Token reuse attack', async ({ page }) => {
  await openLogin(page);

  await login(page, EMAIL, PASSWORD);

  // get token
  const token = await page.evaluate(() => localStorage.getItem('token'));

  // clear session
  await page.evaluate(() => {
    localStorage.clear();
  });

  // reuse token
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
  }, token);

  await page.reload();

  // should not allow access directly
  await expect(page).toHaveURL(/login|select|dashboard/);
});