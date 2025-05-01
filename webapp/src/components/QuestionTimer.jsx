import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import "./QuestionTimer.css";

const QuestionTimer = ({ keyProp, duration, onComplete }) => { //NOSONAR
  const renderTime = ({ remainingTime }) => {
    

    return (
      <div className="timer">
        <div className="value">{remainingTime}</div>
        <div className="text">seconds</div>
      </div>
    );
  };

  return (
    <div className="timer-wrapper">
      <CountdownCircleTimer
        key={keyProp}
        isPlaying
        duration={duration}
        strokeWidth={7}
        size={110}
        colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
        colorsTime={[duration, duration * 0.6, duration * 0.3, 0]}
        onComplete={onComplete}
        trailColor="#d6d6d6"
      >
        {renderTime}
      </CountdownCircleTimer>
    </div>
  );
};

export default QuestionTimer;