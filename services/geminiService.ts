import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize the client safely
const ai = new GoogleGenAI({ apiKey });

export const getDoublingTimeEstimate = async (strain: string, temperature: string): Promise<{ doublingTime: number, explanation: string }> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const prompt = `
    I need a scientific estimate for the doubling time (generation time) of the bacterial strain "${strain}" grown at ${temperature}.
    Provide the doubling time in minutes.
    Also provide a very brief, one-sentence explanation or context (e.g., "Typical for LB media").
    If the strain is unknown or the query is invalid, return 0 for doublingTime and an error message in explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            doublingTime: {
              type: Type.NUMBER,
              description: "The estimated doubling time in minutes.",
            },
            explanation: {
              type: Type.STRING,
              description: "A brief scientific explanation or context for the estimate.",
            },
          },
          required: ["doublingTime", "explanation"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error fetching doubling time:", error);
    return { doublingTime: 0, explanation: "Failed to retrieve estimate. Please enter manually." };
  }
};
