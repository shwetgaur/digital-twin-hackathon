// src/Map.jsx

import React from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

function MapComponent() {
  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

  if (!MAPTILER_API_KEY) {
    throw new Error("Missing Maptiler API Key. Please set VITE_MAPTILER_API_KEY in your .env file.");
  }

  const mapTilerStyleUrl = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_API_KEY}`;

  const onMapLoad = (evt) => {
    const map = evt.target;

    map.on('styledata', () => {
      if (map.getLayer('3d-buildings')) return;

      map.setLight({
        anchor: 'viewport',
        color: '#ffffff',
        intensity: 0.3
      });

      // Layer 1: The 3D building extrusions
      map.addLayer({
        'id': '3d-buildings',
        'source': 'maptiler',
        'source-layer': 'building',
        'type': 'fill-extrusion',
        'minzoom': 14,
        'paint': {
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['get', 'render_height'],
            0, '#2D3748',
            80, '#4A5568'
          ],
          // --- CHANGE #1: Buildings "Bulge Up" More ---
          // The height multiplier is now 3x. Taller buildings will be
          // significantly more extruded than shorter ones.
          'fill-extrusion-height': ['*', ['get', 'render_height'], 3],
          'fill-extrusion-base': ['get', 'render_min_height'],
          'fill-extrusion-opacity': 0.95
        }
      });

      // --- CHANGE #2: Add Building Outlines for Detail ---
      // This new layer draws a thin line around the footprint of every
      // building, giving them more definition and a "technical" look.
      map.addLayer({
        'id': 'building-outlines',
        'source': 'maptiler',
        'source-layer': 'building',
        'type': 'line',
        'minzoom': 14,
        'paint': {
          'line-color': '#718096', // A slightly lighter gray for the outline
          'line-width': 1,
          'line-opacity': 0.5
        }
      });
    });
  };

  return (
    <Map
      mapLib={maplibregl}
      initialViewState={{
        longitude: 73.885, latitude: 18.536, zoom: 15.5, pitch: 70, bearing: -20
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapTilerStyleUrl}
      onLoad={onMapLoad}
      antialias={true}
    />
  );
}

export default MapComponent;