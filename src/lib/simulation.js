import * as turf from '@turf/turf';

// Renamed from addTreesSimulation for clarity
export const addTrees = (currentData, numberOfTrees) => {
  const greens = currentData.greens;
  if (!greens || greens.features.length === 0) return currentData;

  const newTreesFeatures = [...currentData.trees.features];

  for (let i = 0; i < numberOfTrees; i++) {
    const randomGreen = greens.features[Math.floor(Math.random() * greens.features.length)];
    const randomPoint = turf.randomPoint(1, { bbox: turf.bbox(randomGreen) }).features[0];
    randomPoint.properties = {
      fid: `sim_tree_${Date.now()}_${i}`,
      sink_kgco2yr_tree: 22.0,
      co2e_tpy: -0.022,
      feature_type: "tree",
      simulated: true,
    };
    newTreesFeatures.push(randomPoint);
  }

  return { ...currentData, trees: { ...currentData.trees, features: newTreesFeatures } };
};

export const addSolarPanels = (currentData, numberOfRoofs) => {
    const buildings = currentData.buildings.features.filter(f => !f.properties.solar_panels && f.properties.area_m2 > 200);
    if (buildings.length === 0) return currentData;

    // Sort by largest area to prioritize impactful installations
    buildings.sort((a, b) => b.properties.area_m2 - a.properties.area_m2);
    
    const updatedFeatures = currentData.buildings.features.map(f => ({...f}));

    for (let i = 0; i < Math.min(numberOfRoofs, buildings.length); i++) {
        const buildingId = buildings[i].properties.id;
        const targetFeature = updatedFeatures.find(f => f.properties.id === buildingId);
        if (targetFeature) {
            targetFeature.properties.solar_panels = true;
            // Assume solar panels reduce carbon emissions by 80%
            targetFeature.properties.co2e_tpy *= 0.20;
            targetFeature.properties.carbon_emission *= 0.20;
        }
    }
    
    return { ...currentData, buildings: { ...currentData.buildings, features: updatedFeatures }};
};


export const convertToBikeLane = (currentData) => {
    // Find the highest-traffic road that isn't already a bike lane
    const roads = currentData.roads.features.filter(f => !f.properties.is_bike_lane);
    if (roads.length === 0) return currentData;

    roads.sort((a, b) => b.properties.aadt - a.properties.aadt);
    const roadToConvertId = roads[0].properties.id;

    const updatedFeatures = currentData.roads.features.map(f => {
        if (f.properties.id === roadToConvertId) {
            const newProps = {...f.properties};
            // Assume converting to a bike lane reduces traffic emissions by 60%
            newProps.co2e_tpy *= 0.40; 
            newProps.is_bike_lane = true;
            return {...f, properties: newProps};
        }
        return f;
    });

    return { ...currentData, roads: { ...currentData.roads, features: updatedFeatures }};
};