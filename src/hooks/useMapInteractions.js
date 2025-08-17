// src/hooks/useMapInteractions.js

import { useCallback } from 'react';

export const useMapInteractions = (map, setAnalysisZone, setAiLog) => {
  const handleMapClick = useCallback((evt) => {
    const { lng, lat } = evt.lngLat;
    const size = 0.0005; // Defines the size of the analysis square
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
    
    if (map) {
      // Reset building colors when a new zone is selected, in case one was highlighted by the AI.
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', '#2D9CDB');
    }
  }, [map, setAnalysisZone, setAiLog]);

  /**
   * Creates a cinematic camera animation to a specific coordinate.
   * The animation consists of three distinct stages for a smooth, professional feel:
   * 1. Pan Out: The camera zooms out and resets to a top-down view (north-up).
   * 2. Travel: The camera flies across the map to the destination from above.
   * 3. Tilt In: The camera tilts to a perspective view upon arrival.
   * This sequence works even if the destination is the same as the start.
   */
  const goToCoords = useCallback((lng, lat) => {
    if (!map) return;

    const destination = [lng, lat];
    const endPitch = 60;    // The final camera tilt angle
    const endBearing = -20; // The final camera rotation
    const travelZoom = 17;  // The zoom level upon arrival
    const panOutZoom = 13;  // The zoom level to pan out to before traveling
    
    // Stop any existing animation to prevent conflicts or jerky movements.
    map.stop();

    // Stage 1: Pan out and reset camera to a top-down view (pitch: 0, bearing: 0).
    // This gives the user a sense of scale and orientation before traveling.
    map.easeTo({
      zoom: panOutZoom,
      pitch: 0,
      bearing: 0,
      duration: 2000, // Animation duration in milliseconds
      essential: true, // This animation is considered essential and should not be interrupted by user input.
    });

    // We use map.once('moveend', ...) to chain animations. This is a robust way to ensure
    // the next animation starts only after the previous one has completely finished.
    
    // Stage 2: After the pan-out animation is complete, fly to the destination.
    map.once('moveend', () => {
      map.flyTo({
        center: destination,
        zoom: travelZoom,
        pitch: 0, // Stay top-down during the flight for a clear travel path.
        bearing: 0,
        duration: 5000, // A longer duration for a smoother travel feel
        essential: true,
      });

      // Stage 3: After the flight is complete, tilt the camera into the final perspective view.
      map.once('moveend', () => {
        map.easeTo({
          pitch: endPitch,
          bearing: endBearing,
          duration: 1500,
          essential: true,
        });
      });
    });
  }, [map]);

  const enterSelectionMode = useCallback(() => {
    if (map) {
      map.easeTo({
        zoom: map.getZoom() - 1,
        pitch: 0,
        bearing: 0,
        duration: 1000,
      });
    }
  }, [map]);

  return { handleMapClick, goToCoords, enterSelectionMode };
};
