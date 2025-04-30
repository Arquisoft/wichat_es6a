import React from "react";
import { render, screen } from "@testing-library/react";
import QuestionTimer from "./QuestionTimer";

// Mock react-countdown-circle-timer to control behavior
jest.mock("react-countdown-circle-timer", () => ({
  CountdownCircleTimer: ({ duration, onComplete, children }) => {
    // Simulate immediate completion
    if (typeof onComplete === "function") {
      onComplete();
    }
    // Render the timer view with full duration remaining
    return (
      <div data-testid="timer-wrapper">
        {children({ remainingTime: duration })}
      </div>
    );
  },
}));

describe("QuestionTimer Component", () => {
  it("renders the remaining time and label correctly", () => {
    render(
      <QuestionTimer keyProp="timer1" duration={7} onComplete={() => {}} />
    );
    // The mock passes remainingTime = duration
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/seconds/i)).toBeInTheDocument();
  });

  it("calls onComplete callback once when mounted", () => {
    const onCompleteMock = jest.fn();
    render(
      <QuestionTimer
        keyProp="timer2"
        duration={5}
        onComplete={onCompleteMock}
      />
    );
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it("resets and calls onComplete again when keyProp changes", () => {
    const onCompleteMock = jest.fn();
    const { rerender } = render(
      <QuestionTimer keyProp="first" duration={3} onComplete={onCompleteMock} />
    );
    expect(onCompleteMock).toHaveBeenCalledTimes(1);

    // Rerender with new keyProp simulating reset
    rerender(
      <QuestionTimer
        keyProp="second"
        duration={3}
        onComplete={onCompleteMock}
      />
    );
    expect(onCompleteMock).toHaveBeenCalledTimes(2);
  });
});
