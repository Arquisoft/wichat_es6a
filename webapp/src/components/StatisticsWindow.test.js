import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import StatisticsWindow from "./StatisticsWindow";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Ensure fetch is always a jest mock
global.fetch = jest.fn();

const baseStats = {
  username: "testUser",
  gamesPlayed: 1,
  totalPoints: 50,
  pointsPerGame: 50,
  wins: 1,
  losses: 0,
  bestGames: [
    {
      id: 1,
      points: 50,
      date: "2023-01-01T00:00:00Z",
      category: "Cat",
      timeTaken: 30,
      difficulty: "Fácil",
      correctQuestions: 5,
      totalQuestions: 5,
    },
  ],
};

describe("StatisticsWindow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("testUser");
    global.fetch.mockImplementation((url) => {
      if (url.endsWith("/stats")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(baseStats),
        });
      }
      if (url.endsWith("/getAllGames")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(baseStats.bestGames),
        });
      }
      if (url.endsWith("/getBestGames")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(baseStats.bestGames),
        });
      }
      return Promise.reject(new Error("Unknown endpoint: " + url));
    });
  });

  const renderStatisticsWindow = () =>
    render(<StatisticsWindow />, { wrapper: MemoryRouter });

  describe("Carga inicial", () => {
    it("muestra spinner y luego estadísticas correctamente", async () => {
      renderStatisticsWindow();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();

      expect(
        await screen.findByText(/Game Statistics for testUser/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Games Played: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Points: 50/i)).toBeInTheDocument();
      expect(screen.getByText(/Game 1/i)).toBeInTheDocument();
    });

    it("renderiza 20 partículas", async () => {
      renderStatisticsWindow();
      await screen.findByText(/Game Statistics for testUser/i);
      const particles = document.querySelectorAll(".particle");
      expect(particles.length).toBe(20);
    });
  });

  describe("Manejo de errores", () => {
    it("gestiona fallo inicial y retry re-renderizando el componente", async () => {
      // 1ª llamada a /stats falla, 2ª llamada devuelve datos actualizados
      global.fetch
        .mockImplementationOnce(() =>
          Promise.resolve({ ok: false, statusText: "Fail" })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                ...baseStats,
                gamesPlayed: 2,
              }),
          })
        );

      // Primer render -> muestra error
      renderStatisticsWindow();
      expect(await screen.findByRole("alert")).toHaveTextContent(
        /Error fetching stats/i
      );

      // Segundo render -> muestra datos actualizados
      renderStatisticsWindow();
      expect(await screen.findByText(/Games Played: 2/i)).toBeInTheDocument();
    });

    it("muestra error cuando Show More sin usuario", async () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce("testUser")
        .mockReturnValueOnce(null);

      renderStatisticsWindow();
      await screen.findByText(/Game Statistics for testUser/i);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /Show More/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /You are not logged in/i
      );
    });
  });

  describe("Navegación y UI extra", () => {
    it("navega atrás con el Back button", async () => {
      renderStatisticsWindow();
      await screen.findByText(/Game Statistics for testUser/i);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /Back/i }));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("toggle Show More / Show Less muestra más juegos y vuelve atrás", async () => {
      // Redefine fetch para diferenciar endpoints
      global.fetch.mockImplementation((url) => {
        if (url.endsWith("/stats")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(baseStats),
          });
        }
        if (url.endsWith("/getAllGames")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                ...baseStats.bestGames,
                {
                  id: 2,
                  points: 30,
                  date: null,
                  category: "",
                  timeTaken: 0,
                  difficulty: "Medio",
                  correctQuestions: 3,
                  totalQuestions: 5,
                },
              ]),
          });
        }
        if (url.endsWith("/getBestGames")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(baseStats.bestGames),
          });
        }
        return Promise.reject(new Error("Unknown endpoint: " + url));
      });

      renderStatisticsWindow();
      expect(await screen.findByText(/Game 1/i)).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /Show More/i }));
      expect(await screen.findByText(/Game 2/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Show Less/i }));
      const game1Cards = await screen.findAllByText(/Game 1/i);
      expect(game1Cards.length).toBe(1);
    });
  });
});
;

