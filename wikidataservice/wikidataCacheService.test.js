jest.mock("./wikidataQueries");
jest.mock("./models/wikidata-entry-model");
jest.mock("./wikidataConnection", () => ({ consulta: jest.fn() }));

const service = require("./wikidataCacheService");
const WikiQueries = require("./wikidataQueries");
const WikidataEntry = require("./models/wikidata-entry-model");

describe("WikidataCacheService", () => {
  let countMock, aggregateMock, findMock, findOneMock, saveMock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Preparamos mocks para los métodos estáticos del modelo
    countMock = jest.fn();
    aggregateMock = jest.fn();
    findMock = jest.fn();
    findOneMock = jest
      .fn()
      .mockReturnValue({ skip: () => Promise.resolve({ _id: "entry" }) });
    saveMock = jest.fn().mockResolvedValue({});

    // Reemplazamos constructor y métodos
    WikidataEntry.mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = saveMock;
    });
    WikidataEntry.countDocuments = countMock;
    WikidataEntry.aggregate = aggregateMock;
    WikidataEntry.find = findMock;
    WikidataEntry.findOne = findOneMock;
  });

  describe("getCategoryQueryFunction", () => {
    it("devuelve la función adecuada o undefined", () => {
      expect(service.getCategoryQueryFunction("paises")).toBe(
        WikiQueries.obtenerPaisYCapital
      );
      expect(service.getCategoryQueryFunction("monumentos")).toBe(
        WikiQueries.obtenerMonumentoYPais
      );
      expect(service.getCategoryQueryFunction("invalid")).toBeUndefined();
    });
  });

  describe("fetchAndSaveEntries", () => {
    it("retorna [] si WikiQueries no devuelve nada", async () => {
      WikiQueries.obtenerPaisYCapital.mockResolvedValue([]);
      const result = await service.fetchAndSaveEntries("paises", 5);
      expect(result).toEqual([]);
      expect(saveMock).not.toHaveBeenCalled();
    });

    it("almacena sólo hasta `count` items con imagen", async () => {
      const raw = [
        { image: "url1", countryLabel: "A", capitalLabel: "B" },
        { image: "", countryLabel: "X", capitalLabel: "Y" },
        { image: "url2", countryLabel: "C", capitalLabel: "D" },
      ];
      WikiQueries.obtenerPaisYCapital.mockResolvedValue(raw);

      const result = await service.fetchAndSaveEntries("paises", 2);

      // Debe intentar guardar dos veces (las que tienen imagen)
      expect(saveMock).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].countryLabel).toBe("A");
      expect(result[1].capitalLabel).toBe("D");
    });

    it("retorna [] para categoría inválida", async () => {
      // Si no existe función de query, debería devolver []
      const result = await service.fetchAndSaveEntries("foo", 3);
      expect(result).toEqual([]);
    });

    it("continúa si hay error de duplicado (code 11000)", async () => {
      const raw = [
        { image: "u", countryLabel: "X", capitalLabel: "Y" },
        { image: "v", countryLabel: "Z", capitalLabel: "W" },
      ];
      WikiQueries.obtenerPaisYCapital.mockResolvedValue(raw);
      // Primer save OK, segundo falla con duplicado
      saveMock.mockResolvedValueOnce({}).mockRejectedValueOnce({ code: 11000 });

      const result = await service.fetchAndSaveEntries("paises", 2);
      expect(saveMock).toHaveBeenCalledTimes(2);
      // Sólo guardó con éxito la primera
      expect(result).toHaveLength(1);
      expect(result[0].countryLabel).toBe("X");
    });
  });

  describe("getEntriesForCategory", () => {
    it("usa aggregate cuando hay suficientes en caché", async () => {
      countMock.mockResolvedValue(3);
      const sample = [{}, {}];
      aggregateMock.mockResolvedValue(sample);

      const entries = await service.getEntriesForCategory("paises", 2);
      expect(aggregateMock).toHaveBeenCalledWith([
        { $match: { category: "paises" } },
        { $sample: { size: 2 } },
      ]);
      expect(entries).toBe(sample);
    });

    it("también usa aggregate cuando piden count = 0", async () => {
      countMock.mockResolvedValue(0);
      const sample = [{}, {}, {}];
      aggregateMock.mockResolvedValue(sample);

      const entries = await service.getEntriesForCategory("monumentos", 0);
      expect(aggregateMock).toHaveBeenCalled();
      expect(entries).toBe(sample);
    });

    it("combina existentes y nuevas si cache baja", async () => {
      countMock.mockResolvedValue(1);
      findMock.mockResolvedValue([{ _id: 1 }]);
      jest
        .spyOn(service, "fetchAndSaveEntries")
        .mockResolvedValue([{ _id: 2 }, { _id: 3 }]);

      const entries = await service.getEntriesForCategory("paises", 3);
      // Needed 2 extras
      expect(service.fetchAndSaveEntries).toHaveBeenCalledWith("paises", 2);
      expect(entries).toHaveLength(3);
    });

    it("retorna [] si falla internamente", async () => {
      countMock.mockRejectedValue(new Error("boom"));
      const entries = await service.getEntriesForCategory("paises", 1);
      expect(entries).toEqual([]);
    });
  });

  describe("getRandomEntry", () => {
    it("retorna una entrada si hay cache", async () => {
      countMock.mockResolvedValue(4);
      findOneMock.mockReturnValue({ skip: () => Promise.resolve({ id: "e" }) });

      const entry = await service.getRandomEntry();
      expect(entry).toEqual({ id: "e" });
    });

    it("fetchAndSaveEntries + retorna si cache vacío inicialmente", async () => {
      countMock
        .mockResolvedValueOnce(0) // primera cuenta
        .mockResolvedValueOnce(5); // segunda cuenta tras fetch
      jest.spyOn(service, "fetchAndSaveEntries").mockResolvedValue([]);
      findOneMock.mockReturnValue({
        skip: () => Promise.resolve({ id: "new" }),
      });

      const entry = await service.getRandomEntry();
      expect(service.fetchAndSaveEntries).toHaveBeenCalledWith(
        expect.any(String),
        service.minEntriesPerCategory
      );
      expect(entry).toEqual({ id: "new" });
    });

    it("retorna null si sigue sin datos tras fetch", async () => {
      countMock.mockResolvedValue(0);
      jest.spyOn(service, "fetchAndSaveEntries").mockResolvedValue([]);
      const entry = await service.getRandomEntry();
      expect(entry).toBeNull();
    });

    it("retorna null si hay error", async () => {
      countMock.mockRejectedValue(new Error("uh-oh"));
      const entry = await service.getRandomEntry();
      expect(entry).toBeNull();
    });
  });

  describe("isDatabaseInitialized", () => {
    it("true si todas las categorías por encima del umbral", async () => {
      countMock.mockResolvedValue(500);
      const ok = await service.isDatabaseInitialized();
      expect(ok).toBe(true);
    });

    it("false si alguna categoría está por debajo", async () => {
      // El primero falla
      countMock.mockResolvedValueOnce(10);
      const ok = await service.isDatabaseInitialized();
      expect(ok).toBe(false);
    });
  });

  describe("initializeDatabase", () => {
    it("solamente rellena las categorías que faltan", async () => {
      // Primer count < minEntriesPerCategory, resto > minEntriesPerCategory
      const counts = [400, 600, 600, 600, 600, 600, 600];
      counts.forEach((c) => countMock.mockResolvedValueOnce(c));

      jest.spyOn(service, "fetchAndSaveEntries").mockResolvedValue([]);
      await service.initializeDatabase();

      expect(service.fetchAndSaveEntries).toHaveBeenCalledTimes(1);
      expect(service.fetchAndSaveEntries).toHaveBeenCalledWith("paises", 100);
    });

    it("no llama a fetchAndSaveEntries si todo está lleno", async () => {
      // Todos > umbral
      for (let i = 0; i < service.categories.length; i++) {
        countMock.mockResolvedValue(service.minEntriesPerCategory);
      }
      jest.spyOn(service, "fetchAndSaveEntries").mockResolvedValue([]);
      await service.initializeDatabase();
      expect(service.fetchAndSaveEntries).not.toHaveBeenCalled();
    });
  });
});
