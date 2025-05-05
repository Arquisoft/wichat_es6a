const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');

const feature = loadFeature('./features/questions-access.feature');

let browser, page;

defineFeature(feature, test => {
  
    beforeAll(async () => {
      browser = process.env.GITHUB_ACTIONS
        ? await puppeteer.launch({headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox']})
        : await puppeteer.launch({ headless: false, slowMo: 100 });
      page = await browser.newPage();
      //Way of setting up the timeout
      setDefaultOptions({ timeout: 10000 })
  
      await page
        .goto("http://localhost:3000/login", {
          waitUntil: "networkidle0",
        })
        .catch(() => {});
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
       await expect(page).toMatchElement("div", { text: "User added successfully" });
 
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

  afterAll(async () => {
    await browser.close();
  });
});
