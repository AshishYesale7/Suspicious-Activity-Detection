import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { AlertTriangle, Bell, Camera, Shield } from 'lucide-react';
import { analyzeMotion } from '../utils/motionDetection';

interface Detection {
  timestamp: number;
  type: string;
  confidence: number;
}

const SecurityMonitor: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [alertActive, setAlertActive] = useState(false);
  const previousKeypointsRef = useRef<poseDetection.Keypoint[]>([]);

  useEffect(() => {
    let faceDetector: blazeface.BlazeFaceModel;
    let poseDetector: poseDetection.PoseDetector;
    let animationFrameId: number;

    const loadModels = async () => {
      await tf.ready();
      faceDetector = await blazeface.load();
      poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
    };

    const detectFrame = async () => {
      if (!webcamRef.current || !canvasRef.current || !faceDetector || !poseDetector) return;

      const video = webcamRef.current.video;
      if (!video || !video.readyState) return;

      const faces = await faceDetector.estimateFaces(video, false);
      const poses = await poseDetector.estimatePoses(video);

      const newDetections: Detection[] = [];
      let currentAlertActive = false;

      // Analyze poses for fighting/boxing movements
      if (poses.length > 0) {
        const pose = poses[0];
        const motionAnalysis = analyzeMotion(pose.keypoints, previousKeypointsRef.current);
        previousKeypointsRef.current = [...pose.keypoints];

        if (motionAnalysis.isAggressive) {
          newDetections.push({
            timestamp: Date.now(),
            type: 'Fighting/Boxing Detected',
            confidence: motionAnalysis.confidence
          });
          currentAlertActive = true;
        } else if (motionAnalysis.isPunchingMotion) {
          newDetections.push({
            timestamp: Date.now(),
            type: 'Aggressive Movement Detected',
            confidence: motionAnalysis.confidence
          });
          currentAlertActive = true;
        }
      }

      // Detect multiple faces as potential conflict
      if (faces.length > 1) {
        newDetections.push({
          timestamp: Date.now(),
          type: 'Multiple People - Potential Conflict',
          confidence: 0.9
        });
        currentAlertActive = true;
      }

      // Draw detections
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = currentAlertActive ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 2;

      // Draw face boxes
      faces.forEach(face => {
        const start = face.topLeft as [number, number];
        const end = face.bottomRight as [number, number];
        const size = [end[0] - start[0], end[1] - start[1]];
        ctx.strokeRect(start[0], start[1], size[0], size[1]);
      });

      // Draw pose keypoints and connections
      poses.forEach(pose => {
        // Draw keypoints
        pose.keypoints.forEach(point => {
          if (point.score && point.score > 0.5) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = currentAlertActive ? '#ef4444' : '#22c55e';
            ctx.fill();
          }
        });

        // Draw connections for better visualization
        const connections = [
          ['left_shoulder', 'right_shoulder'],
          ['left_shoulder', 'left_elbow'],
          ['right_shoulder', 'right_elbow'],
          ['left_elbow', 'left_wrist'],
          ['right_elbow', 'right_wrist'],
        ];

        connections.forEach(([from, to]) => {
          const fromPoint = pose.keypoints.find(kp => kp.name === from);
          const toPoint = pose.keypoints.find(kp => kp.name === to);

          if (fromPoint?.score && toPoint?.score && 
              fromPoint.score > 0.5 && toPoint.score > 0.5) {
            ctx.beginPath();
            ctx.moveTo(fromPoint.x, fromPoint.y);
            ctx.lineTo(toPoint.x, toPoint.y);
            ctx.strokeStyle = currentAlertActive ? '#ef4444' : '#22c55e';
            ctx.stroke();
          }
        });
      });

      if (newDetections.length > 0) {
        setDetections(prev => [...newDetections, ...prev].slice(0, 5));
        setAlertActive(currentAlertActive);
      }

      if (isDetecting) {
        animationFrameId = requestAnimationFrame(detectFrame);
      }
    };

    if (isDetecting) {
      loadModels().then(() => {
        detectFrame();
      });
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isDetecting]);

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
    setAlertActive(false);
    setDetections([]);
    previousKeypointsRef.current = [];
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            <h1 className="text-2xl font-bold">Security Monitoring System</h1>
          </div>
          <button
            onClick={toggleDetection}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isDetecting
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isDetecting ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 relative">
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <Webcam
                ref={webcamRef}
                className="absolute inset-0 w-full h-full object-cover"
                mirrored={false}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                width={640}
                height={480}
              />
              {alertActive && (
                <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded-lg" />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-semibold">Activity Log</h2>
              </div>
              {detections.length === 0 ? (
                <p className="text-gray-400">No suspicious activities detected</p>
              ) : (
                <div className="space-y-4">
                  {detections.map((detection, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{detection.type}</p>
                        <p className="text-sm text-gray-400">
                          Confidence: {(detection.confidence * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(detection.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Camera Status</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-500">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Detection Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isDetecting
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {isDetecting ? 'Running' : 'Stopped'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Alert Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      alertActive
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {alertActive ? 'Alert Active' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitor;