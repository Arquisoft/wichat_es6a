import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./components/Auth";
import Home from "./components/home";
import CssBaseline from "@mui/material/CssBaseline";
import GameWindow  from "./components/GameWindow";
import Statistics from "./components/StatisticsWindow";
import EndGame from "./components/EndGameWindow";
import Container from "@mui/material/Container";

function App() {
  return (
    <Router>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/game" element={<GameWindow  />} />
        <Route path="/statistics" element={<Statistics/>} />
        <Route path="/endGame" element={<EndGame/>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
