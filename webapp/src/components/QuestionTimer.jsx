// src/components/QuestionTimer.js

import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import "./QuestionTimer.css"; 

const defaultPalette = {
  honoluluBlue: "#0077b6",
  pacificCyan: "#00b4d8",
  nonPhotoBlue: "#90e0ef",
  lightCyan: "#caf0f8",
  federalBlue: "#03045e",
};

const defaultTimerColors = [
  defaultPalette.honoluluBlue,
  defaultPalette.pacificCyan,
  defaultPalette.nonPhotoBlue,
  defaultPalette.nonPhotoBlue,
];
const defaultTrailColor = defaultPalette.lightCyan;
const defaultTextColor = defaultPalette.federalBlue; // Color para el texto del tiempo

const QuestionTimer = ({
  keyProp,
  duration,
  onComplete,
  colors = defaultTimerColors,
  trailColor = defaultTrailColor,
  textColor = defaultTextColor, 
  pauseTimer = false, 
}) => {

  const renderTime = ({ remainingTime }) => {
    if (remainingTime === 0) {
      return <div className="timer" style={{ color: textColor }}>Too late...</div>;
    }

    return (
      <div className="timer" style={{ color: textColor }}>
        <div className="value">{remainingTime}</div>
        <div className="text">seconds</div>
      </div>
    );
  };

  return (
    <div className="timer-wrapper">
      <CountdownCircleTimer
        key={keyProp}
        isPlaying={!pauseTimer} 
        duration={duration}
        strokeWidth={7}
        size={110}
        colors={colors}
        trailColor={trailColor}
        colorsTime={[duration, duration * 0.6, duration * 0.3, 0]}
        onComplete={onComplete}
      >
        {renderTime}
      </CountdownCircleTimer>
    </div>
  );
};

export default QuestionTimer;