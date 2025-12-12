import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const apiKey = process.env.API_KEY || ''; 
// Note: In a real prod env, we'd handle missing keys gracefully, 
// but for this demo, we assume the environment injects it.

const ai = new GoogleGenAI({ apiKey });

export const generateGameCommentary = async (
  score: number,
  event: 'start' | 'eat' | 'die' | 'highscore',
  previousHighScore: number
): Promise<string> => {
  if (!apiKey) return "AI Offline (No API Key)";

  const modelId = 'gemini-2.5-flash';

  let prompt = "";
  switch (event) {
    case 'start':
      prompt = "The player just started a new game of Snake. Give a short, 5-word hype intro.";
      break;
    case 'eat':
      // Only comment occasionally on eating to save tokens/latency in a real app, 
      // but here we might call it. For safety, let's keep it generic.
      prompt = `The player just ate food. Score is now ${score}. Give a 3-word encouraging remark.`;
      break;
    case 'die':
      prompt = `The player died in Snake with a score of ${score}. Previous high score was ${previousHighScore}. Give a sarcastic or sympathetic 1-sentence comment depending on if they beat the high score.`;
      break;
    case 'highscore':
      prompt = `NEW HIGH SCORE in Snake! Score: ${score}. Go wild! 1 sentence.`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "You are a witty, retro-arcade style commentator named 'NeonBit'. You are brief, energetic, and sometimes snarky.",
        temperature: 0.8,
        maxOutputTokens: 50,
      }
    });
    
    return response.text || "...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};