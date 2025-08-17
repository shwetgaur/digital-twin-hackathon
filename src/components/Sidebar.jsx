import React from 'react';
import './Sidebar.css';

const Sidebar = ({ carbonScore, aiState, onToggleAI }) => {
  return (
    <div className="sidebar">
      <h1>Carbon Digital Twin</h1>
      <p>Pune, Koregaon Park</p>

      <div className="carbon-score">
        <h2>Total Carbon Footprint</h2>
        <div className="score-value">
          {carbonScore.toFixed(2)}
          <span> tons CO₂e / year</span>
        </div>
        <p className={carbonScore > 0 ? 'score-negative' : 'score-positive'}>
          {carbonScore > 0 ? 'Net Emitter' : 'Net Carbon Sink'}
        </p>
      </div>

      <div className="simulations">
        <h2>Agentic AI</h2>
        <div className="ai-status">
            <div>Budget: <strong>${aiState.budget.toLocaleString()}</strong></div>
            <div>Status: <strong>{aiState.isRunning ? 'Optimizing...' : 'Idle'}</strong></div>
            <div className="ai-plan">Plan: {aiState.plan}</div>
        </div>
        <button onClick={onToggleAI} className={`ai-button ${aiState.isRunning ? 'running' : ''}`}>
          {aiState.isRunning ? 'Stop AI Agent' : 'Start AI Agent'}
        </button>
      </div>

      <div className="legend">
        <h3>Legend</h3>
        <div><span className="legend-color high-emission"></span> High Emission Building</div>
        <div><span className="legend-color low-emission"></span> Low Emission Building</div>
        <div><span className="legend-color solar-building"></span> Solar Panels Added</div>
        <div><span className="legend-color bike-lane"></span> Bike Lane</div>
      </div>
    </div>
  );
};

export default Sidebar;