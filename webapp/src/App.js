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
import Navbar from "./components/Navbar"; 
import EditProfile from "./components/editProfileWindow";
import AllQuestionsWindow from "./components/AllQuestionsWindow";

function App() {
  return (
    <Router>
      <CssBaseline />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/game" element={<GameWindow />} />
        <Route path="/game-options" element={<GameOptions />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/editProfile" element={<EditProfile />} />
        <Route path="/endgame" element={<EndGame />} />{" "}
        <Route path="/questions" element={<AllQuestionsWindow />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
