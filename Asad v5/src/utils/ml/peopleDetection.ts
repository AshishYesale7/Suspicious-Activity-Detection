import * as tf from '@tensorflow/tfjs';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { DetectedObject } from '@tensorflow-models/coco-ssd';

interface PersonDetection {
  id: string;
  bbox: [number, number, number, number];
  score: number;
  age?: number;
  pose?: poseDetection.Pose;
  tracking?: {
    velocity: { x: number; y: number };
    direction: string;
    isMoving: boolean;
  };
}

export class PeopleDetector {
  private segmenter: bodySegmentation.BodySegmenter | null = null;
  private poseDetector: poseDetection.PoseDetector | null = null;
  private previousDetections: Map<string, PersonDetection> = new Map();
  private frameCount: number = 0;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Initialize body segmentation
      this.segmenter = await bodySegmentation.createSegmenter(
        bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
        {
          runtime: 'tfjs',
          modelType: 'general'
        }
      );

      // Initialize pose detector
      this.poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
          enableTracking: true,
          trackerType: 'boundingBox'
        }
      );
    } catch (error) {
      console.error('Error initializing detectors:', error);
    }
  }

  public async detectPeople(
    video: HTMLVideoElement,
    objectDetections: DetectedObject[]
  ): Promise<PersonDetection[]> {
    if (!this.segmenter || !this.poseDetector) {
      return [];
    }

    try {
      // Get body segments
      const segments = await this.segmenter.segmentPeople(video);
      
      // Get poses
      const poses = await this.poseDetector.estimatePoses(video);

      // Match poses with segments and object detections
      const detections: PersonDetection[] = await Promise.all(
        poses.map(async (pose) => {
          const bbox = this.calculateBoundingBox(pose.keypoints);
          const id = pose.id?.toString() || Math.random().toString(36).substr(2, 9);
          
          // Calculate tracking information
          const tracking = this.calculateTracking(id, bbox);

          // Estimate age if person is detected clearly
          const age = await this.estimateAge(video, bbox);

          return {
            id,
            bbox,
            score: pose.score || 0,
            pose,
            age,
            tracking
          };
        })
      );

      // Update previous detections
      this.updatePreviousDetections(detections);
      this.frameCount++;

      return detections;
    } catch (error) {
      console.error('Error detecting people:', error);
      return [];
    }
  }

  private calculateBoundingBox(keypoints: poseDetection.Keypoint[]): [number, number, number, number] {
    const validKeypoints = keypoints.filter(kp => kp.score && kp.score > 0.5);
    
    if (validKeypoints.length === 0) {
      return [0, 0, 0, 0];
    }

    const xs = validKeypoints.map(kp => kp.x);
    const ys = validKeypoints.map(kp => kp.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return [minX, minY, maxX - minX, maxY - minY];
  }

  private calculateTracking(
    id: string,
    currentBbox: [number, number, number, number]
  ) {
    const previous = this.previousDetections.get(id);
    
    if (!previous) {
      return {
        velocity: { x: 0, y: 0 },
        direction: 'stationary',
        isMoving: false
      };
    }

    const dx = currentBbox[0] - previous.bbox[0];
    const dy = currentBbox[1] - previous.bbox[1];
    const velocity = {
      x: dx / (1/30), // Assuming 30fps
      y: dy / (1/30)
    };

    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const isMoving = speed > 5; // 5 pixels per frame threshold

    let direction = 'stationary';
    if (isMoving) {
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
    }

    return { velocity, direction, isMoving };
  }

  private async estimateAge(
    video: HTMLVideoElement,
    bbox: [number, number, number, number]
  ): Promise<number | undefined> {
    try {
      // Extract face region
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      // Expand bbox slightly to ensure face is included
      const [x, y, width, height] = bbox;
      const expansion = 0.2; // 20% expansion
      const expandedBbox = [
        x - width * expansion,
        y - height * expansion,
        width * (1 + 2 * expansion),
        height * (1 + 2 * expansion)
      ];

      canvas.width = expandedBbox[2];
      canvas.height = expandedBbox[3];

      ctx.drawImage(
        video,
        expandedBbox[0], expandedBbox[1], expandedBbox[2], expandedBbox[3],
        0, 0, canvas.width, canvas.height
      );

      // Simple age estimation based on face size and position
      // This is a placeholder - in a real application, you'd want to use a proper age estimation model
      const faceSize = width * height;
      const relativeHeight = y / video.height;
      
      // Very basic heuristic
      let estimatedAge = 30;
      if (faceSize < 5000) estimatedAge -= 10;
      if (faceSize > 15000) estimatedAge += 10;
      if (relativeHeight < 0.3) estimatedAge -= 5;
      
      return Math.max(1, Math.min(100, estimatedAge));
    } catch (error) {
      console.error('Error estimating age:', error);
      return undefined;
    }
  }

  private updatePreviousDetections(detections: PersonDetection[]) {
    this.previousDetections.clear();
    detections.forEach(detection => {
      this.previousDetections.set(detection.id, detection);
    });
  }

  public getTrackingStats(): {
    totalPeople: number;
    moving: number;
    stationary: number;
    averageAge?: number;
  } {
    const detections = Array.from(this.previousDetections.values());
    const moving = detections.filter(d => d.tracking?.isMoving).length;
    
    const ages = detections
      .map(d => d.age)
      .filter((age): age is number => age !== undefined);
    
    const averageAge = ages.length > 0
      ? ages.reduce((a, b) => a + b, 0) / ages.length
      : undefined;

    return {
      totalPeople: detections.length,
      moving,
      stationary: detections.length - moving,
      averageAge
    };
  }
}