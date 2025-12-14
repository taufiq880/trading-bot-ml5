import { GoogleGenAI, Type } from "@google/genai";
import { BotConfig, Candle, AIAnalysisResult, IndicatorStats } from "../types";
import { GEMINI_MODEL } from "../constants";

// Initialize the API client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const analyzeMarket = async (
  candles: Candle[], 
  config: BotConfig,
  indicators: IndicatorStats 
): Promise<AIAnalysisResult> => {
  if (!apiKey) {
    return {
      sentiment: 'NEUTRAL',
      confidence: 0,
      recommendation: "API Key missing.",
      reasoning: "Cannot connect to Gemini AI."
    };
  }

  const currentPrice = candles[candles.length - 1].close;

  const prompt = `
    You are an expert high-frequency trading bot for MT5.
    
    Current Configuration:
    - Symbol: ${config.symbol}
    - Price: ${currentPrice.toFixed(5)}
    - Strategy: ${config.strategy} ${config.strategy === 'SCALPING' ? '(Focus on quick, short-term entries)' : ''}
    
    Technical Indicators (Calculated):
    1. RSI (14): ${indicators.rsi.toFixed(2)}
    2. MACD Histogram: ${indicators.macd.histogram.toFixed(6)}
    3. Bollinger Bands: Upper ${indicators.bollinger.upper.toFixed(5)}, Lower ${indicators.bollinger.lower.toFixed(5)}.
    4. EMA (20): ${indicators.ema.toFixed(5)}
    5. Stochastic: %K ${indicators.stochastic.k.toFixed(1)}
    
    Task:
    Analyze these 5 indicators. 
    ${config.strategy === 'SCALPING' ? 'Since strategy is SCALPING, look for small price deviations at Bollinger bands combined with Stochastic crossovers.' : 'Look for trend confirmation.'}
    
    Return JSON:
    {
      "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
      "confidence": number (0-100),
      "recommendation": "string (Action: Buy/Sell/Hold)",
      "reasoning": "string (Short concise explanation)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
            confidence: { type: Type.NUMBER },
            recommendation: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
          required: ['sentiment', 'confidence', 'recommendation', 'reasoning']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      sentiment: 'NEUTRAL',
      confidence: 0,
      recommendation: "Analysis Error",
      reasoning: "Failed to process market data."
    };
  }
};

export const generateStrategyCode = async (description: string): Promise<string> => {
    if (!apiKey) return "// API Key missing";

    const prompt = `
    Generate MQL5 code for a MetaTrader 5 Expert Advisor (EA).
    Requirement: ${description}
    Include imports, OnTick(), and Trade classes.
    Ensure the code is complete and compilable.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert MQL5 developer. Output only raw code. No markdown formatting."
            }
        });
        return response.text || "// Failed to generate code";
    } catch (e) {
        return "// Error generating code";
    }
}

export const fixStrategyCode = async (currentCode: string, errorDescription: string): Promise<string> => {
    if (!apiKey) return "// API Key missing";

    const prompt = `
    You are an expert MQL5 developer.
    
    The user has the following MQL5 code:
    
    ${currentCode}
    
    They encountered this error or have this request: "${errorDescription}"
    
    Task: Fix the code or apply the requested changes.
    Output: Return ONLY the full corrected MQL5 source code. Do not include markdown blocks or explanations.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert MQL5 developer. Output only raw code. No markdown formatting."
            }
        });
        return response.text || "// Failed to fix code";
    } catch (e) {
        return "// Error fixing code";
    }
}
