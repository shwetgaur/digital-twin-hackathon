import { useState, useEffect, useCallback } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export const useDrawTools = (map, isPanelExpanded) => {
  const [draw, setDraw] = useState(null);

  useEffect(() => {
    if (map && !draw) {
      const drawInstance = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
      });
      map.addControl(drawInstance);
      setDraw(drawInstance);
    }
  }, [map, draw]);

  useEffect(() => {
    if (draw) {
      if (isPanelExpanded) {
        // No specific action needed when panel expands, drawing tools are already available
      } else {
        draw.changeMode('simple_select');
      }
    }
  }, [isPanelExpanded, draw]);

  const setDrawMode = useCallback((mode) => {
    if (draw) {
      draw.changeMode(mode);
    }
  }, [draw]);

  const clearAllShapes = useCallback(() => {
    if (draw) {
      draw.deleteAll();
    }
  }, [draw]);

  return { setDrawMode, clearAllShapes };
};
