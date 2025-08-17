import { addTrees, addSolarPanels, convertToBikeLane } from './simulation';

// Define the "toolbox" of actions the AI can take
const AVAILABLE_ACTIONS = [
  {
    name: 'Add Solar Panels',
    cost: 15000, // Cost per intervention (e.g., for a block of 10 roofs)
    // The function to execute the action, imported from simulation.js
    execute: (data) => addSolarPanels(data, 10), 
  },
  {
    name: 'Plant Trees',
    cost: 5000, // Cost for a batch of 50 trees
    execute: (data) => addTrees(data, 50),
  },
  {
    name: 'Convert Road to Bike Lane',
    cost: 20000, // Cost per road segment
    execute: (data) => convertToBikeLane(data),
  },
  // Add more actions here in the future
];

export const runAIOptimizationCycle = (currentData, currentBudget, carbonCalculator) => {
  if (currentBudget <= 0) {
    console.log("AI Agent: Budget depleted. Halting optimization.");
    return { ...currentData, budget: 0, plan: 'Budget depleted.' };
  }

  let bestAction = null;
  let maxBenefit = -Infinity;
  let bestCost = Infinity;

  const initialCarbon = carbonCalculator(currentData);

  // 1. AI simulates each possible action to find the best one
  for (const action of AVAILABLE_ACTIONS) {
    if (action.cost > currentBudget) {
      continue; // Skip actions we can't afford
    }

    // Simulate the action
    const simulatedData = action.execute(currentData);
    const resultingCarbon = carbonCalculator(simulatedData);
    const carbonReduction = initialCarbon - resultingCarbon;
    
    // Calculate benefit (carbon reduction per unit of cost)
    const benefit = carbonReduction / action.cost;

    if (benefit > maxBenefit) {
      maxBenefit = benefit;
      bestAction = action;
      bestCost = action.cost;
    }
  }

  // 2. AI executes the best action it found
  if (bestAction) {
    console.log(`AI Agent: Executing "${bestAction.name}" for a cost of ${bestCost}`);
    const newData = bestAction.execute(currentData);
    const newBudget = currentBudget - bestCost;
    
    return { 
        ...newData, 
        budget: newBudget, 
        plan: `Next Action: ${bestAction.name}. Budget Remaining: $${newBudget.toLocaleString()}`
    };
  }

  console.log("AI Agent: No affordable actions left.");
  return { ...currentData, budget: currentBudget, plan: 'No affordable actions found.' };
};