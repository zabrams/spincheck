export interface BiasAnalysis {
  /** 0-10 scale. 0 = no bias; 10 = extreme propaganda. Direction encodes left/right. */
  score: number;
  direction: 'left' | 'right' | 'none';
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  isEditorial: boolean;
  presentsBothSides: boolean;
  usesEmotionalLanguage: boolean;
  hasSelectiveSourcing: boolean;
  hasMisleadingHeadline: boolean;
  analysis: string;
  framingEvidence: string[];
  omissionEvidence: string[];
  furtherReading: Array<{
    description: string;
    searchQuery: string;
  }>;
  perspectives: {
    topic: string;
    articleView: string;
    opposingView: string | null;
    commonGround: string | null;
  };
}

export interface AnalyzeRequest {
  content: string;
  url?: string;
  title?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: BiasAnalysis;
  error?: string;
}
