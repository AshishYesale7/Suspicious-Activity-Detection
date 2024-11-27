import { create } from 'zustand';
import { Detection, Stats, Severity } from '../utils/detectionTypes';

interface DetectionState {
  isDetecting: boolean;
  detections: Detection[];
  stats: Stats;
  alertActive: boolean;
  alertLevel: Severity;
  modelLoadingProgress: number;
  setDetecting: (detecting: boolean) => void;
  addDetection: (detection: Detection) => void;
  updateStats: (type: keyof Stats) => void;
  setAlertStatus: (active: boolean, level: Severity) => void;
  setModelLoadingProgress: (progress: number) => void;
  resetState: () => void;
}

const initialStats: Stats = {
  fighting: 0,
  theft: 0,
  fire: 0,
  suspicious: 0
};

export const useDetectionStore = create<DetectionState>((set) => ({
  isDetecting: false,
  detections: [],
  stats: initialStats,
  alertActive: false,
  alertLevel: 'none',
  modelLoadingProgress: 0,

  setDetecting: (detecting) => set({ isDetecting: detecting }),
  
  addDetection: (detection) => set((state) => ({
    detections: [detection, ...state.detections].slice(0, 10)
  })),
  
  updateStats: (type) => set((state) => ({
    stats: {
      ...state.stats,
      [type]: state.stats[type] + 1
    }
  })),
  
  setAlertStatus: (active, level) => set({
    alertActive: active,
    alertLevel: level
  }),
  
  setModelLoadingProgress: (progress) => set({
    modelLoadingProgress: progress
  }),
  
  resetState: () => set({
    detections: [],
    stats: initialStats,
    alertActive: false,
    alertLevel: 'none',
    modelLoadingProgress: 0
  })
}));