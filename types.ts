export interface UserProfile {
  allergens: string[];
}

export type RiskLevel = 'SAFE' | 'WARNING' | 'DANGER';

export interface AnalysisResult {
  riskLevel: RiskLevel;
  detectedAllergens: string[];
  reasoning: string;
}

export enum AppView {
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  RESULT = 'RESULT',
  PROFILE = 'PROFILE' // Explicit profile editing
}