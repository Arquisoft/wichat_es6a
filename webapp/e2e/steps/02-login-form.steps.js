const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');

const feature = loadFeature('./features/login-form.feature');

let page;
let browser;

defineFeature(feature, test => {

  beforeEach(async () => {
    browser = process.env.GITHUB_ACTIONS
      ? await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
        })
      : await puppeteer.launch({
          headless: false,
          slowMo: 50,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    page = await browser.newPage();
    setDefaultOptions({ timeout: 100000 });

    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle0',
    });
  });

  afterEach(async () => {
    if (browser) {
      await browser.close();
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('Login with valid credentials', ({ given, when, then }) => {
    const username = "test2";
    const password = "test2";

    given('A registered user exists', async () => {
      // Registramos al usuario antes de hacer login
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
      await expect(page).toClick("button", { text: "Don't have an account? Register here." });
      await expect(page).toFill('input[name="username"]', "test2");
      await expect(page).toFill('input[name="password"]', "test2");
      await expect(page).toClick('button', { text: 'Add User' });

      // Luego vamos al login
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
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
  },100000);

});
