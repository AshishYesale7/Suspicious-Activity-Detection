export interface DetectionResult {
  isSuspicious: boolean;
  confidence: number;
  timestamp: number;
}

export interface DetectionState {
  isDetecting: boolean;
  isConnected: boolean;
  lastResult: DetectionResult | null;
}