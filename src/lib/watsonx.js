// src/lib/watsonx.js

// This function exchanges your permanent API key for a temporary access token.
// It runs automatically every time the main function is called.
async function getIAMToken(apiKey) {
  const url = 'https://iam.cloud.ibm.com/identity/token';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };
  const body = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching IAM token:", error);
    return null;
  }
}

// This is your main, exported function that the application calls.
export async function getAIDecision(cityData) {
  // 1. Get credentials from your .env file
  const apiKey = import.meta.env.VITE_IAM_API_KEY;
  const projectId = import.meta.env.VITE_PROJECT_ID;

  if (!apiKey || !projectId || apiKey.includes("YOUR_IBM_CLOUD_API_KEY")) {
    console.error("API Key or Project ID is missing or not set in .env file.");
    return null;
  }

  // 2. Get a fresh, temporary access token
  const accessToken = await getIAMToken(apiKey);
  if (!accessToken) return null;

  // 3. Define the AI model and parameters
  const model_id = "meta-llama/llama-3-3-70b-instruct";
  const parameters = {
    decoding_method: "greedy",
    max_new_tokens: 100, // Increased slightly to ensure JSON isn't cut off
    repetition_penalty: 1
  };
  
  // 4. Construct the full prompt with the city data
  const prompt_text = `
You are an expert urban sustainability planner. Your goal is to analyze the state of a city block and choose the single most impactful intervention. Your response MUST be a single, clean JSON object in the following format and nothing else.
{"action": "action_name", "target_id": "id_of_element"}
Here is the city block data:
${JSON.stringify(cityData)}
`;

  // 5. Set up the API call details
  const apiUrl = `/api/ml/v1-beta/generation/text?version=2024-05-31`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  const body = JSON.stringify({
    model_id: model_id,
    project_id: projectId,
    input: prompt_text,
    parameters: parameters
  });

  // 6. Make the API call and process the response
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: body
    });

    const responseData = await response.json();
    const resultText = responseData.results[0].generated_text;

    // --- LOGIC TO CLEAN THE AI's RESPONSE ---
    // Finds the first '{' and the last '}' to extract the pure JSON string,
    // ignoring any markdown formatting the AI might add.
    const firstBracket = resultText.indexOf('{');
    const lastBracket = resultText.lastIndexOf('}');
    const cleanJsonString = resultText.substring(firstBracket, lastBracket + 1);
    
    // Parse the cleaned string
    const decision = JSON.parse(cleanJsonString);

    console.log("AI Decision:", decision);
    return decision;
  } catch (error) {
    console.error("Error calling or parsing watsonx API:", error);
    return null;
  }
}