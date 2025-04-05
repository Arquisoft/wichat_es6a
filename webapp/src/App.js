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
import GameWindow from "./components/GameWindow";
import Statistics from "./components/StatisticsWindow";
import EndGame from "./components/EndGameWindow";
import GameOptions from "./components/GameOptions";
import AllQuestionsWindow from "./components/AllQuestionsWindow";
import Navbar from "./components/Navbar"; // Agregar Navbar

function App() {
  return (
    <Router>
      <CssBaseline />
      <Navbar /> {/* Renderiza el Navbar en todas las rutas */}
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/game" element={<GameWindow />} />
        <Route path="/game-options" element={<GameOptions />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/endgame" element={<EndGame />} />{" "}
        {/* Cambié a minúsculas por convención */}
        <Route path="/ranking" element={<div>Ranking Page (TBD)</div>} />{" "}
        <Route path="/questions" element={<AllQuestionsWindow />} />
        {/* Placeholder para Ranking */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
