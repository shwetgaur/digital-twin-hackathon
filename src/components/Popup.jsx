import React from 'react';
import './Popup.css';

// Helper to format numbers with commas
const formatNumber = (num) => num ? num.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';

const InfoPopup = ({ feature }) => {
  const { properties } = feature;

  // Function to determine the color and width for the emission gauge
  const getGaugeStyle = (emissionRate) => {
    if (!emissionRate) return { width: '0%', backgroundColor: '#555' };
    const maxEmission = 150; // Set a realistic maximum for the scale
    const percentage = (Math.min(emissionRate, maxEmission) / maxEmission) * 100;

    let color = '#00FF00'; // Green (low)
    if (emissionRate > 70) color = '#FFA500'; // Orange (medium)
    if (emissionRate > 110) color = '#FF0000'; // Red (high)

    return {
      width: `${percentage}%`,
      backgroundColor: color
    };
  };
  
  const gaugeStyle = getGaugeStyle(properties.carbon_emission);

  return (
    <div className="map-popup">
      <h3 className="popup-title">{properties.name || 'Building'}</h3>
      <hr className="popup-hr" />

      <div className="popup-row">
        <span className="popup-label">Type</span>
        <span className="popup-value">{properties.building_type || 'N/A'}</span>
      </div>
      <div className="popup-row">
        <span className="popup-label">Area</span>
        <span className="popup-value">{formatNumber(properties.area_m2)} m²</span>
      </div>
      <div className="popup-row">
        <span className="popup-label">Annual Emissions</span>
        <span className="popup-value">{Number(properties.co2e_tpy).toFixed(2)} tCO₂e</span>
      </div>

      <div className="emission-gauge">
        <span className="popup-label">Emission Intensity</span>
        <div className="gauge-bar-container">
          <div className="gauge-bar" style={gaugeStyle}></div>
        </div>
      </div>
    </div>
  );
};

export default InfoPopup;