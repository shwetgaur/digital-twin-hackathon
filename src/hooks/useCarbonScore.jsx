import React, { useState } from 'react';

export const useCarbonScore = (carbonScore) => {
  const [isCarbonDetailsVisible, setIsCarbonDetailsVisible] = useState(false);

  const toggleCarbonDetails = () => {
    setIsCarbonDetailsVisible(prev => !prev);
  };

  const CarbonScorePanel = () => (
    <div className={`panel carbon-panel`}>
      <div className="score-card">
        <div className="score-header">
          <h3 className="carbon-title">Area Carbon Score</h3>
          <span onClick={toggleCarbonDetails} className="more-link">
            more
            <svg
              className={`more-arrow ${isCarbonDetailsVisible ? 'rotated' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <p className="score">{Math.round(carbonScore)}</p>
      </div>

      <div
        className={`carbon-details-container ${
          isCarbonDetailsVisible ? 'expanded' : ''
        }`}
      >
        <div className="carbon-details">
          <div className="legend-item">
            <span className="dot buildings"></span> Buildings
          </div>
          <div className="legend-item">
            <span className="dot traffic"></span> Traffic
          </div>
          <div className="legend-item">
            <span className="dot trees"></span> Trees
          </div>
        </div>
      </div>
    </div>
  );

  return { CarbonScorePanel };
};
