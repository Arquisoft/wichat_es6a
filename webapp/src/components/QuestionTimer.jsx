import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

const QuestionTimer = ({ keyProp, duration, onComplete }) => {
  return (
    <CountdownCircleTimer
      key={keyProp} // reinicia el temporizador al cambiar la pregunta
      isPlaying
      duration={duration}
      size={100}
      strokeWidth={10}
      colors={[["#1976d2", 0.33], ["#F7B801", 0.33], ["#A30000", 0.33]]}
      onComplete={onComplete}
    >
      {({ remainingTime }) => <div style={{ fontSize: 20 }}>{remainingTime}</div>}
    </CountdownCircleTimer>
  );
};

export default QuestionTimer;
