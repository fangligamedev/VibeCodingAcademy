import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Level, LevelStep, Language } from "../types";

// Helper to get client (assumes process.env.API_KEY is available)
// UPDATED: Now supports Custom Base URL for third-party providers
const getGenAI = () => {
  const apiKey = process.env.API_KEY;
  const baseUrl = process.env.GEMINI_BASE_URL;
  
  if (!apiKey) {
    console.error("API_KEY is missing!");
    throw new Error("API Key is missing");
  }

  const config: any = { apiKey };
  if (baseUrl) {
    // If using a third-party provider, we might need to adjust how the SDK is initialized.
    // However, the official SDK might not support custom baseUrl easily in the constructor.
    // For maximum compatibility with 3rd party OpenAI-compatible or Google-compatible endpoints,
    // we rely on the SDK's capability if it exists, otherwise we might need a fetch-based fallback.
    // Note: The specific @google/genai SDK version behavior regarding baseUrl needs to be checked.
    // Assuming standard GoogleGenAI usage for now. If 3rd party provider mimics Google exactly, this might work if they intercept DNS or use a proxy.
    // But usually, SDKs need an endpoint config.
    //
    // HACK: Attempt to inject baseUrl if the SDK supports it in constructor options (it often doesn't publicly).
    // If the user is using a proxy that requires a different endpoint, the SDK might fail.
    //
    // A more robust way for 3rd party APIs is to use fetch directly, but let's try to pass it if supported
    // or rely on the user environment.
    // 
    // Re-reading user request: "not model is gemini-2.5-flash".
    // If the SDK fails to connect to a custom endpoint, we might need to rewrite this service to use fetch().
  }
  
  // For now, we initialize standard SDK. If this fails with custom URL requirements, we will switch to fetch.
  return new GoogleGenAI({ apiKey });
};

// ... rest of the file (we will rewrite the API calls to use fetch for custom base url support)

// Since we need to support custom Base URL which the SDK might not expose easily, 
// we will implement a direct REST call helper.

const callGeminiAPI = async (
    model: string, 
    payload: any,
    schema?: Schema
) => {
    const apiKey = process.env.API_KEY;
    // Default to official Google API if no base URL provided
    // Remove trailing slash if present
    let baseUrl = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
    
    // Construct URL
    // Pattern: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const body: any = {
        contents: payload.contents,
        systemInstruction: payload.systemInstruction ? { parts: [{ text: payload.systemInstruction }] } : undefined,
        generationConfig: {
            // responseMimeType: schema ? "application/json" : "text/plain",
             responseMimeType: "application/json", // Always JSON for this app's logic
             responseSchema: schema
        }
    };

    // If no schema is provided, we might want text/plain, but our app logic heavily relies on JSON structure.
    if (!schema) {
        delete body.generationConfig.responseSchema;
        // Keep application/json mime type if we want JSON output, or remove for text.
        // For explainPythonError, we expect text.
        body.generationConfig.responseMimeType = "text/plain";
    }

    try {
        console.log(`[Gemini Service] Calling URL: ${url.replace(apiKey || '', '***')}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Gemini Service] API Error (${response.status}):`, errorText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Parse response to match SDK structure roughly or just return text
        // SDK response.text() usually gets candidates[0].content.parts[0].text
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        }
        
        return null;

    } catch (error) {
        console.error("[Gemini Service] Fetch Error:", error);
        throw error;
    }
}


// Defined schema for the tutor response
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description: "A friendly, encouraging message to the child explaining the code or giving a hint. MUST be in the requested language.",
    },
    pythonCode: {
      type: Type.STRING,
      description: "The valid Python code snippet corresponding to the request, if successful.",
    },
    isStepComplete: {
      type: Type.BOOLEAN,
      description: "True if the user's prompt successfully achieved the current step's goal.",
    },
    visualAction: {
      type: Type.STRING,
      description: "The internal action key (e.g., 'DRAW_HERO') to trigger the visual game preview.",
    },
    correction: {
        type: Type.STRING,
        description: "If isStepComplete is false, explain what was missing in the prompt."
    }
  },
  required: ["message", "isStepComplete"],
};

