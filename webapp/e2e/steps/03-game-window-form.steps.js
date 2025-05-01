const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { setDefaultOptions } = require('expect-puppeteer');

const feature = loadFeature('./features/game-window.feature');

let browser, page;

defineFeature(feature, test => {
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    page = await browser.newPage();
    setDefaultOptions({ timeout: 15000 });
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  });

  test('Complete a game session using different lifelines on each question', ({ given, when, then }) => {
    const username = "admin";
    const password = "admin";

    given('A registered user with valid credentials', async () => {
      await expect(page).toFill('input[name="username"]', username);
      await expect(page).toFill('input[name="password"]', password);
      await page.click('[data-testid="login-button"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    });

    when(
      'I log in, then navigate to the home page, click "Play", select the "Mixed" category and "Easy" difficulty, use a different lifeline on each question, and finally reach the end-of-game screen after 4 questions',
      async () => {
        // Ir a Jugar
        await page.click('[data-testid="play-button"]');

        // Seleccionar categoría "Variado" (Mixed)
        await page.click('[data-testid="category-mixed"]');

        // Seleccionar dificultad "Fácil" (Easy)
        await page.click('[data-testid="difficulty-fácil"]');

        // Iniciar juego
        await page.click('[data-testid="start-game-button"]');

        // Pregunta 1: Usar Pista
        await page.click('[data-testid="hint-button"]');
        await page.waitForTimeout(1000);
        await page.click('[data-testid="answer-button-0"]');

        // Pregunta 2: Sin ayuda
        await page.waitForSelector('[data-testid="answer-button-1"]');
        await page.waitForTimeout(3000);
        await page.click('[data-testid="answer-button-1"]');

        // Pregunta 3: Usar 50/50
        await page.waitForSelector('[data-testid="answer-button-1"]');
        await page.waitForTimeout(3000);
        await page.click('[data-testid="fifty-fifty-button"]');
        await page.waitForTimeout(3000);
        const enabledAnswerButtons = await page.$$('[data-testid^="answer-button-"]:not([disabled])');

        if (enabledAnswerButtons.length > 0) {
          await enabledAnswerButtons[0].click(); // Elige la primera opción habilitada
        } else {
          throw new Error("No hay respuestas habilitadas después de 50/50");
        }

        // Pregunta 4: Sin ayuda
        await page.waitForSelector('[data-testid="answer-button-3"]');
        await page.waitForTimeout(3000);
        await page.click('[data-testid="answer-button-3"]');

        // Esperar pantalla de final
        await page.waitForSelector('[data-testid="end-screen-message"]', { timeout: 15000 });
      }
    );

    then('I should see the final game screen with the results', async () => {
      await expect(page).toMatchElement('[data-testid="end-screen-message"]');
      await expect(page.url()).toMatch(/\/endGame/);
    });
  }, 90000 );

  afterAll(async () => {
    await browser.close();
  });
});
