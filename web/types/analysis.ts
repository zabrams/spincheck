export interface BiasAnalysis {
  score: 0 | 1 | 2 | 3;
  direction: 'left' | 'right' | 'none';
  summary: string;
  isEditorial: boolean;
  presentsBothSides: boolean;
  usesConjecture: boolean;
  analysis: string;
  evidence: string[];
  furtherReading: Array<{
    description: string;
    searchQuery: string;
  }>;
  steelMan: {
    topic: string;
    left: string;
    right: string;
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
