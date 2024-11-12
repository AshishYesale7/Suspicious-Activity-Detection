import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { socket } from '../services/socket';

const VideoFeed = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<{
    isSuspicious: boolean;
    confidence: number;
  } | null>(null);

  useEffect(() => {
    socket.on('detection_result', (result) => {
      setDetectionResult(result);
    });

    return () => {
      socket.off('detection_result');
    };
  }, []);

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
    if (!isDetecting) {
      startDetection();
    }
  };

  const startDetection = () => {
    const interval = setInterval(() => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        socket.emit('analyze_frame', { frame: imageSrc });
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          className="rounded-lg shadow-lg w-full max-w-3xl mx-auto"
          screenshotFormat="image/jpeg"
        />
        {detectionResult && (
          <div
            className={`absolute top-4 right-4 px-4 py-2 rounded-full ${
              detectionResult.isSuspicious
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            {detectionResult.isSuspicious ? 'Suspicious' : 'Normal'}
            {' '}({(detectionResult.confidence * 100).toFixed(1)}%)
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <button
          onClick={toggleDetection}
          className={`px-6 py-2 rounded-lg font-semibold ${
            isDetecting
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </button>
      </div>
    </div>
  );
};

export default VideoFeed;