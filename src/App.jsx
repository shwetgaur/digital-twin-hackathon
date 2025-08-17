import React, { useState, useEffect } from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

// Import Mapbox Draw for the drawing tools
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { useMapSetup } from './hooks/useMapSetup';
import { useMapInteractions } from './hooks/useMapInteractions';
import { useSearch } from './hooks/useSearch';
import { useAIAnalysis } from './hooks/useAIAnalysis';
import { useCarbonScore } from './hooks/useCarbonScore';

function App() {
  const [map, setMap] = useState(null);
  const [draw, setDraw] = useState(null);
  const [currentArea, setCurrentArea] = useState('Loading…');
  const [carbonScore, setCarbonScore] = useState(0);
  const [aiLog, setAiLog] = useState("Click 'Select Area' to draw a zone, or click on the map for a default block.");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [analysisZone, setAnalysisZone] = useState(null);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [isSelectAreaExpanded, setIsSelectAreaExpanded] = useState(false);
  const [polygonCount, setPolygonCount] = useState(0);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

  const { onMapLoad } = useMapSetup(MAPTILER_API_KEY, setCurrentArea);
  const { handleMapClick, goToCoords, enterSelectionMode } = useMapInteractions(
    map,
    setAnalysisZone,
    setAiLog
  );
  const {
    searchTerm,
    suggestions,
    activeIndex,
    suggestionsRef,
    showSuggestions,
    handleChange,
    handleKeyDown,
    selectPlace,
    handleGoClick,
  } = useSearch(({ lat, lon, name }) => {
    goToCoords(lon, lat);
    console.log("Selected location:", name);
  });
  const { handleAnalyzeArea } = useAIAnalysis(
    map,
    currentArea,
    analysisZone,
    setCarbonScore,
    setAiLog,
    setIsLoadingAI
  );
  const { CarbonScorePanel } = useCarbonScore(carbonScore);

  // Effect to initialize and manage the drawing tool
  useEffect(() => {
    if (map && !draw) {
      const drawInstance = new MapboxDraw({
        displayControlsDefault: false, // We use our own custom controls
        // Custom styles for drawn polygons
        styles: [
          // INACTIVE (default) state - Almost opaque dark blue
          {
            'id': 'gl-draw-polygon-fill-inactive',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            'paint': {
              'fill-color': 'rgba(0, 0, 139, 0.8)', // Dark Blue with high opacity
              'fill-outline-color': '#00008B',
            }
          },
           // ACTIVE (being drawn or edited) state - Darker translucent orange
          {
            'id': 'gl-draw-polygon-fill-active',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'paint': {
              'fill-color': 'rgba(204, 102, 0, 0.6)', // Darker translucent orange
              'fill-outline-color': '#CC6600',
            }
          },
          // Polygon stroke
          {
            'id': 'gl-draw-polygon-stroke-active',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'layout': { 'line-cap': 'round', 'line-join': 'round' },
            'paint': { 'line-color': '#CC6600', 'line-width': 2 }
          },
        ]
      });
      map.addControl(drawInstance, 'top-right');
      setDraw(drawInstance);

      // Listen to draw events to update the analysis zone
      const updateArea = (e) => {
        const data = drawInstance.getAll();
        setPolygonCount(data.features.length);
        if (data.features.length > 0) {
          // Use the last drawn feature as the analysis zone
          setAnalysisZone(data.features[data.features.length - 1]);
           setAiLog("Custom area selected. Ready to analyze.");
        } else {
          setAnalysisZone(null);
        }
      };

      map.on('draw.create', updateArea);
      map.on('draw.delete', updateArea);
      map.on('draw.update', updateArea);
    }
    // Cleanup function to remove the control when the component unmounts
    return () => {
      if (map && draw) {
        map.removeControl(draw);
      }
    };
  }, [map, draw]);
  
  // Centralized map click handler
  const onMapClick = (e) => {
    // If in delete mode, attempt to delete a feature
    if (isDeleteMode && draw) {
      const featureIds = draw.getFeatureIdsAt(e.point);
      if (featureIds.length > 0) {
        draw.delete(featureIds); // Delete the clicked feature(s)
      }
      setIsDeleteMode(false); // Always exit delete mode after a click
      return; // Stop further actions
    }

    // If the draw panel is open or drawing is active, do nothing (let mapbox-gl-draw handle it)
    if (isSelectAreaExpanded || (draw && draw.getMode() !== 'simple_select')) {
      return;
    }
    
    // Otherwise, perform the default action of creating a small square
    handleMapClick(e);
  };


  const handleAnalysisButtonClick = () => {
    handleAnalyzeArea();
    setIsLogVisible(true);
    setIsSelectAreaExpanded(false); // Collapse the selection panel after analyzing
  };

  const handleSelectAreaClick = () => {
    const willExpand = !isSelectAreaExpanded;
    setIsSelectAreaExpanded(willExpand);
    if (willExpand) {
      enterSelectionMode(); // Pan camera to top-down view
    } else {
        setIsDeleteMode(false); // Ensure delete mode is off when collapsing
    }
    setIsLogVisible(false); // Hide the log when opening the selection panel
  };
  
  const setDrawMode = (mode) => {
    if (draw) {
      draw.changeMode(mode);
    }
  };

  const clearAllShapes = () => {
    if (draw) {
      draw.deleteAll();
      setAnalysisZone(null);
    }
  };
  
  const toggleDeleteMode = () => {
    setIsDeleteMode(prev => !prev);
  };

  const deleteSinglePolygon = () => {
    if (draw && polygonCount > 0) {
        const data = draw.getAll();
        if(data.features.length > 0) {
            draw.delete(data.features[0].id);
        }
    }
  };

  return (
    <div className="App">
      <div className="hud-container">
        <div className="panel search-panel">
          <div className="title">Pune Digital Twin</div>
          <div className="subtitle">Exploring: {currentArea}</div>
          <div className="search-container" ref={suggestionsRef}>
            <input
              className="search-input"
              type="text"
              placeholder="Enter a destination..."
              value={searchTerm}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            <button className="go-button" onClick={handleGoClick} aria-label="Go">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestions" role="listbox">
                {suggestions.map((s, idx) => (
                  <li
                    key={s.place_id}
                    role="option"
                    aria-selected={idx === activeIndex}
                    className={`suggestion ${idx === activeIndex ? 'active' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); selectPlace(s); }}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={`lower-panels ${showSuggestions && suggestions.length > 0 ? 'shifted-down' : ''}`}>
          <CarbonScorePanel />

          <div className={`panel ai-analysis-panel ${isSelectAreaExpanded || isLogVisible ? 'expanded' : ''}`}>
            <div className="analysis-buttons">
              <button onClick={handleSelectAreaClick} className="select-area-button">
                Select Area
              </button>
              <button
                onClick={handleAnalysisButtonClick}
                disabled={isLoadingAI || !analysisZone}
                className="analyze-button"
              >
                {isLoadingAI ? 'Analyzing...' : 'Analyze & Optimize Area'}
              </button>
            </div>
            
            {isSelectAreaExpanded && (
              <div className="draw-toolbar">
                <button title="Draw Polygon" className="polygon-btn" onClick={() => setDrawMode('draw_polygon')}>
                    <svg className="polygon-icon" viewBox="0 0 20 20" width="24" height="24">
                        <path d="M10 3 L17 17 L3 17 Z" />
                    </svg>
                </button>

                <div className={`clear-buttons-wrapper ${polygonCount > 1 ? 'split' : ''}`}>
                    <button
                        title="Clear All Polygons"
                        onClick={clearAllShapes}
                        className="clear-all-btn"
                    >
                        Clear All
                    </button>
                    <button
                        title={polygonCount > 1 ? "Delete a Polygon" : "Delete Polygon"}
                        onClick={polygonCount > 1 ? toggleDeleteMode : deleteSinglePolygon}
                        className={`clear-btn ${isDeleteMode ? 'active-button' : ''}`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
              </div>
            )}
            
            {isLogVisible && (
               <div className="log-panel">
                <h4>AI Decision Log:</h4>
                <p>{aiLog}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="map-wrap">
        <Map
          mapLib={maplibregl}
          initialViewState={{
            longitude: 73.8567,
            latitude: 18.5204,
            zoom: 15,
            pitch: 60,
            bearing: -20
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={`https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_API_KEY}`}
          onLoad={(evt) => onMapLoad(evt, setMap)}
          onClick={onMapClick}
          antialias
        />
      </div>
    </div>
  );
}

export default App;
