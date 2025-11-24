import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateChatResponse = async (
  message: string, 
  context?: string
): Promise<string> => {
  try {
    const systemPrompt = `You are RoboNeo, an intelligent design assistant for an advanced image editing tool. 
    The user is working on a canvas. Help them with image editing concepts, prompt generation for inpainting, or general questions.
    Keep answers concise and helpful. 
    ${context ? `Current Context: ${context}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error connecting to the AI service.";
  }
};
