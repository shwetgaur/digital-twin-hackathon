export const calculateTotalCarbon = (dataLayers) => {
  let totalCarbon = 0;

  // Sum emissions from all features in each layer that has a co2e_tpy property
  Object.values(dataLayers).forEach(layer => {
    if (layer && layer.features) {
      layer.features.forEach(feature => {
        if (feature.properties && typeof feature.properties.co2e_tpy === 'number') {
          totalCarbon += feature.properties.co2e_tpy;
        }
      });
    }
  });

  return totalCarbon;
};