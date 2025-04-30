// wikidataQueries.test.js
jest.mock("./wikidataConnection", () => ({
  consulta: jest.fn(),
}));

const { consulta } = require("./wikidataConnection");
const WikiQueries = require("./wikidataQueries");

describe("WikiQueries static methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("obtenerPaisYCapital llama a consulta con el query correcto", async () => {
    consulta.mockResolvedValue([
      { countryLabel: "A", capitalLabel: "B", image: "img" },
    ]);
    const result = await WikiQueries.obtenerPaisYCapital();
    expect(consulta).toHaveBeenCalledTimes(1);
    const query = consulta.mock.calls[0][0];
    expect(query).toContain("SELECT ?countryLabel ?capitalLabel ?image");
    expect(query).toContain("OPTIONAL { ?capital wdt:P18 ?image");
    expect(result).toEqual([
      { countryLabel: "A", capitalLabel: "B", image: "img" },
    ]);
  });

  it("obtenerMonumentoYPais llama a consulta con el query correcto", async () => {
    consulta.mockResolvedValue([
      { monumentLabel: "M", countryLabel: "C", image: "img2" },
    ]);
    const result = await WikiQueries.obtenerMonumentoYPais();
    expect(consulta).toHaveBeenCalledTimes(1);
    const query = consulta.mock.calls[0][0];
    expect(query).toContain("SELECT ?monumentLabel ?countryLabel ?image");
    expect(query).toContain("OPTIONAL { ?monument wdt:P18 ?image");
    expect(result).toEqual([
      { monumentLabel: "M", countryLabel: "C", image: "img2" },
    ]);
  });

  it("obtenerSimboloQuimico llama a consulta con el query correcto", async () => {
    consulta.mockResolvedValue([
      { elementLabel: "E", symbol: "S", image: "img3" },
    ]);
    const result = await WikiQueries.obtenerSimboloQuimico();
    expect(consulta).toHaveBeenCalledTimes(1);
    const query = consulta.mock.calls[0][0];
    expect(query).toContain("SELECT ?elementLabel ?symbol ?image");
    expect(query).toContain("OPTIONAL { ?element wdt:P18 ?image");
    expect(result).toEqual([{ elementLabel: "E", symbol: "S", image: "img3" }]);
  });

  it("obtenerPeliculaYDirector llama a consulta con el query correcto", async () => {
    consulta.mockResolvedValue([
      { peliculaLabel: "P", directorLabel: "D", image: "img4" },
    ]);
    const result = await WikiQueries.obtenerPeliculaYDirector();
    expect(consulta).toHaveBeenCalledTimes(1);
    const query = consulta.mock.calls[0][0];
    expect(query).toContain("SELECT ?peliculaLabel ?directorLabel ?image");
    expect(query).toContain("OPTIONAL { ?pelicula wdt:P18 ?image");
    expect(result).toEqual([
      { peliculaLabel: "P", directorLabel: "D", image: "img4" },
    ]);
  });

  it("obtenerCancionYArtista llama a consulta con el query correcto", async () => {
    consulta.mockResolvedValue([
      { songLabel: "Sg", artistLabel: "Ar", image: "img5" },
    ]);
    const result = await WikiQueries.obtenerCancionYArtista();
    expect(consulta).toHaveBeenCalledTimes(1);
    const query = consulta.mock.calls[0][0];
    expect(query).toContain("SELECT ?songLabel ?artistLabel ?image");
    expect(query).toContain("OPTIONAL { ?song wdt:P18 ?image");
    expect(result).toEqual([
      { songLabel: "Sg", artistLabel: "Ar", image: "img5" },
    ]);
  });

  it("obtenerAñoYGanadorF1 llama a consulta con el query correcto", async () => {
    consulta.mockResolvedValue([
      { year: 2021, winnerLabel: "W", image: "img6" },
    ]);
    const result = await WikiQueries.obtenerAñoYGanadorF1();
    expect(consulta).toHaveBeenCalledTimes(1);
    const query = consulta.mock.calls[0][0];
    expect(query).toContain("SELECT ?year ?winnerLabel ?image");
    expect(query).toContain("OPTIONAL { ?event wdt:P18 ?image");
    expect(result).toEqual([{ year: 2021, winnerLabel: "W", image: "img6" }]);
  });

  it("obtenerPintorYObras llama a consulta con el query correcto", async () => {
    consulta.mockResolvedValue([
      { paintingLabel: "Pt", artistLabel: "Ar", image: "img7" },
    ]);
    const result = await WikiQueries.obtenerPintorYObras();
    expect(consulta).toHaveBeenCalledTimes(1);
    const query = consulta.mock.calls[0][0];
    expect(query).toContain("SELECT ?paintingLabel ?artistLabel ?image");
    expect(query).toContain("OPTIONAL { ?painting wdt:P18 ?image");
    expect(result).toEqual([
      { paintingLabel: "Pt", artistLabel: "Ar", image: "img7" },
    ]);
  });
});
