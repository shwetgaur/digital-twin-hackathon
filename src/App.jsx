import React, { useState, useRef, useEffect } from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';
import { getAIDecision } from './lib/watsonx.js';
import { applyIntervention } from './lib/simulation.js';

// --- MapComponent: Renders the interactive map ---
const MapComponent = ({ setCurrentArea, onMapReady, onMapClick }) => {
  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
  const mapStyleUrl = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_API_KEY}`;

  const onMapLoad = (evt) => {
    const map = evt.target;
    if (onMapReady) {
      onMapReady(map);
    }

    const initialCenter = map.getCenter();
    fetchAreaName(initialCenter.lng, initialCenter.lat);

    map.on('moveend', () => {
      const { lng, lat } = map.getCenter();
      fetchAreaName(lng, lat);
    });

    const setupLayers = () => {
      if (map.getSource('analysis-zone-source')) return; // Layers already added

      map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.5 });
      
      // Add 3D buildings layer
      map.addLayer({
        id: '3d-buildings',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#2D9CDB',
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 10], 4],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.8,
        },
      });

      // Add source and layer for the user's selection box
      map.addSource('analysis-zone-source', { type: 'geojson', data: null });
      map.addLayer({
        id: 'analysis-zone-layer',
        type: 'fill',
        source: 'analysis-zone-source',
        paint: { 'fill-color': '#007bff', 'fill-opacity': 0.2, 'fill-outline-color': '#007bff' },
      });
    };
    
    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.on('styledata', setupLayers);
    }
  };
  
  const fetchAreaName = async (lng, lat) => {
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}`);
      const data = await res.json();
      if (data?.features?.length) {
        const f = data.features.find(x => x.place_type.includes('neighbourhood')) || data.features.find(x => x.place_type.includes('locality')) || data.features[0];
        setCurrentArea(f.text || f.place_name || '—');
      }
    } catch (e) {
      console.error('Area name error:', e);
    }
  };

  return (
    <Map
      mapLib={maplibregl}
      initialViewState={{ longitude: 73.8567, latitude: 18.5204, zoom: 15, pitch: 60, bearing: -20 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyleUrl}
      onLoad={onMapLoad}
      onClick={onMapClick}
      antialias
    />
  );
};

