import React from 'react';

function UI({ carbonScore, aiLog, isLoading, onOptimize }) {
  return (
    <div className="ui-container">
      <div className="top-panel">
        <h1>Digital Twin Carbon Monitor</h1>
        <div className="score-card">
          <h2>Total Carbon Score</h2>
          <p className="score">{Math.round(carbonScore)}</p>
        </div>
      </div>
      <div className="bottom-panel">
        <button onClick={onOptimize} disabled={isLoading}>
          {isLoading ? 'Optimizing...' : 'Optimize Block'}
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