const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { browser } = require('webdriverio');

//cambiar, hecho con chatgpt
Given('I am on the login page', async function () {
  await browser.url('http://webapp:3000/login');  
});

When('I enter valid credentials', async function () {
  await $('#username').setValue('validUser');
  await $('#password').setValue('validPassword');
  await $('#loginButton').click();
});

Then('I should be redirected to the dashboard', async function () {
  const url = await browser.getUrl();
  expect(url).to.include('/dashboard');
});