const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');

const feature = loadFeature('./features/questions-access.feature');

let browser, page;

defineFeature(feature, test => {
  
  beforeEach(async () => {
    browser = process.env.GITHUB_ACTIONS
      ? await puppeteer.launch({
          headless: 'new',
          slowMo: 500,
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

  test('Successful login and navigation to Questions page', ({ given, when, then }) => {
    const username = "test5"
    const password = "test5";

    given('A registered user with valid credentials', async () => {
       // Registramos al usuario antes de hacer login
       await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
       await expect(page).toClick("button", { text: "Don't have an account? Register here." });
 
       await page.waitForSelector('input[name="username"]');
       await page.waitForSelector('input[name="password"]');
 
       await expect(page).toFill('input[name="username"]', username);
       await expect(page).toFill('input[name="password"]', password);
       await expect(page).toClick('button', { text: 'Add User' });
 
       // Luego vamos al login
       await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
 
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

});
