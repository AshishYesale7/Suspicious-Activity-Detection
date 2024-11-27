import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Shield } from 'lucide-react';
import { analyzeActivity } from '../utils/activityDetection';
import { Detection, Stats, Severity } from '../utils/detectionTypes';
import ActivityLog from './ActivityLog';
import DetectionStats from './DetectionStats';
import SystemStatus from './SystemStatus';

const UPDATE_INTERVAL = 3000; // 3 seconds for activity log updates

const SecurityMonitor: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [alertActive, setAlertActive] = useState(false);
  const [alertLevel, setAlertLevel] = useState<Severity>('none');
  const [stats, setStats] = useState<Stats>({
    fighting: 0,
    theft: 0,
    fire: 0,
    suspicious: 0
  });

  const previousKeypointsRef = useRef<poseDetection.Keypoint[]>([]);
  const previousVelocitiesRef = useRef<{ [key: string]: number }>({});
  const lastSuspiciousTimeRef = useRef<{ current: number }>({ current: 0 });
  const lastUpdateTimeRef = useRef<number>(0);

  const toggleDetection = useCallback(() => {
    setIsDetecting(prev => !prev);
    setAlertActive(false);
    setDetections([]);
    previousKeypointsRef.current = [];
    previousVelocitiesRef.current = {};
    lastSuspiciousTimeRef.current.current = 0;
  }, []);

  useEffect(() => {
    let faceDetector: blazeface.BlazeFaceModel;
    let poseDetector: poseDetection.PoseDetector;
    let objectDetector: cocoSsd.ObjectDetection;
    let animationFrameId: number;

    const loadModels = async () => {
      await tf.ready();
      faceDetector = await blazeface.load();
      poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
      objectDetector = await cocoSsd.load();
    };

    const detectFrame = async () => {
      if (!webcamRef.current?.video || !canvasRef.current || !faceDetector || !poseDetector || !objectDetector) return;

      const video = webcamRef.current.video;
      if (!video.readyState) return;

      // Run detections
      const faces = await faceDetector.estimateFaces(video, false);
      const poses = await poseDetector.estimatePoses(video);
      const objects = await objectDetector.detect(video);

      // Analyze activity
      if (poses.length > 0) {
        const analysis = analyzeActivity(
          poses[0].keypoints,
          previousKeypointsRef.current,
          objects,
          previousVelocitiesRef.current,
          lastSuspiciousTimeRef.current
        );

        const now = Date.now();

        // Update stats and detections at intervals
        if (now - lastUpdateTimeRef.current >= UPDATE_INTERVAL) {
          if (analysis.type !== 'normal') {
            setStats(prev => ({
              ...prev,
              [analysis.type]: prev[analysis.type] + 1
            }));

            const newDetection: Detection = {
              timestamp: now,
              type: analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1),
              confidence: analysis.confidence,
              details: analysis.details,
              severity: analysis.severity
            };

            setDetections(prev => [newDetection, ...prev].slice(0, 10));
          }
          lastUpdateTimeRef.current = now;
        }

        // Update alert status
        if (analysis.type !== 'normal') {
          setAlertActive(true);
          setAlertLevel(analysis.severity);
        } else {
          setAlertActive(false);
          setAlertLevel('none');
        }

        previousKeypointsRef.current = [...poses[0].keypoints];
      }

      // Draw detections
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw with current alert status
      const currentColor = alertActive ? 
        alertLevel === 'high' ? '#ef4444' : 
        alertLevel === 'medium' ? '#f97316' : 
        alertLevel === 'low' ? '#eab308' : '#22c55e'
        : '#22c55e';

      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;

      // Draw detections
      faces.forEach(face => {
        const start = face.topLeft as [number, number];
        const end = face.bottomRight as [number, number];
        const size = [end[0] - start[0], end[1] - start[1]];
        ctx.strokeRect(start[0], start[1], size[0], size[1]);
      });

      // Draw pose keypoints
      poses.forEach(pose => {
        pose.keypoints.forEach(point => {
          if (point.score && point.score > 0.5) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = currentColor;
            ctx.fill();
          }
        });
      });

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
              <div className={`absolute inset-0 ${
                alertActive
                  ? alertLevel === 'high'
                    ? 'bg-red-500/10'
                    : alertLevel === 'medium'
                    ? 'bg-orange-500/10'
                    : 'bg-yellow-500/10'
                  : 'bg-emerald-500/10'
              } transition-colors duration-300`} />
            </div>
          </div>

          <div className="space-y-6">
            <ActivityLog detections={detections} />
            <DetectionStats stats={stats} />
            <SystemStatus isDetecting={isDetecting} alertLevel={alertLevel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitor;