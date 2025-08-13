import { useState } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import { getAIDecision } from './lib/watsonx.js';
import { applyIntervention } from './lib/simulation.js';
import './App.css';

const initialCityData = {
  "city_block_id": "blk_01",
  "current_total_carbon": 8500,
  "elements": [
    { "id": "bldg_1", "type": "building", "carbon_output": 1500, "attributes": { "has_solar": false } },
    { "id": "bldg_2", "type": "building", "carbon_output": 2500, "attributes": { "has_solar": true } },
    { "id": "road_1", "type": "road", "carbon_output": 3000, "attributes": { "is_bike_lane": false } },
    { "id": "park_1", "type": "green_space", "carbon_output": -500, "attributes": { "tree_count": 50 } }
  ]
};

function App() {
  const [cityData, setCityData] = useState(initialCityData);
  const [aiLog, setAiLog] = useState("AI is waiting for a command...");
  const [isLoading, setIsLoading] = useState(false);

  const handleOptimize = async () => {
    setIsLoading(true);
    setAiLog("Contacting AI, analyzing options...");

    const decision = await getAIDecision(cityData);

    if (decision && decision.action) {
      setAiLog(`AI decided to: ${decision.action} on ${decision.target_id}.`);
      const newCityState = applyIntervention(cityData, decision);
      setCityData(newCityState);
    } else {
      setAiLog("Error contacting AI. Check console (F12) for details.");
    }
    setIsLoading(false);
  };

  return (
    <div className="app-container">
      <Scene cityData={cityData} />
      <UI 
        carbonScore={cityData.current_total_carbon}
        aiLog={aiLog}
        isLoading={isLoading}
        onOptimize={handleOptimize}
      />
    </div>
  );
}

export default App;