import * as tf from '@tensorflow/tfjs';
import { Keypoint } from '@tensorflow-models/pose-detection';
import { DetectedObject } from '@tensorflow-models/coco-ssd';

interface BehaviorPattern {
  type: string;
  confidence: number;
  details: string[];
  timestamp: number;
}

export class BehaviorAnalyzer {
  private readonly historySize = 30; // Store 1 second of data at 30fps
  private poseHistory: Keypoint[][] = [];
  private objectHistory: DetectedObject[][] = [];
  private model: tf.LayersModel | null = null;

  constructor() {
    this.loadModel();
  }

  private async loadModel() {
    try {
      // Load or create a simple behavior classification model
      this.model = await tf.loadLayersModel('indexeddb://behavior-model');
    } catch {
      // If no saved model exists, create a new one
      this.model = this.createModel();
      await this.model.save('indexeddb://behavior-model');
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [90] }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 5, activation: 'softmax' }) // 5 behavior classes
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  public updateHistory(pose: Keypoint[], objects: DetectedObject[]) {
    this.poseHistory.push(pose);
    this.objectHistory.push(objects);

    if (this.poseHistory.length > this.historySize) {
      this.poseHistory.shift();
      this.objectHistory.shift();
    }
  }

  private extractFeatures(): tf.Tensor {
    // Extract relevant features from pose and object histories
    const features: number[] = [];

    // Process pose features
    if (this.poseHistory.length > 0) {
      const latestPose = this.poseHistory[this.poseHistory.length - 1];
      latestPose.forEach(keypoint => {
        features.push(keypoint.x, keypoint.y, keypoint.score || 0);
      });
    }

    // Pad or truncate to fixed size
    while (features.length < 90) features.push(0);
    if (features.length > 90) features.length = 90;

    return tf.tensor2d([features]);
  }

  public async analyzeBehavior(): Promise<BehaviorPattern> {
    if (!this.model || this.poseHistory.length < 2) {
      return {
        type: 'unknown',
        confidence: 0,
        details: ['Insufficient data'],
        timestamp: Date.now()
      };
    }

    const features = this.extractFeatures();
    const prediction = await this.model.predict(features) as tf.Tensor;
    const [maxProb, behaviorIndex] = await this.getMaxPrediction(prediction);

    const behaviorTypes = ['normal', 'suspicious', 'aggressive', 'theft', 'emergency'];
    const details = this.generateBehaviorDetails(behaviorTypes[behaviorIndex], this.poseHistory, this.objectHistory);

    return {
      type: behaviorTypes[behaviorIndex],
      confidence: maxProb,
      details,
      timestamp: Date.now()
    };
  }

  private async getMaxPrediction(prediction: tf.Tensor): Promise<[number, number]> {
    const probabilities = await prediction.data();
    let maxProb = 0;
    let maxIndex = 0;

    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    return [maxProb, maxIndex];
  }

  private generateBehaviorDetails(
    behaviorType: string,
    poses: Keypoint[][],
    objects: DetectedObject[][]
  ): string[] {
    const details: string[] = [];

    // Analyze motion patterns
    if (poses.length >= 2) {
      const velocities = this.calculateVelocities(poses);
      const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
      
      if (avgVelocity > 30) details.push('Rapid movement detected');
      if (avgVelocity > 50) details.push('Extremely fast motion - possible emergency');
    }

    // Analyze object interactions
    if (objects.length > 0) {
      const latestObjects = objects[objects.length - 1];
      const suspiciousObjects = latestObjects.filter(obj => 
        ['knife', 'scissors', 'bottle'].includes(obj.class.toLowerCase())
      );

      if (suspiciousObjects.length > 0) {
        details.push(`Detected suspicious objects: ${suspiciousObjects.map(obj => obj.class).join(', ')}`);
      }
    }

    // Add behavior-specific details
    switch (behaviorType) {
      case 'suspicious':
        details.push('Unusual movement patterns detected');
        details.push('Potential suspicious behavior based on historical data');
        break;
      case 'aggressive':
        details.push('Aggressive posture detected');
        details.push('Rapid movement patterns consistent with confrontation');
        break;
      case 'theft':
        details.push('Suspicious interaction with objects');
        details.push('Movement patterns consistent with theft attempt');
        break;
      case 'emergency':
        details.push('Emergency situation detected');
        details.push('Urgent attention required');
        break;
    }

    return details;
  }

  private calculateVelocities(poses: Keypoint[][]): number[] {
    const velocities: number[] = [];
    
    for (let i = 1; i < poses.length; i++) {
      const currentPose = poses[i];
      const previousPose = poses[i - 1];

      currentPose.forEach((keypoint, index) => {
        if (keypoint.score && keypoint.score > 0.5 && previousPose[index]) {
          const velocity = Math.sqrt(
            Math.pow(keypoint.x - previousPose[index].x, 2) +
            Math.pow(keypoint.y - previousPose[index].y, 2)
          );
          velocities.push(velocity);
        }
      });
    }

    return velocities;
  }

  public async trainOnNewData(poses: Keypoint[][], labels: number[]) {
    if (!this.model) return;

    const features = poses.map(pose => {
      const poseFeatures: number[] = [];
      pose.forEach(keypoint => {
        poseFeatures.push(keypoint.x, keypoint.y, keypoint.score || 0);
      });
      while (poseFeatures.length < 90) poseFeatures.push(0);
      if (poseFeatures.length > 90) poseFeatures.length = 90;
      return poseFeatures;
    });

    const xs = tf.tensor2d(features);
    const ys = tf.oneHot(labels, 5);

    await this.model.fit(xs, ys, {
      epochs: 5,
      batchSize: 32,
      shuffle: true,
      validationSplit: 0.2
    });

    await this.model.save('indexeddb://behavior-model');
  }
}