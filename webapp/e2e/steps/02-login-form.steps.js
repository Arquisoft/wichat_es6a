const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');

const feature = loadFeature('./features/login-form.feature');

let page;
let browser;

defineFeature(feature, test => {

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
    });

    page = await browser.newPage();
    setDefaultOptions({ timeout: 10000 });

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  });

  test('Login with valid credentials', ({ given, when, then }) => {
    const username = "admin";
    const password = "admin";

    given('A registered user exists', async () => {
    });

    when('I navigate to the login page and login with correct credentials', async () => {

      await expect(page).toFill('input[name="username"]', username);
      await expect(page).toFill('input[name="password"]', password);
      await page.click('[data-testid="login-button"]');
    });

    then('I should be redirected to the home page', async () => {
      await page.waitForFunction(() => window.location.pathname.includes('/home'), { timeout: 15000 });
      await expect(page.url()).toMatch(/\/home/);
    });    
  });

  afterAll(async () => {
    await browser.close();
  });
});
