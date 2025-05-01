const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');

const feature = loadFeature('./features/questions-access.feature');

let browser, page;

defineFeature(feature, test => {
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    page = await browser.newPage();
    setDefaultOptions({ timeout: 15000 });
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  });

  test('Successful login and navigation to Questions page', ({ given, when, then }) => {
    const username = "admin";
    const password = "admin";

    given('A registered user with valid credentials', async () => {
      await expect(page).toFill('input[name="username"]', username);
      await expect(page).toFill('input[name="password"]', password);
      await page.click('[data-testid="login-button"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    });

    when('I log in and click on the "Questions" link in the navbar', async () => {
      await page.waitForSelector('[data-testid="navbar-questions-link"]');
      await page.click('[data-testid="navbar-questions-link"]');
    });

    then('I should be redirected to the questions page', async () => {
      const url = page.url();
      expect(url).toMatch(/\/questions/);
    });
  });

  afterAll(async () => {
    await browser.close();
  });
});
