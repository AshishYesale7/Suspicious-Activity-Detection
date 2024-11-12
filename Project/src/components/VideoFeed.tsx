import React, { useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { socketService } from '../services/socket';
import { useDetection } from '../hooks/useDetection';
import DetectionStatus from './DetectionStatus';
import ControlButton from './ControlButton';

const VideoFeed = () => {
  const webcamRef = useRef<Webcam>(null);
  const { state, toggleDetection } = useDetection();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isDetecting && state.isConnected) {
      interval = setInterval(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          socketService.analyzeFrame(imageSrc);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isDetecting, state.isConnected]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          className="rounded-lg shadow-lg w-full max-w-3xl mx-auto"
          screenshotFormat="image/jpeg"
        />
        <DetectionStatus
          result={state.lastResult}
          isConnected={state.isConnected}
        />
      </div>
      <ControlButton
        isDetecting={state.isDetecting}
        isConnected={state.isConnected}
        onClick={toggleDetection}
      />
    </div>
  );
};

export default VideoFeed;