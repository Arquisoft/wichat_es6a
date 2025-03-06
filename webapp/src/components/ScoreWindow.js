import React from "react";

export default function ScoreWindow({
  correctAnswers,
  totalQuestions,
  onRestart,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        textAlign: "center",
        background: "#f8f9fa",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
      >
        ¡Partida Finalizada!
      </h2>
      <p style={{ fontSize: "18px", marginBottom: "5px" }}>
        Has respondido correctamente:
      </p>
      <p style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "15px" }}>
        {correctAnswers} / {totalQuestions}
      </p>
      <button
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={onRestart}
      >
        Volver a jugar
      </button>
    </div>
  );
}