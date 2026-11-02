// src/Components/LoadingState/LoadingState.jsx
import React from "react";
import "./LoadingState.css";

export default function LoadingState({
  title = "กำลังโหลดข้อมูล",
  message = "ระบบกำลังเตรียมข้อมูล กรุณารอสักครู่",
  fullPage = false,
  minHeight,
}) {
  const content = (
    <div
      className={`unified-loading-state ${
        fullPage ? "unified-loading-state--full" : ""
      }`}
      style={minHeight ? { minHeight } : undefined}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="unified-loading-spinner-wrap">
        <div className="unified-loading-spinner" />
        <div className="unified-loading-pulse-dot" />
      </div>

      <h2 className="unified-loading-title">{title}</h2>
      {message && <p className="unified-loading-message">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <main className="unified-loading-page">
        <div className="unified-loading-container">{content}</div>
      </main>
    );
  }

  return content;
}