export const generateTutorResponse = async (
  userPrompt: string,
  currentLevel: Level,
  currentStepIndex: number,
  chatHistory: { role: string; text: string }[],
  language: Language
) => {
  const currentStep: LevelStep = currentLevel.steps[currentStepIndex];
  const langName = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const systemInstruction = `
    You are "VibeBot", a friendly, energetic, and patient Python coding coach for children (ages 8-12).
    Your goal is to teach "Vibe Coding" — the art of prompting an AI to write code for you.
    
    IMPORTANT: You must communicate entirely in ${langName}.
    
    Current Context:
    - Level: ${currentLevel.title}
    - Current Objective: ${currentStep.instruction}
    - Expected Concept: ${currentStep.expectedAction}
    - Expected Python Code Logic: ${currentStep.pythonSnippet}

    Rules:
    1. If the user's prompt is close to the Current Objective (e.g., asking to import pygame, or draw the shape), mark 'isStepComplete' as true.
    2. If 'isStepComplete' is true:
       - Generate the actual Python code snippet in 'pythonCode'.
       - IMPORTANT: The 'pythonCode' MUST include comments (#) explaining what the lines do, suitable for a child to understand.
       - Set 'visualAction' to '${currentStep.expectedAction}'.
       - In 'message', praise the user specifically on their prompting (e.g., "Great job asking for the specific color!"). Explain briefly what the Python code does.
    3. If the user's prompt is off-topic or vague:
       - Mark 'isStepComplete' as false.
       - In 'message', gently guide them back. Give a hint about how to phrase the request better.
       - Do not return 'pythonCode' or 'visualAction'.
    4. Keep language simple, fun, and encouraging. Use emojis 🚀 ⭐.
    5. Do not just give the code if they haven't asked for it properly. Teach them to ask.
  `;

  try {
    // Replaced SDK call with direct fetch for better compatibility
    const text = await callGeminiAPI(
        'gemini-2.5-flash', 
        {
            contents: [
                ...chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
                { role: 'user', parts: [{ text: userPrompt }] }
            ],
            systemInstruction: systemInstruction
        },
        responseSchema
    );

    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMsg = language === 'zh' 
        ? "糟糕！我的通讯线路堵塞了。你能再说一遍吗？🤖"
        : "Oh no! My communication circuits are jammed. Can you try saying that again? 🤖";
    return {
      message: errorMsg,
      isStepComplete: false
    };
  }
};

const executionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        consoleOutput: {
            type: Type.STRING,
            description: "The simulated stdout/stderr output of the code. If successful, show standard success messages (e.g., 'pygame 2.5.0 (SDL 2.28.0, python 3.11) Hello from the pygame community.'). If error, show Python error trace."
        },
        isSuccess: {
            type: Type.BOOLEAN,
            description: "True if the code runs without syntax errors AND accomplishes the 'Expected Action'."
        },
        visualAction: {
            type: Type.STRING,
            description: "The internal action key to trigger visual update if success."
        }
    },
    required: ["consoleOutput", "isSuccess"]
}

export const runPythonCode = async (
    code: string,
    currentStep: LevelStep,
    language: Language
) => {
    const langName = language === 'zh' ? 'Chinese (Simplified)' : 'English';

    const systemInstruction = `
        You are a Python Interpreter and Game Logic Checker.
        
        Task:
        1. Analyze the provided Python code.
        2. Check for syntax errors.
        3. Check if the code satisfies the Current Objective: "${currentStep.instruction}".
        4. The expected logic should roughly match: "${currentStep.pythonSnippet}".
        5. Return the simulated terminal output.
        
        Output Language for Console Logs: ${langName} (for custom messages), but keep standard Python errors in English.
        
        If successful:
        - consoleOutput: "Process started...\n> Loading assets...\n> Screen initialized.\n> Code executed successfully."
        - isSuccess: true
        - visualAction: "${currentStep.expectedAction}"
        
        If logic matches but code is messy, it's still a success.
        
        If syntax error:
        - consoleOutput: "File 'main.py', line X\n  SyntaxError: invalid syntax"
        - isSuccess: false
        
        If code runs but doesn't meet objective (e.g. user defined 'red' instead of 'blue'):
        - consoleOutput: "Process finished with exit code 0.\n[System]: Objective not met. Expected: ${currentStep.expectedAction}"
        - isSuccess: false
    `;

    try {
        const text = await callGeminiAPI(
            'gemini-2.5-flash',
            {
                contents: [{ role: 'user', parts: [{ text: code }] }],
                systemInstruction: systemInstruction
            },
            executionSchema
        );
        
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text);

    } catch (error) {
        return {
            consoleOutput: "Runtime Error: Connection to interpreter lost.",
            isSuccess: false
        };
    }
}

export const explainPythonError = async (
    code: string,
    consoleOutput: string,
    language: Language
) => {
  const langName = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const systemInstruction = `
    You are "VibeBot", a friendly Python tutor for kids.
    The user's code failed with an error.
    Your task is to explain the error in simple, encouraging language.
    
    Context:
    - Code: provided below
    - Error Output: provided below
    - Language: ${langName}

    Rules:
    1. Don't be too technical. Use metaphors if helpful.
    2. Give a direct hint on how to fix it.
    3. Keep it short (2-3 sentences).
    4. Use emojis 🔧 🐛.
  `;

  try {
    const text = await callGeminiAPI(
        'gemini-2.5-flash',
        {
             contents: [
                { role: 'user', parts: [{ text: `Code:\n${code}\n\nError:\n${consoleOutput}` }] }
             ],
             systemInstruction: systemInstruction
        }
        // No schema needed, returns text
    );

    return text;
  } catch (error) {
    console.error("Gemini API Error (Explain):", error);
    return null;
  }
};
