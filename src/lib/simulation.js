export function applyIntervention(currentState, decision) {
  const newState = JSON.parse(JSON.stringify(currentState));
  const targetElement = newState.elements.find(el => el.id === decision.target_id);

  if (!targetElement) {
    console.error("Target element not found:", decision.target_id);
    return currentState;
  }

  switch (decision.action) {
    case 'add_solar_panel':
      if (targetElement.type === 'building' && !targetElement.attributes.has_solar) {
        const carbonReduction = targetElement.carbon_output * 0.8;
        newState.current_total_carbon -= carbonReduction;
        targetElement.carbon_output *= 0.2;
        targetElement.attributes.has_solar = true;
      }
      break;

    case 'add_bike_lane':
      if (targetElement.type === 'road' && !targetElement.attributes.is_bike_lane) {
        const carbonReduction = targetElement.carbon_output * 0.4;
        newState.current_total_carbon -= carbonReduction;
        targetElement.carbon_output *= 0.6;
        targetElement.attributes.is_bike_lane = true;
      }
      break;

    case 'plant_trees':
      if (targetElement.type === 'green_space') {
        const carbonReduction = 200;
        newState.current_total_carbon -= carbonReduction;
        targetElement.carbon_output -= carbonReduction;
        targetElement.attributes.tree_count += 50;
      }
      break;

    default:
      console.warn("Unknown action:", decision.action);
  }
  
  return newState;
}