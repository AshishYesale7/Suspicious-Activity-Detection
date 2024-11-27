import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { DetectedObject } from '@tensorflow-models/coco-ssd';

interface TrackedObject extends DetectedObject {
  id: string;
  trajectory: Array<[number, number]>;
  velocity: { x: number; y: number };
  lastSeen: number;
  isMoving: boolean;
  interactionCount: number;
}

export class ObjectTracker {
  private objectDetector: cocoSsd.ObjectDetection | null = null;
  private trackedObjects: Map<string, TrackedObject> = new Map();
  private readonly maxTrajectoryLength = 30; // 1 second at 30fps
  private readonly objectTimeout = 1000; // 1 second
  private frameCount = 0;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.objectDetector = await cocoSsd.load({
        base: 'lite',
        modelUrl: undefined
      });
    } catch (error) {
      console.error('Error initializing object detector:', error);
    }
  }

  public async detectAndTrackObjects(
    video: HTMLVideoElement
  ): Promise<TrackedObject[]> {
    if (!this.objectDetector) {
      return [];
    }

    try {
      const detections = await this.objectDetector.detect(video);
      const currentTime = Date.now();

      // Update existing tracks and create new ones
      const updatedObjects = this.updateTracks(detections, currentTime);
      
      // Remove stale tracks
      this.removeStaleObjects(currentTime);

      this.frameCount++;
      return Array.from(this.trackedObjects.values());
    } catch (error) {
      console.error('Error tracking objects:', error);
      return [];
    }
  }

  private updateTracks(
    detections: DetectedObject[],
    currentTime: number
  ): TrackedObject[] {
    const updated: TrackedObject[] = [];

    detections.forEach(detection => {
      const [x, y, width, height] = detection.bbox;
      const center: [number, number] = [x + width/2, y + height/2];

      // Try to match with existing tracks
      let matched = false;
      this.trackedObjects.forEach(trackedObj => {
        const lastPos = trackedObj.trajectory[trackedObj.trajectory.length - 1];
        const distance = Math.sqrt(
          Math.pow(center[0] - lastPos[0], 2) +
          Math.pow(center[1] - lastPos[1], 2)
        );

        // If close enough, update existing track
        if (distance < 50 && trackedObj.class === detection.class) {
          this.updateTrackedObject(trackedObj, detection, center, currentTime);
          matched = true;
          updated.push(trackedObj);
        }
      });

      // If no match found, create new track
      if (!matched) {
        const newObject = this.createNewTrackedObject(detection, center, currentTime);
        this.trackedObjects.set(newObject.id, newObject);
        updated.push(newObject);
      }
    });

    return updated;
  }

  private updateTrackedObject(
    trackedObj: TrackedObject,
    detection: DetectedObject,
    center: [number, number],
    currentTime: number
  ) {
    // Update trajectory
    trackedObj.trajectory.push(center);
    if (trackedObj.trajectory.length > this.maxTrajectoryLength) {
      trackedObj.trajectory.shift();
    }

    // Update velocity
    if (trackedObj.trajectory.length >= 2) {
      const prevPos = trackedObj.trajectory[trackedObj.trajectory.length - 2];
      trackedObj.velocity = {
        x: (center[0] - prevPos[0]) / (1/30), // Assuming 30fps
        y: (center[1] - prevPos[1]) / (1/30)
      };
      
      const speed = Math.sqrt(
        Math.pow(trackedObj.velocity.x, 2) +
        Math.pow(trackedObj.velocity.y, 2)
      );
      trackedObj.isMoving = speed > 5; // 5 pixels per frame threshold
    }

    // Update other properties
    trackedObj.bbox = detection.bbox;
    trackedObj.score = detection.score;
    trackedObj.lastSeen = currentTime;
  }

  private createNewTrackedObject(
    detection: DetectedObject,
    center: [number, number],
    currentTime: number
  ): TrackedObject {
    return {
      ...detection,
      id: Math.random().toString(36).substr(2, 9),
      trajectory: [center],
      velocity: { x: 0, y: 0 },
      lastSeen: currentTime,
      isMoving: false,
      interactionCount: 0
    };
  }

  private removeStaleObjects(currentTime: number) {
    this.trackedObjects.forEach((obj, id) => {
      if (currentTime - obj.lastSeen > this.objectTimeout) {
        this.trackedObjects.delete(id);
      }
    });
  }

  public getObjectStats(): {
    totalObjects: number;
    movingObjects: number;
    stationaryObjects: number;
    objectsByClass: { [key: string]: number };
  } {
    const objects = Array.from(this.trackedObjects.values());
    const movingObjects = objects.filter(obj => obj.isMoving).length;
    
    const objectsByClass = objects.reduce((acc, obj) => {
      acc[obj.class] = (acc[obj.class] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalObjects: objects.length,
      movingObjects,
      stationaryObjects: objects.length - movingObjects,
      objectsByClass
    };
  }

  public detectInteractions(peopleDetections: any[]): void {
    this.trackedObjects.forEach(obj => {
      peopleDetections.forEach(person => {
        const [px, py, pw, ph] = person.bbox;
        const [ox, oy, ow, oh] = obj.bbox;

        // Check for overlap or proximity
        const isNear = (
          Math.abs((px + pw/2) - (ox + ow/2)) < (pw + ow)/2 + 50 &&
          Math.abs((py + ph/2) - (oy + oh/2)) < (ph + oh)/2 + 50
        );

        if (isNear) {
          obj.interactionCount++;
        }
      });
    });
  }
}