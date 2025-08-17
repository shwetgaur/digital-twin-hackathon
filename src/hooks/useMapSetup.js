// src/hooks/useMapSetup.js

import { useCallback } from 'react';

export const useMapSetup = (MAPTILER_API_KEY, setCurrentArea) => {
  
  const fetchAreaName = useCallback(async (lng, lat) => {
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}`);
      const data = await res.json();
      if (data?.features?.length) {
        const f = data.features.find(x => x.place_type.includes('neighbourhood')) 
               || data.features.find(x => x.place_type.includes('locality')) 
               || data.features[0];
        setCurrentArea(f.text || f.place_name || '—');
      }
    } catch (e) {
      console.error('Area name error:', e);
    }
  }, [MAPTILER_API_KEY, setCurrentArea]);

  const setupLayers = useCallback((map) => {
    if (map.getSource('analysis-zone-source')) return;

    map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.5 });

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

    map.addSource('analysis-zone-source', { type: 'geojson', data: null });
    map.addLayer({
      id: 'analysis-zone-layer',
      type: 'fill',
      source: 'analysis-zone-source',
      paint: { 'fill-color': '#007bff', 'fill-opacity': 0.2, 'fill-outline-color': '#007bff' },
    });
  }, []);

  const onMapLoad = useCallback((evt, onMapReady) => {
    const map = evt.target;
    if (onMapReady) onMapReady(map);

    const initialCenter = map.getCenter();
    fetchAreaName(initialCenter.lng, initialCenter.lat);

    map.on('moveend', () => {
      const { lng, lat } = map.getCenter();
      fetchAreaName(lng, lat);
    });

    if (map.isStyleLoaded()) {
      setupLayers(map);
    } else {
      map.on('styledata', () => setupLayers(map));
    }
  }, [fetchAreaName, setupLayers]);

  return { onMapLoad };
};
