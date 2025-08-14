import React from 'react';

function UI({ carbonScore, aiLog, isLoading, onOptimize, areaName }) {
  return (
    <div className="ui-container">
      <div className="top-panel">
        <h1>Pune Digital Twin</h1>
        <div className="subtitle">Analyzing: {areaName}</div>
        <div className="score-card">
          <h2>Total Carbon Score</h2>
          <p className="score">{Math.round(carbonScore)}</p>
        </div>
      </div>
      <div className="bottom-panel">
        <button onClick={onOptimize} disabled={isLoading}>
          {isLoading ? 'Optimizing...' : 'Analyze & Optimize Block'}
        </button>
        <div className="log-panel">
          <h3>AI Decision Log:</h3>
          <p>{aiLog}</p>
        </div>
      </div>
    </div>
  );
}

export default UI;