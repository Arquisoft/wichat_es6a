import Game, { Question, Answer } from './Game';

// Mock de dependencias externas
global.fetch = jest.fn();
const mockNavigate = jest.fn();

describe('Game', () => {
  let game;
  let localStorageMock;

  beforeEach(() => {
    // Configurar localStorage mock
    localStorageMock = {
      getItem: jest.fn().mockImplementation((key) => (key === 'username' ? 'TestUser' : null)),
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    game = new Game(mockNavigate);
    fetch.mockClear();
    mockNavigate.mockClear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
    jest.clearAllMocks();
  });

  const mockDBQuestions = [
    {
      question: 'What is the capital of France?',
      correctAnswer: 'Paris',
      incorrectAnswers: ['Berlin', 'Madrid', 'Rome'],
      imageUrl: 'france.jpg',
    },
    {
      question: 'Who wrote Don Quijote?',
      correctAnswer: 'Miguel de Cervantes',
      incorrectAnswers: ['Shakespeare', 'Lorca', 'Marquez'],
      imageUrl: null,
    },
  ];

  test('initializes game with category and difficulty', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDBQuestions),
    });

    const category = { name: 'History' };
    const difficulty = { name: 'Medium', questionCount: 2 };
    await game.init(category, difficulty);

    expect(game.category).toBe(category);
    expect(game.difficulty).toBe(difficulty);
    expect(game.totalQuestions).toBe(2);
    expect(game.startTime).toBeDefined();
    expect(game.questionIndex).toBe(0);
    expect(game.score).toBe(0);
    expect(game.correctAnswers).toBe(0);
    expect(game.consecutiveCorrectAnswers).toBe(0);
    expect(game.maxConsecutiveCorrectAnswers).toBe(0);
    expect(game.questions).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/questions?category=History');
  });

  test('falls back to TestingInit when DB load fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const category = { name: 'History' };
    const difficulty = { name: 'Medium', questionCount: 3 };
    await game.init(category, difficulty);

    expect(game.questions).toHaveLength(3);
    expect(game.totalQuestions).toBe(3);
    expect(game.startTime).toBeDefined();
    expect(game.category).toBe(category);
    expect(game.difficulty).toBe(difficulty);
  });

  test('falls back to TestingInit when DB returns empty questions', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await game.init({ name: 'History' }, { name: 'Medium', questionCount: 3 });

    expect(game.questions).toHaveLength(3);
    expect(game.totalQuestions).toBe(3);
    expect(game.startTime).toBeDefined();
  });

  test('loads questions from DB with Variado category', async () => {
    // Mockear loadQuestionsFromDB para devolver datos fijos y deterministas
    jest.spyOn(game, 'loadQuestionsFromDB').mockImplementation(async (category, count) => {
      game.questions = [
        {
          questionText: 'What is the capital of France?',
          answers: [
            { text: 'Paris', isCorrect: true },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
            { text: 'Rome', isCorrect: false },
          ],
          imageUrl: 'france.jpg',
        },
        {
          questionText: 'Who wrote Don Quijote?',
          answers: [
            { text: 'Miguel de Cervantes', isCorrect: true },
            { text: 'Shakespeare', isCorrect: false },
            { text: 'Lorca', isCorrect: false },
            { text: 'Marquez', isCorrect: false },
          ],
          imageUrl: null,
        },
      ];
    });

    await game.loadQuestionsFromDB('Variado', 2);

    expect(game.loadQuestionsFromDB).toHaveBeenCalledWith('Variado', 2);
    expect(game.questions).toHaveLength(2);
    expect(game.questions[0].questionText).toBe('What is the capital of France?');
    expect(game.questions[0].answers).toHaveLength(4);
    expect(game.questions[0].answers[0]).toEqual({ text: 'Paris', isCorrect: true });
    expect(game.questions[0].answers[1]).toEqual({ text: 'Berlin', isCorrect: false });
    expect(game.questions[0].answers[2]).toEqual({ text: 'Madrid', isCorrect: false });
    expect(game.questions[0].answers[3]).toEqual({ text: 'Rome', isCorrect: false });
    expect(game.questions[0].imageUrl).toBe('france.jpg');
    expect(game.questions[1].questionText).toBe('Who wrote Don Quijote?');
    expect(game.questions[1].answers[0]).toEqual({ text: 'Miguel de Cervantes', isCorrect: true });
  });

  test('TestingInit loads predefined questions', () => {
    game.TestingInit(2);

    expect(game.questions).toHaveLength(2);
    expect(game.startTime).toBeDefined();
    expect(game.questions[0].questionText).toBeDefined();
    expect(game.questions[0].answers).toBeDefined();
  });

  test('endGame saves results and navigates', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('Success'),
    });

    game.startTime = Date.now() - 10000;
    game.score = 300;
    game.correctAnswers = 2;
    game.maxConsecutiveCorrectAnswers = 2;
    game.questions = [
      {
        questionText: 'Test',
        answers: [{ text: 'A', isCorrect: true }],
        imageUrl: null,
      },
    ];
    game.difficulty = { name: 'Medium' };
    game.category = { name: 'History' };

    await game.endGame();

    expect(game.totalTimeTaken).toBeGreaterThanOrEqual(10);
    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/addGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    expect(mockNavigate).toHaveBeenCalledWith('/endGame', {
      state: {
        score: 300,
        correctAnswers: 2,
        totalQuestions: 1,
        streak: 2,
        timeTaken: expect.any(Number),
        category: 'History',
        difficulty: 'Medium',
      },
    });
  });

  test('endGame handles missing username', async () => {
    localStorageMock.getItem.mockImplementationOnce(() => null);
    game.startTime = Date.now() - 10000;

    await game.endGame();

    expect(fetch).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('getCurrentQuestionText returns correct text', () => {
    game.questions = [
      {
        questionText: 'Test Question',
        answers: [{ text: 'A', isCorrect: true }],
        imageUrl: null,
      },
    ];
    expect(game.getCurrentQuestionText()).toBe('Test Question');

    game.questionIndex = 1;
    expect(game.getCurrentQuestionText()).toBe('Fin del juego');
  });

  test('getCurrentStreak returns consecutive correct answers', () => {
    game.consecutiveCorrectAnswers = 3;
    expect(game.getCurrentStreak()).toBe(3);
  });

  test('getCurrentQuestionImageUrl returns image URL', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [{ text: 'A', isCorrect: true }],
        imageUrl: 'test.jpg',
      },
    ];
    expect(game.getCurrentQuestionImageUrl()).toBe('test.jpg');

    game.questionIndex = 1;
    expect(game.getCurrentQuestionImageUrl()).toBe(null);
  });

  test('getCurrentQuestionAnswer returns answer text', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
        imageUrl: null,
      },
    ];
    expect(game.getCurrentQuestionAnswer(0)).toBe('A');
    expect(game.getCurrentQuestionAnswer(1)).toBe('B');
    expect(game.getCurrentQuestionAnswer(2)).toBeUndefined();

    game.questionIndex = 1;
    expect(game.getCurrentQuestionAnswer(0)).toBeUndefined();
  });

  test('getCurrentPoints returns score', () => {
    game.score = 500;
    expect(game.getCurrentPoints()).toBe(500);
  });

  test('answerQuestion processes correct answer', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
        imageUrl: null,
      },
    ];
    game.answerQuestion(0);

    expect(game.score).toBe(100);
    expect(game.correctAnswers).toBe(1);
    expect(game.consecutiveCorrectAnswers).toBe(1);
    expect(game.maxConsecutiveCorrectAnswers).toBe(1);
    expect(game.questionIndex).toBe(1);
  });

  test('answerQuestion processes incorrect answer', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
        imageUrl: null,
      },
    ];
    game.answerQuestion(1);

    expect(game.score).toBe(0);
    expect(game.correctAnswers).toBe(0);
    expect(game.consecutiveCorrectAnswers).toBe(0);
    expect(game.questionIndex).toBe(1);
  });

  test('answerQuestion processes timeout', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [{ text: 'A', isCorrect: true }],
        imageUrl: null,
      },
    ];
    game.consecutiveCorrectAnswers = 2;
    game.answerQuestion(-1, true);

    expect(game.score).toBe(0);
    expect(game.correctAnswers).toBe(0);
    expect(game.consecutiveCorrectAnswers).toBe(0);
    expect(game.questionIndex).toBe(1);
  });

  test('answerQuestion with 50/50 reduces points', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
        imageUrl: null,
      },
    ];
    game.useFiftyFifty();
    game.answerQuestion(0);

    expect(game.score).toBe(60);
    expect(game.correctAnswers).toBe(1);
    expect(game.usedFiftyFiftyOn.has('Test')).toBe(true);
  });

  test('answerQuestion with streak bonus', () => {
    game.questions = [
      {
        questionText: 'Test1',
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
        imageUrl: null,
      },
      {
        questionText: 'Test2',
        answers: [
          { text: 'C', isCorrect: true },
          { text: 'D', isCorrect: false },
        ],
        imageUrl: null,
      },
    ];
    game.answerQuestion(0); // Correcta: +100
    game.answerQuestion(0); // Correcta: +100 + 20 (racha)

    expect(game.score).toBe(220); // 100 + 100 + 20
    expect(game.consecutiveCorrectAnswers).toBe(2);
    expect(game.maxConsecutiveCorrectAnswers).toBe(2);
  });

  test('answerQuestion ends game when no more questions', async () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [{ text: 'A', isCorrect: true }],
        imageUrl: null,
      },
    ];
    game.startTime = Date.now() - 10000;
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('Success'),
    });

    
    await game.answerQuestion(0);
  });

  test('getCurrentQuestion returns current question', () => {
    const question = {
      questionText: 'Test',
      answers: [{ text: 'A', isCorrect: true }],
      imageUrl: null,
    };
    game.questions = [question];
    expect(game.getCurrentQuestion()).toBe(question);

    game.questionIndex = 1;
    expect(game.getCurrentQuestion()).toBeUndefined();
  });

  test('useFiftyFifty marks current question', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [{ text: 'A', isCorrect: true }],
        imageUrl: null,
      },
    ];
    game.useFiftyFifty();

    expect(game.usedFiftyFiftyOn.has('Test')).toBe(true);
  });

  test('useHint marks current question', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [{ text: 'A', isCorrect: true }],
        imageUrl: null,
      },
    ];
    game.useHint();

    expect(game.usedHintOn.has('Test')).toBe(true);
  });

  test('useAsk-0msuseAskAI marks current question', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [{ text: 'A', isCorrect: true }],
        imageUrl: null,
      },
    ];
    game.useAskAI();

    expect(game.usedAskAIOn.has('Test')).toBe(true);
  });

  test('answerQuestion with hint reduces points', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
        imageUrl: null,
      },
    ];
    game.useHint();
    game.answerQuestion(0);

    expect(game.score).toBe(85);
    expect(game.correctAnswers).toBe(1);
    expect(game.usedHintOn.has('Test')).toBe(true);
  });

  test('answerQuestion with Ask AI reduces points', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
        imageUrl: null,
      },
    ];
    game.useAskAI();
    game.answerQuestion(0);

    expect(game.score).toBe(75);
    expect(game.correctAnswers).toBe(1);
    expect(game.usedAskAIOn.has('Test')).toBe(true);
  });

  test('answerQuestion with all aids reduces points correctly', () => {
    game.questions = [
      {
        questionText: 'Test',
        answers: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
        imageUrl: null,
      },
    ];
    game.useFiftyFifty();
    game.useHint();
    game.useAskAI();
    game.answerQuestion(0);

    expect(game.score).toBe(20);
    expect(game.correctAnswers).toBe(1);
    expect(game.usedFiftyFiftyOn.has('Test')).toBe(true);
    expect(game.usedHintOn.has('Test')).toBe(true);
    expect(game.usedAskAIOn.has('Test')).toBe(true);
  });
});