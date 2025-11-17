
export enum Sentiment {
  Positive = 'POSITIVE',
  Negative = 'NEGATIVE',
  Neutral = 'NEUTRAL',
}

export interface AnalysisResult {
  originalText: string;
  sentiment: Sentiment;
  confidence: number;
  keywords: string[];
  explanation: string;
}
