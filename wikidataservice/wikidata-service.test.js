// wikidata-service.test.js

// --- 1. Mockear el módulo de base de datos ANTES de cualquier otra cosa ---
jest.mock(
  "/usr/src/llmservice/config/database",
  () => {
    return jest.fn((mongooseInstance) => {
      console.log("[Mock] connectDatabase llamado (simulado).");
    });
  },
  { virtual: true }
);

// --- 2. Mockea las dependencias locales explícitamente ---

// Mockea WikidataCacheService
jest.mock("./wikidataCacheService", () => {
  // Devuelve un objeto que SIMULA la instancia exportada por el módulo real,
  return {
    __esModule: false,
    getRandomEntry: jest.fn(),
    getEntriesForCategory: jest.fn(),
    fetchAndSaveEntries: jest.fn(),
    isDatabaseInitialized: jest.fn(),
    initializeDatabase: jest.fn(),
  };
});

// Mockea WikiQueries
jest.mock("./wikidataQueries", () => {
  return {
    __esModule: false,
    obtenerPaisYCapital: jest.fn(),
    obtenerMonumentoYPais: jest.fn(),
    obtenerSimboloQuimico: jest.fn(),
    obtenerPeliculaYDirector: jest.fn(),
    obtenerCancionYArtista: jest.fn(),
    obtenerAñoYGanadorF1: jest.fn(),
    obtenerPintorYObras: jest.fn(),
  };
});

// --- 3. importar (require) los módulos ---
const request = require("supertest");
const { server } = require("./wikidata-service");
const WikidataCacheService = require("./wikidataCacheService");
const WikiQueries = require("./wikidataQueries");

// --- 4. Configuración y Ciclo de Vida del Test ---
afterAll((done) => {
  server.close(done); // Asegura que el servidor se cierre al final
});

