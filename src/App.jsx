import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

const MapComponent = forwardRef(({ setCurrentArea }, ref) => {
  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
  const mapRef = useRef(null);
  const orbitIntervalRef = useRef(null);
  const orbitSpeedRef = useRef(0);
  const stopTimeoutRef = useRef(null);

  if (!MAPTILER_API_KEY) {
    throw new Error('Missing MapTiler API Key (VITE_MAPTILER_API_KEY).');
  }

  const mapStyleUrl = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_API_KEY}`;
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  const stopOrbitSmoothly = () => {
    if (stopTimeoutRef.current) return;
    stopTimeoutRef.current = setInterval(() => {
      orbitSpeedRef.current *= 0.9;
      if (Math.abs(orbitSpeedRef.current) < 0.01) {
        clearInterval(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
        clearInterval(orbitIntervalRef.current);
        orbitIntervalRef.current = null;
      }
    }, 30);
  };

  const startOrbit = () => {
    clearInterval(orbitIntervalRef.current);
    let bearing = mapRef.current.getBearing();
    orbitSpeedRef.current = 360 / (60 * 1000 / 30); // 1 orbit/min

    orbitIntervalRef.current = setInterval(() => {
      bearing = (bearing + orbitSpeedRef.current) % 360;
      mapRef.current.setBearing(bearing);
    }, 30);

    const stopOnInteraction = () => stopOrbitSmoothly();

    // Stop on mouse down (click), drag, zoom, arrow keys
    mapRef.current.getCanvas().addEventListener('mousedown', stopOnInteraction, { once: true });
    mapRef.current.once('movestart', stopOnInteraction);
    mapRef.current.once('zoomstart', stopOnInteraction);
    window.addEventListener(
      'keydown',
      (e) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          stopOnInteraction();
        }
      },
      { once: true }
    );
  };

  useImperativeHandle(ref, () => ({
    cinematicFlyTo: async (lng, lat) => {
      const map = mapRef.current;
      if (!map) return;

      const currentCenter = map.getCenter();
      const dist =
        Math.sqrt(Math.pow(currentCenter.lng - lng, 2) + Math.pow(currentCenter.lat - lat, 2)) * 111;

      // Start North-up top-down
      if (dist < 0.05) {
        map.easeTo({
          center: [lng, lat],
          zoom: map.getZoom() - 2,
          pitch: 0,
          bearing: 0,
          duration: 1500,
        });
        await wait(1600);

        map.easeTo({
          center: [lng, lat],
          zoom: 16.5,
          pitch: 0,
          bearing: 0,
          duration: 2500,
        });
        await wait(2600);

        map.easeTo({
          center: [lng, lat],
          zoom: 16.5,
          pitch: 60,
          bearing: 0,
          duration: 2500,
        });
        await wait(2600);

        startOrbit();
        return;
      }

      map.flyTo({
        center: [lng, lat],
        zoom: 16.5,
        pitch: 0,
        bearing: 0,
        duration: 7500,
      });
      await wait(7600);

      map.easeTo({
        center: [lng, lat],
        zoom: 16.5,
        pitch: 60,
        bearing: 0,
        duration: 2500,
      });
      await wait(2600);

      startOrbit();
    },
  }));

  const fetchAreaName = async (lng, lat) => {
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}`
      );
      const data = await res.json();
      if (data?.features?.length) {
        const f =
          data.features.find((x) => x.place_type.includes('neighbourhood')) ||
          data.features.find((x) => x.place_type.includes('locality')) ||
          data.features.find((x) => x.place_type.includes('place')) ||
          data.features[0];
        setCurrentArea(f.text || f.place_name || '—');
      }
    } catch (e) {
      console.error('Area name error:', e);
    }
  };

  const onMapLoad = (e) => {
    const map = e.target;
    mapRef.current = map;

    const c = map.getCenter();
    fetchAreaName(c.lng, c.lat);

    map.on('moveend', () => {
      const { lng, lat } = map.getCenter();
      fetchAreaName(lng, lat);
    });

    const addBuildings = () => {
      if (map.getLayer('3d-buildings')) return;
      const src = map.getStyle()?.sources || {};
      if (!src.openmaptiles) return;

      map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.5 });

      try {
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
            'fill-extrusion-opacity': 0.6,
          },
        });
      } catch (err) {}
    };

    if (map.isStyleLoaded()) addBuildings();
    map.on('styledata', addBuildings);
  };

  return (
    <Map
      mapLib={maplibregl}
      initialViewState={{
        longitude: 73.885,
        latitude: 18.536,
        zoom: 17,
        pitch: 0,
        bearing: -20,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyleUrl}
      onLoad={onMapLoad}
      antialias
      dragRotate
      pitchWithRotate
      keyboard
    />
  );
});

function App() {
  const [currentArea, setCurrentArea] = useState('Loading…');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const mapRef = useRef(null);

  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

  const goToCoords = (lng, lat) => {
    setSuggestions([]);
    setActiveIndex(-1);
    mapRef.current?.cinematicFlyTo(lng, lat);
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
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(
          query
        )}.json?key=${MAPTILER_API_KEY}&types=place,locality,neighbourhood&language=en`
      );
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
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(
          val
        )}.json?key=${MAPTILER_API_KEY}&autocomplete=true&types=place,locality,neighbourhood&language=en`
      );
      const data = await res.json();
      setSuggestions(
        (data?.features || []).map((f) => ({
          name: f.place_name || f.text,
          center: f.center,
        }))
      );
    } catch (err) {
      console.error('Suggest error:', err);
    }
  };

  const onKeyDown = (e) => {
    if (!suggestions.length) {
      if (e.key === 'Enter') e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        setQuery(suggestions[activeIndex].name);
        const [lng, lat] = suggestions[activeIndex].center;
        goToCoords(lng, lat);
      } else {
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="App">
      <header className="hud">
        <div className="title">Pune Digital Twin</div>
        <div className="subtitle">Exploring: {currentArea}</div>

        <form className="search-container" onSubmit={handleSubmit}>
          <input
            className="search-input"
            type="text"
            placeholder="Search area…"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          <button type="submit" className="go-button">
            Go
          </button>

          {suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((s, idx) => (
                <li
                  key={`${s.name}-${idx}`}
                  role="option"
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
      </header>

      <div className="map-wrap">
        <MapComponent ref={mapRef} setCurrentArea={setCurrentArea} />
      </div>
    </div>
  );
}

export default App;
