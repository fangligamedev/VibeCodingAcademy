import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Level, LevelStep, Language } from "../types";

// Helper to get client (assumes process.env.API_KEY is available)
// UPDATED: Now supports Custom Base URL for third-party providers (specifically OpenAI-compatible ones)
const getGenAI = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API_KEY is missing!");
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Calls the API. If GEMINI_BASE_URL is set, it assumes an OpenAI-compatible interface
 * (which is common for "AI Hubs" like Zeabur AI Hub / LiteLLM).
 * Otherwise, it defaults to the official Google Gemini REST API.
 */
const callGeminiAPI = async (
    model: string, 
    payload: any,
    schema?: Schema
) => {
    const apiKey = process.env.API_KEY;
    // Remove trailing slash if present
    let baseUrl = (process.env.GEMINI_BASE_URL || '').replace(/\/$/, '');
    
    // STRATEGY DETECTION:
    // If baseUrl is present, we assume OpenAI-compatible API (LiteLLM / Zeabur AI Hub).
    // If baseUrl is empty, we use Google Official API.
    const isOpenAICompatible = !!baseUrl;

    let url = '';
    let body: any = {};

    if (isOpenAICompatible) {
        // --- OPENAI COMPATIBLE MODE (Zeabur AI Hub / LiteLLM) ---
        // Endpoint: /v1/chat/completions
        url = `${baseUrl}/v1/chat/completions`;

        // Map 'contents' (Google) to 'messages' (OpenAI)
        const messages = [];
        
        // Add system instruction if present
        if (payload.systemInstruction) {
            messages.push({ role: 'system', content: payload.systemInstruction });
        }

        // Map chat history and user input
        if (payload.contents) {
            payload.contents.forEach((content: any) => {
                const role = content.role === 'model' ? 'assistant' : content.role;
                const text = content.parts?.[0]?.text || '';
                messages.push({ role, content: text });
            });
        }

        body = {
            model: model, // Pass the model name as is (e.g. 'gemini-2.5-flash')
            messages: messages,
            temperature: 0.7
        };

        // JSON Mode for OpenAI
        if (schema) {
            body.response_format = { type: "json_object" };
            // Important: OpenAI requires the word "JSON" in the prompt when using json_object mode.
            // We append a subtle reminder to the system prompt if it's not there.
            if (!messages.some(m => m.role === 'system' && m.content.includes('JSON'))) {
                 if (messages.length > 0 && messages[0].role === 'system') {
                     messages[0].content += " You MUST respond with valid JSON.";
                 } else {
                     messages.unshift({ role: 'system', content: "You MUST respond with valid JSON." });
                 }
            }
        }

    } else {
        // --- GOOGLE OFFICIAL MODE ---
        // Endpoint: https://generativelanguage.googleapis.com/v1beta/models/...
        baseUrl = 'https://generativelanguage.googleapis.com';
        url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        body = {
            contents: payload.contents,
            systemInstruction: payload.systemInstruction ? { parts: [{ text: payload.systemInstruction }] } : undefined,
            generationConfig: {
                 responseMimeType: "application/json", 
                 responseSchema: schema
            }
        };

        if (!schema) {
            delete body.generationConfig.responseSchema;
            body.generationConfig.responseMimeType = "text/plain";
        }
    }

    try {
        console.log(`[Gemini Service] Mode: ${isOpenAICompatible ? 'OpenAI-Compatible' : 'Google Native'}`);
        console.log(`[Gemini Service] Calling URL: ${url.replace(apiKey || '', '***')}`);
        
        const headers: any = {
            'Content-Type': 'application/json'
        };

        // For OpenAI compatible endpoints, usually Bearer token is used
        if (isOpenAICompatible) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Gemini Service] API Error (${response.status}):`, errorText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (isOpenAICompatible) {
            // Parse OpenAI format
            // choices[0].message.content
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                return data.choices[0].message.content;
            }
        } else {
            // Parse Google format
            // candidates[0].content.parts[0].text
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
                return data.candidates[0].content.parts[0].text;
            }
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
