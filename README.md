# CarbonTwin AI: An Agentic Digital Twin for Urban Sustainability

![IBM watsonx Hackathon Badge](https://img.shields.io/badge/IBM%20TechXchange-watsonx%20Hackathon%202025-blue)

CarbonTwin AI is an interactive digital twin that uses an agentic AI powered by IBM watsonx to help urban planners make smarter, data-driven decisions to reduce a city's carbon footprint.

### 🎥 [Link to Our 3-Minute Video Demonstration](https://www.youtube.com/watch?v=your_video_id)

***

## The Problem 🤔

Cities are major contributors to global CO2 emissions, but making impactful sustainability improvements is a complex puzzle. Urban planners have limited budgets and must decide between various interventions like adding solar panels, planting trees, or creating bike lanes. Without the right tools, it's difficult to predict which actions will provide the most significant carbon reduction for the cost.

***

## Our Solution 💡

CarbonTwin AI provides a visual, data-rich digital twin of a city block. Planners can see carbon emission hotspots at a glance. The platform's core is its **Agentic Planner**, an AI "expert" powered by IBM watsonx.

You can set a budget and deploy the agent, which then autonomously analyzes the city's data, makes strategic decisions, and simulates the most cost-effective interventions. The digital twin updates in real-time, providing immediate visual feedback on the AI's plan and its impact on the city's overall carbon score.

### Key Features ✨

* **Interactive 3D Digital Twin:** Visualize buildings, roads, trees, and green spaces with their associated carbon emissions, built with MapLibre GL.
* **Real-time Carbon Calculation:** A central dashboard displays the total carbon footprint (`CO2e/tpy`), which updates with every simulated change.
* **Agentic AI Planner (IBM watsonx):** Leverages a Llama-3 model on IBM Cloud to act as an expert urban planner, recommending the most impactful actions based on the city's current state.
* **Budget-Constrained Optimization:** The AI agent operates within a user-defined budget, ensuring its plan is financially realistic.
* **Dynamic Simulation:** Actions recommended by the AI (e.g., "Add Solar Panels") are instantly executed in the simulation, with visual changes reflected on the map.

***

## System Architecture & watsonx Usage 🤖

Our project uses an **agentic AI architecture** where IBM watsonx acts as the core reasoning engine. The workflow operates in a continuous loop:

1.  **Perceive:** The React application gathers the current state of the digital twin (data on buildings, traffic, etc.).
2.  **Reason:** This data is sent to a Llama-3 model via the IBM watsonx API. We prompt the model to act as a sustainability expert and return a single, structured JSON command representing the most cost-effective action (e.g., `{"action": "add solar panels"}`).
3.  **Act:** The application receives this command and executes the corresponding function from our "toolbox" (`simulation.js`). This modifies the digital twin's data, updating the map and the carbon score.

This loop repeats, allowing the watsonx agent to make a series of intelligent, context-aware decisions to improve the city's sustainability.


## Technology Stack 💻

* **Frontend:** React, Vite
* **Mapping:** MapLibre GL JS, React Map GL
* **Geospatial Analysis:** Turf.js
* **AI/LLM:** IBM watsonx (using Llama-3-70b-instruct model)
* **Styling:** CSS

***

## Local Setup & Installation 🚀

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the project root and add your API keys:
    ```env
    # Get from your IBM Cloud Account for the hackathon
    VITE_IAM_API_KEY="YOUR_IBM_CLOUD_API_KEY"
    VITE_PROJECT_ID="YOUR_WATSONX_PROJECT_ID"

    # Your MapTiler key
    VITE_MAPTILER_API_KEY="YOUR_MAPTILER_API_KEY"
    ```

4.  **Configure Vite Proxy:**
    Ensure your `vite.config.js` file is set up to proxy API requests to IBM Cloud. This is necessary to avoid CORS errors.
    ```javascript
    // vite.config.js
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      server: {
        proxy: {
          '/api': {
            target: '[https://us-south.ml.cloud.ibm.com](https://us-south.ml.cloud.ibm.com)', // Ensure region is correct
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
        },
      },
    });
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.