// --- Main App Component ---
function App() {
  const [map, setMap] = useState(null);
  const [currentArea, setCurrentArea] = useState('Loading…');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [carbonScore, setCarbonScore] = useState(0);
  const [aiLog, setAiLog] = useState("Click on the map to select a block to analyze.");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [analysisZone, setAnalysisZone] = useState(null);
  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

  useEffect(() => {
    if (map && analysisZone) {
      const source = map.getSource('analysis-zone-source');
      if (source) {
        source.setData(analysisZone);
      }
    }
  }, [analysisZone, map]);

  const handleMapClick = (evt) => {
    const { lng, lat } = evt.lngLat;
    const size = 0.0005; // A smaller, more precise block size
    const square = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lng - size, lat - size], [lng + size, lat - size],
          [lng + size, lat + size], [lng - size, lat + size],
          [lng - size, lat - size]
        ]]
      }
    };
    setAnalysisZone(square);
    setAiLog("Analysis zone selected. Click 'Analyze & Optimize Area' to proceed.");
    // Reset building colors when a new zone is selected
    if (map) {
        map.setPaintProperty('3d-buildings', 'fill-extrusion-color', '#2D9CDB');
    }
  };

  const handleAnalyzeArea = async () => {
    if (!map || !analysisZone) {
      setAiLog("Please click on the map to select an area to analyze first.");
      return;
    }
    setIsLoadingAI(true);
    setAiLog("Analyzing buildings in the selected zone...");

    const features = map.querySourceFeatures('openmaptiles', {
      sourceLayer: 'building',
      filter: ['within', analysisZone.geometry]
    });

    if (features.length === 0) {
      setAiLog("No buildings found in the selected zone. Try zooming in further or selecting a different area.");
      setIsLoadingAI(false);
      return;
    }
    
    let initialCarbon = 0;
    const cityElements = features.map((feature, index) => {
      const buildingHeight = feature.properties.render_height || 20;
      const carbonOutput = buildingHeight * 50;
      initialCarbon += carbonOutput;
      feature.id = feature.properties.id || index + 1; // Use real ID if available, otherwise assign temporary one
      return {
        id: feature.id, type: 'building', carbon_output: carbonOutput,
        attributes: { has_solar: false }
      };
    });

    const cityDataForAI = {
      city_block_id: currentArea, current_total_carbon: initialCarbon,
      elements: cityElements
    };
    
    setCarbonScore(initialCarbon);
    setAiLog("Data sent to WatsonX AI for optimization...");

    const decision = await getAIDecision(cityDataForAI);

    if (decision && decision.action) {
      setAiLog(`AI decided to: ${decision.action} on building ID ${decision.target_id}.`);
      const newCityState = applyIntervention(cityDataForAI, decision);
      setCarbonScore(newCityState.current_total_carbon);
      
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'case',
        ['==', ['id'], decision.target_id], '#FFD700', // Gold
        '#2D9CDB' // Default Blue
      ]);

    } else {
      setAiLog("Error contacting AI. Check console (F12) for details.");
    }
    
    setIsLoadingAI(false);
  };

  const goToCoords = (lng, lat) => {
    if (!map) return;
    setSuggestions([]);
    setActiveIndex(-1);
    map.flyTo({ center: [lng, lat], zoom: 17, pitch: 60, duration: 5000 });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      setQuery(suggestions[activeIndex].name);
      const [lng, lat] = suggestions[activeIndex].center;
      goToCoords(lng, lat);
      return;
    }
    if (!query.trim()) return;
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_API_KEY}&types=place,locality,neighbourhood&language=en`);
      const data = await res.json();
      if (data?.features?.length) {
        setQuery(data.features[0].place_name);
        const [lng, lat] = data.features[0].center;
        goToCoords(lng, lat);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const onChangeQuery = async (val) => {
    setQuery(val);
    setActiveIndex(-1);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(val)}.json?key=${MAPTILER_API_KEY}&autocomplete=true&types=place,locality,neighbourhood&language=en`);
      const data = await res.json();
      setSuggestions((data?.features || []).map((f) => ({ name: f.place_name || f.text, center: f.center })));
    } catch (err) {
      console.error('Suggest error:', err);
    }
  };

  const onKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
  };

  return (
    <div className="App">
      <header className="hud">
        <div className="title">Pune Digital Twin</div>
        <div className="subtitle">Exploring: {currentArea}</div>
        <form className="search-container" onSubmit={handleSubmit}>
          <input
            className="search-input" type="text" placeholder="Search area…"
            value={query} onChange={(e) => onChangeQuery(e.target.value)}
            onKeyDown={onKeyDown} autoComplete="off"
          />
          <button type="submit" className="go-button">Go</button>
          {suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((s, idx) => (
                <li
                  key={`${s.name}-${idx}`} role="option"
                  aria-selected={idx === activeIndex}
                  className={`suggestion${idx === activeIndex ? ' active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(s.name);
                    const [lng, lat] = s.center;
                    goToCoords(lng, lat);
                  }}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className="ai-panel">
          <div className="score-card">
            <h3>Area Carbon Score</h3>
            <p className="score">{Math.round(carbonScore)}</p>
          </div>
          <button onClick={handleAnalyzeArea} disabled={isLoadingAI} className="analyze-button">
            {isLoadingAI ? 'Analyzing...' : 'Analyze & Optimize Area'}
          </button>
          <div className="log-panel">
            <h4>AI Decision Log:</h4>
            <p>{aiLog}</p>
          </div>
        </div>
      </header>
      <div className="map-wrap">
        <MapComponent 
          setCurrentArea={setCurrentArea} 
          onMapReady={setMap}
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  );
}

export default App;
