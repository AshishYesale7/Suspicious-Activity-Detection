export type Severity = 'none' | 'low' | 'medium' | 'high';

export interface Detection {
  timestamp: number;
  type: string;
  confidence: number;
  details: string;
  severity: Severity;
}

export interface Stats {
  fighting: number;
  theft: number;
  fire: number;
  suspicious: number;
}

export interface ActivityAnalysis {
  type: 'normal' | 'fighting' | 'theft' | 'fire' | 'suspicious';
  confidence: number;
  details: string;
  severity: Severity;
}