// --- 5. Suite de Pruebas ---
describe("Wikidata Service Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Pruebas para /api/entries/random ---
  describe("GET /api/entries/random", () => {
    it("devuelve una entrada aleatoria cuando existe", async () => {
      const fakeEntry = {
        _id: "random123",
        category: "paises",
        rawData: { countryLabel: "Paislandia" },
        imageUrl: "http://example.com/img.jpg",
      };
      WikidataCacheService.getRandomEntry.mockResolvedValue(fakeEntry);

      const res = await request(server).get("/api/entries/random");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeEntry);
      expect(WikidataCacheService.getRandomEntry).toHaveBeenCalledTimes(1);
    });

    it("responde 404 si no hay entradas disponibles", async () => {
      WikidataCacheService.getRandomEntry.mockResolvedValue(null);

      const res = await request(server).get("/api/entries/random");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "No se encontraron entradas" });
      expect(WikidataCacheService.getRandomEntry).toHaveBeenCalledTimes(1);
    });

    it("responde 500 si ocurre un error en el servicio de caché", async () => {
      WikidataCacheService.getRandomEntry.mockRejectedValue(
        new Error("Cache service failure")
      );

      const res = await request(server).get("/api/entries/random");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: "Error al recuperar entrada aleatoria",
      });
      expect(WikidataCacheService.getRandomEntry).toHaveBeenCalledTimes(1);
    });
  });

  // --- Pruebas para /api/entries/:category ---
  describe("GET /api/entries/:category", () => {
    it("devuelve un array de entradas para una categoría y count específicos", async () => {
      const fakeEntries = [
        { _id: "cat1", category: "test" },
        { _id: "cat2", category: "test" },
      ];
      WikidataCacheService.getEntriesForCategory.mockResolvedValue(fakeEntries);

      const res = await request(server).get("/api/entries/test?count=2");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeEntries);
      expect(WikidataCacheService.getEntriesForCategory).toHaveBeenCalledWith(
        "test",
        2
      );
    });

    it("usa count=1 por defecto si no se especifica", async () => {
      const fakeEntry = [{ _id: "cat_default", category: "test_default" }];
      WikidataCacheService.getEntriesForCategory.mockResolvedValue(fakeEntry);

      const res = await request(server).get("/api/entries/test_default");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeEntry);
      expect(WikidataCacheService.getEntriesForCategory).toHaveBeenCalledWith(
        "test_default",
        1
      );
    });

    it("responde 404 si no hay resultados para la categoría", async () => {
      WikidataCacheService.getEntriesForCategory.mockResolvedValue([]); // Array vacío = no encontrado

      const res = await request(server).get("/api/entries/empty_category");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: "No se encontraron entradas para la categoría empty_category",
      });
      expect(WikidataCacheService.getEntriesForCategory).toHaveBeenCalledWith(
        "empty_category",
        1
      );
    });

    it("responde 500 si el servicio de caché falla", async () => {
      WikidataCacheService.getEntriesForCategory.mockRejectedValue(
        new Error("Cache service failure")
      );

      const res = await request(server).get("/api/entries/failed_category");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Error al recuperar entradas" });
      expect(WikidataCacheService.getEntriesForCategory).toHaveBeenCalledWith(
        "failed_category",
        1
      );
    });
  });

  // --- Pruebas para /api/entries/fetch/:category ---
  describe("POST /api/entries/fetch/:category", () => {
    it("llama a fetchAndSaveEntries y devuelve éxito y count", async () => {
      const fetchedAndSaved = [{ _id: "new1" }, { _id: "new2" }];
      WikidataCacheService.fetchAndSaveEntries.mockResolvedValue(
        fetchedAndSaved
      );

      const res = await request(server).post(
        "/api/entries/fetch/fetch_cat?count=2"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        count: fetchedAndSaved.length,
      });
      expect(WikidataCacheService.fetchAndSaveEntries).toHaveBeenCalledWith(
        "fetch_cat",
        2
      );
    });

    it("usa count=5 por defecto si no se especifica al hacer fetch", async () => {
      const fetchedAndSaved = [{ _id: "def1" }, { _id: "def2" }];
      WikidataCacheService.fetchAndSaveEntries.mockResolvedValue(
        fetchedAndSaved
      );

      const res = await request(server).post(
        "/api/entries/fetch/default_fetch"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        count: fetchedAndSaved.length,
      });
      expect(WikidataCacheService.fetchAndSaveEntries).toHaveBeenCalledWith(
        "default_fetch",
        5
      );
    });

    it("responde 500 si fetchAndSaveEntries falla", async () => {
      WikidataCacheService.fetchAndSaveEntries.mockRejectedValue(
        new Error("Fetch/Save failed")
      );

      const res = await request(server).post("/api/entries/fetch/failed_fetch");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Error al obtener nuevas entradas" });
      expect(WikidataCacheService.fetchAndSaveEntries).toHaveBeenCalledWith(
        "failed_fetch",
        5
      );
    });
  });

  // --- Pruebas para las Rutas Legacy ---
  describe("Rutas legacy", () => {
    const legacyRoutes = [
      {
        route: "paises",
        fnName: "obtenerPaisYCapital",
        errMsg: "Error al obtener los países",
      },
      {
        route: "monumentos",
        fnName: "obtenerMonumentoYPais",
        errMsg: "Error al obtener los monumentos",
      },
      {
        route: "elementos",
        fnName: "obtenerSimboloQuimico",
        errMsg: "Error al obtener los elementos químicos",
      },
      {
        route: "peliculas",
        fnName: "obtenerPeliculaYDirector",
        errMsg: "Error al obtener las películas",
      },
      {
        route: "canciones",
        fnName: "obtenerCancionYArtista",
        errMsg: "Error al obtener las canciones",
      },
      {
        route: "formula1",
        fnName: "obtenerAñoYGanadorF1",
        errMsg: "Error al obtener los datos de Fórmula 1",
      },
      {
        route: "pinturas",
        fnName: "obtenerPintorYObras",
        errMsg: "Error al obtener las pinturas",
      },
    ];

    legacyRoutes.forEach(({ route, fnName, errMsg }) => {
      it(`GET /api/${route} - devuelve datos desde la caché si existen`, async () => {
        const cachedData = [{ _id: `cached_${route}`, category: route }];
        WikidataCacheService.getEntriesForCategory.mockResolvedValue(
          cachedData
        );

        const res = await request(server).get(`/api/${route}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(cachedData);
        expect(WikidataCacheService.getEntriesForCategory).toHaveBeenCalledWith(
          route,
          10
        );
        if (WikiQueries[fnName]) {
          expect(WikiQueries[fnName]).not.toHaveBeenCalled();
        }
      });

      it(`GET /api/${route} - hace fallback a WikiQueries si la caché está vacía y devuelve datos`, async () => {
        WikidataCacheService.getEntriesForCategory.mockResolvedValue([]);
        const wikiData = [{ source: fnName, data: "value" }];
        WikiQueries[fnName].mockResolvedValue(wikiData);

        const res = await request(server).get(`/api/${route}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(wikiData);
        expect(WikidataCacheService.getEntriesForCategory).toHaveBeenCalledWith(
          route,
          10
        );
        expect(WikiQueries[fnName]).toHaveBeenCalledTimes(1);
      });

      it(`GET /api/${route} - devuelve 500 si el fallback a WikiQueries falla`, async () => {
        WikidataCacheService.getEntriesForCategory.mockResolvedValue([]);
        WikiQueries[fnName].mockRejectedValue(
          new Error("Wikidata query failed")
        );

        const res = await request(server).get(`/api/${route}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: errMsg });
        expect(WikidataCacheService.getEntriesForCategory).toHaveBeenCalledWith(
          route,
          10
        );
        expect(WikiQueries[fnName]).toHaveBeenCalledTimes(1);
      });
    });
  });
});
