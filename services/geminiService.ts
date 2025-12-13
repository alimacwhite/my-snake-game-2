import { GoogleGenAI } from "@google/genai";

const TIMEOUT_MS = 5000;
const MAX_RETRIES = 1;

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FALLBACK_MESSAGES: Record<string, string> = {
  start: "System initialized. Good luck!",
  eat: "Tasty!",
  die: "Mission Failed.",
  highscore: "New Record Set!"
};

export const generateGameCommentary = async (
  score: number,
  event: 'start' | 'eat' | 'die' | 'highscore',
  previousHighScore: number
): Promise<string> => {
  if (!process.env.API_KEY) return "AI Offline (No API Key)";

  const modelId = 'gemini-2.5-flash';

  let prompt = "";
  switch (event) {
    case 'start':
      prompt = "The player just started a new game of Snake. Give a short, 5-word hype intro.";
      break;
    case 'eat':
      // Only comment occasionally on eating to save tokens/latency in a real app
      prompt = `The player just ate food. Score is now ${score}. Give a 3-word encouraging remark.`;
      break;
    case 'die':
      prompt = `The player died in Snake with a score of ${score}. Previous high score was ${previousHighScore}. Give a sarcastic or sympathetic 1-sentence comment depending on if they beat the high score.`;
      break;
    case 'highscore':
      prompt = `NEW HIGH SCORE in Snake! Score: ${score}. Go wild! 1 sentence.`;
      break;
  }

  let attempt = 0;
  
  while (attempt <= MAX_RETRIES) {
    try {
      // Create a timeout promise that rejects after TIMEOUT_MS
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), TIMEOUT_MS)
      );

      // Race the API call against the timeout
      const response = await Promise.race([
        ai.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            systemInstruction: "You are a witty, retro-arcade style commentator named 'NeonBit'. You are brief, energetic, and sometimes snarky.",
            temperature: 0.8,
            maxOutputTokens: 50,
          }
        }),
        timeoutPromise
      ]);
      
      return response.text || "";
    } catch (error) {
      attempt++;
      console.warn(`Gemini API attempt ${attempt} failed:`, error);
      
      if (attempt > MAX_RETRIES) {
        // Return a safe fallback on final failure so the UI isn't silent
        return FALLBACK_MESSAGES[event] || "";
      }
      // Loop continues for retry
    }
  }
  
  return "";
};