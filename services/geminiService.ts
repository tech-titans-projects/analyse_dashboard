import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: {
            type: Type.STRING,
            description: "The original text that was analyzed.",
          },
          sentiment: {
            type: Type.STRING,
            enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
            description: "The sentiment of the text."
          },
          confidence: {
            type: Type.NUMBER,
            description: "A confidence score between 0.0 and 1.0 for the sentiment classification.",
          },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Key words or phrases that drove the sentiment."
          },
          explanation: {
            type: Type.STRING,
            description: "A brief explanation for the sentiment classification."
          }
        },
        required: ['originalText', 'sentiment', 'confidence', 'keywords', 'explanation']
      }
    }
  },
  required: ['results'],
};


export const analyzeSentiment = async (texts: string[]): Promise<AnalysisResult[]> => {
  // Fix: Removed API key availability check as per the coding guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const formattedTexts = texts.map(text => `- "${text}"`).join('\n');

  const prompt = `
    Analyze the sentiment of the following texts. For each text, provide:
    1. The original text itself.
    2. The sentiment as 'POSITIVE', 'NEGATIVE', or 'NEUTRAL'.
    3. A confidence score for the classification, from 0.0 to 1.0.
    4. An array of the key phrases or words that most influenced the sentiment.
    5. A brief explanation for why the text received its sentiment score.

    Return the output as a single, valid JSON object that strictly adheres to the provided schema.

    Texts to analyze:
    ${formattedTexts}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });
    
    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    
    if (!parsedJson.results) {
      throw new Error("Invalid response format from API. Missing 'results' field.");
    }

    return parsedJson.results as AnalysisResult[];

  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to analyze sentiment. The API returned an error or an invalid format.");
  }
};

const suggestionsSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of spelling suggestions. Should be empty if the original word is correct."
    }
  },
  required: ['suggestions'],
};

export const getSpellingSuggestions = async (word: string): Promise<string[]> => {
  if (!word || word.length < 2) {
    return [];
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Provide up to 5 correct English spelling suggestions for the word "${word}".
    If the word is already spelled correctly, return an empty array for "suggestions".
    Only provide suggestions, do not provide any explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestionsSchema,
        temperature: 0.2, // We want deterministic, likely suggestions
      },
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    
    if (parsedJson.suggestions && Array.isArray(parsedJson.suggestions)) {
      return parsedJson.suggestions;
    }
    return [];

  } catch (error) {
    console.error("Gemini API call for suggestions failed:", error);
    // Don't throw, just return empty array for graceful degradation
    return [];
  }
};