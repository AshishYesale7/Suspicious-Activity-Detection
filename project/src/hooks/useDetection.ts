import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { DetectionResult, DetectionState } from '../types/detection';

export const useDetection = () => {
  const [state, setState] = useState<DetectionState>({
    isDetecting: false,
    isConnected: false,
    lastResult: null,
  });

  useEffect(() => {
    socketService.connect();

    socketService.onConnect(() => {
      setState(prev => ({ ...prev, isConnected: true }));
    });

    socketService.onDisconnect(() => {
      setState(prev => ({ ...prev, isConnected: false }));
    });

    socketService.onDetectionResult((result: DetectionResult) => {
      setState(prev => ({ ...prev, lastResult: result }));
      if (result.isSuspicious) {
        notifyUser(result);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const notifyUser = useCallback((result: DetectionResult) => {
    if (Notification.permission === 'granted') {
      new Notification('Suspicious Activity Detected', {
        body: `Confidence: ${(result.confidence * 100).toFixed(1)}%`,
        icon: '/alert-icon.png',
      });
    }
  }, []);

  const toggleDetection = useCallback(() => {
    if (!state.isConnected) {
      alert('Not connected to server. Please try again.');
      return;
    }
    setState(prev => ({ ...prev, isDetecting: !prev.isDetecting }));
  }, [state.isConnected]);

  return {
    state,
    toggleDetection,
  };
};