import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatisticsWindow from './StatisticsWindow';

// Mock the fetch API
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('StatisticsWindow component', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.getItem.mockReturnValue('testUser');
  });

  it('should fetch and display statistics successfully', async () => {
    // Mock the fetch response for /stats
    const mockStats = {
      username: 'testUser',
      gamesPlayed: 10,
      totalPoints: 100,
      pointsPerGame: 10.00,
      wins: 7,
      losses: 3,
      bestGames: [
        {
          id: 1,
          points: 20,
          date: '2023-10-01T00:00:00Z',
          category: 'General',
          timeTaken: 120,
          difficulty: 'Fácil',
          correctQuestions: 8,
          totalQuestions: 10,
        },
      ],
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockStats),
    });

    render(
      <MemoryRouter>
        <StatisticsWindow />
      </MemoryRouter>
    );

      screen.debug(undefined, Infinity);

    // Wait for the stats to be displayed
   expect(await screen.findByText((content, element) => 
      content.includes("Game Statistics for testUser")
    )).toBeInTheDocument();

    expect(await screen.findByText((content, element) => 
      content.includes("Games Played: 10") 
    )).toBeInTheDocument();
    
    expect(await screen.findByText((content, element) => 
      content.includes("Total Points: 100") 
    )).toBeInTheDocument();
  
  });

  it('should handle error when fetching statistics', async () => {
    // Mock the fetch response to simulate an error
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    render(
      <MemoryRouter>
        <StatisticsWindow />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error fetching stats: Network response was not ok/i)).toBeInTheDocument();
    });

    // Verify fetch was called
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should display error when no user is found', async () => {
    // Simulate no username in localStorage
    mockLocalStorage.getItem.mockReturnValueOnce(null);

    render(
      <MemoryRouter>
        <StatisticsWindow />
      </MemoryRouter>
    );

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/No user found. Please log in./i)).toBeInTheDocument();
    });

    // Verify fetch was not called
    expect(fetch).not.toHaveBeenCalled();
  });

});