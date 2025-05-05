const puppeteer = require('puppeteer');
const { defineFeature, loadFeature }=require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions
const feature = loadFeature('./features/register-form.feature');

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

  test('The user is not registered in the site', ({given,when,then}) => {
    
    let username;
    let password;

    given('An unregistered user', async () => {
      username = "test1"
      password = "test1"
      await expect(page).toClick("button", { text: "Don't have an account? Register here." });
    });

    when('I fill the data in the form and press submit', async () => {
      await expect(page).toFill('input[name="username"]', username);
      await expect(page).toFill('input[name="password"]', password);
      await expect(page).toClick('button', { text: 'Add User' })
    });

    then('A confirmation message should be shown in the screen', async () => {
        await expect(page).toMatchElement("div", { text: "User added successfully" });
    });
  })

});