import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Map from './Map';
import './App.css';
import { calculateTotalCarbon } from './lib/carbonCalculator';
import { runAIOptimizationCycle } from './lib/AIAgent';

function App() {
  const [dataLayers, setDataLayers] = useState(null);
  const [carbonScore, setCarbonScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [aiState, setAiState] = useState({
    isRunning: false,
    budget: 50000, // Initial budget for the AI
    plan: 'Ready to optimize.'
  });

  const aiIntervalRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      // ... (fetchData logic remains the same as before)
      try {
        const fileNames = ['aoi', 'buildings', 'greens', 'roads', 'transit', 'trees', 'waste', 'water_line', 'water_poly'];
        const fetchPromises = fileNames.map(name => fetch(`/src/data/${name}.geojson`).then(res => res.json()));
        const loadedDataArray = await Promise.all(fetchPromises);
        const loadedData = fileNames.reduce((acc, name, index) => {
          acc[name] = loadedDataArray[index];
          return acc;
        }, {});
        setDataLayers(loadedData);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load GeoJSON data:", error);
      }
    };
    fetchData();
  }, []);

  // Calculate carbon score when data changes
  useEffect(() => {
    if (dataLayers) {
      setCarbonScore(calculateTotalCarbon(dataLayers));
    }
  }, [dataLayers]);

  // This effect runs the AI agent's optimization loop
  useEffect(() => {
    if (aiState.isRunning && dataLayers) {
      aiIntervalRef.current = setInterval(() => {
        setAiState(prev => {
          // Pass the current data and budget to the AI for one cycle
          const result = runAIOptimizationCycle(dataLayers, prev.budget, calculateTotalCarbon);
          
          // Update the main data state with the AI's changes
          setDataLayers(result);

          // If budget is gone, stop the AI
          if (result.budget <= 0) {
            clearInterval(aiIntervalRef.current);
            return { ...prev, isRunning: false, budget: 0, plan: 'Optimization complete. Budget depleted.' };
          }
          
          // Update the AI's state for the next cycle
          return { ...prev, budget: result.budget, plan: result.plan };
        });
      }, 2000); // Run one optimization cycle every 2 seconds
    } else {
      clearInterval(aiIntervalRef.current);
    }
    return () => clearInterval(aiIntervalRef.current);
  }, [aiState.isRunning, dataLayers]);
  
  const toggleAIAgent = () => {
    setAiState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  if (isLoading) {
    return <div>Loading Digital Twin...</div>;
  }

  return (
    <div className="main-container">
      <Sidebar 
        carbonScore={carbonScore}
        aiState={aiState}
        onToggleAI={toggleAIAgent}
      />
      <Map data={dataLayers} />
    </div>
  );
}

export default App;