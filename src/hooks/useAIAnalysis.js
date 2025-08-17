import { useCallback } from 'react';
import { getAIDecision } from '../lib/watsonx';
import { applyIntervention } from '../lib/simulation';

export const useAIAnalysis = (map, currentArea, analysisZone, setCarbonScore, setAiLog, setIsLoadingAI) => {
  const handleAnalyzeArea = useCallback(async () => {
    if (!map || !analysisZone) {
      setAiLog("Please select an area first.");
      return;
    }

    setIsLoadingAI(true);
    setAiLog("Analyzing buildings in the selected zone...");

    // Ensure source exists before querying
    if (!map.getSource('openmaptiles')) {
      setAiLog("Building data source not loaded yet.");
      setIsLoadingAI(false);
      return;
    }

    // Query all building features and manually filter by geometry
    const features = map.querySourceFeatures('openmaptiles', {
      sourceLayer: 'building'
    }).filter(f => {
      try {
        const poly = turf.polygon(analysisZone.geometry.coordinates);
        const buildingPoly = turf.polygon(f.geometry.coordinates);
        return turf.booleanIntersects(buildingPoly, poly);
      } catch {
        return false;
      }
    });

    if (features.length === 0) {
      setAiLog("No buildings found in the selected zone.");
      setIsLoadingAI(false);
      return;
    }

    let initialCarbon = 0;
    const cityElements = features.map((feature, index) => {
      const buildingHeight = feature.properties.render_height || 20;
      const carbonOutput = buildingHeight * 50;
      initialCarbon += carbonOutput;
      feature.id = feature.properties.id || index + 1;
      return { id: feature.id, type: 'building', carbon_output: carbonOutput, attributes: { has_solar: false } };
    });

    setCarbonScore(initialCarbon);
    setAiLog("Data sent to WatsonX AI for optimization...");

    const decision = await getAIDecision({
      city_block_id: currentArea,
      current_total_carbon: initialCarbon,
      elements: cityElements
    });

    if (decision && decision.action) {
      setAiLog(`AI decided to: ${decision.action} on building ID ${decision.target_id}.`);
      const newCityState = applyIntervention({ city_block_id: currentArea, current_total_carbon: initialCarbon, elements: cityElements }, decision);
      setCarbonScore(newCityState.current_total_carbon);

      // Highlight affected building
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'case',
        ['==', ['id'], decision.target_id], '#FFD700',
        '#2D9CDB'
      ]);
    } else {
      setAiLog("Error contacting AI.");
    }

    setIsLoadingAI(false);
  }, [map, currentArea, analysisZone, setCarbonScore, setAiLog, setIsLoadingAI]);

  return { handleAnalyzeArea };
};
