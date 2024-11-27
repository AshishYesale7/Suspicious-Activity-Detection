import * as tf from '@tensorflow/tfjs';
import { Keypoint } from '@tensorflow-models/pose-detection';

export class AnomalyDetector {
  private readonly windowSize = 30; // 1 second at 30fps
  private poseSequence: Keypoint[][] = [];
  private readonly threshold = 0.8;
  private autoencoder: tf.LayersModel | null = null;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      this.autoencoder = await tf.loadLayersModel('indexeddb://anomaly-detector');
    } catch {
      this.autoencoder = this.createAutoencoder();
      await this.autoencoder.save('indexeddb://anomaly-detector');
    }
  }

  private createAutoencoder(): tf.LayersModel {
    const inputDim = 90; // 30 keypoints * 3 (x, y, confidence)
    
    // Encoder
    const input = tf.input({shape: [inputDim]});
    const encoded = tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l1l2({l1: 1e-5, l2: 1e-5})
    }).apply(input);

    const bottleneck = tf.layers.dense({
      units: 16,
      activation: 'relu'
    }).apply(encoded);

    // Decoder
    const decoded = tf.layers.dense({
      units: 32,
      activation: 'relu'
    }).apply(bottleneck);

    const output = tf.layers.dense({
      units: inputDim,
      activation: 'sigmoid'
    }).apply(decoded);

    const autoencoder = tf.model({inputs: input, outputs: output});
    
    autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    return autoencoder;
  }

  public updateSequence(pose: Keypoint[]) {
    this.poseSequence.push(pose);
    if (this.poseSequence.length > this.windowSize) {
      this.poseSequence.shift();
    }
  }

  private preprocessPose(pose: Keypoint[]): number[] {
    const features: number[] = [];
    pose.forEach(keypoint => {
      // Normalize coordinates to [0, 1]
      features.push(
        keypoint.x / 640, // Assuming 640x480 video
        keypoint.y / 480,
        keypoint.score || 0
      );
    });
    return features;
  }

  public async detectAnomaly(): Promise<{
    isAnomaly: boolean;
    confidence: number;
    details: string[];
  }> {
    if (!this.autoencoder || this.poseSequence.length < this.windowSize) {
      return {
        isAnomaly: false,
        confidence: 0,
        details: ['Insufficient data for anomaly detection']
      };
    }

    const features = this.poseSequence.flatMap(pose => this.preprocessPose(pose));
    const input = tf.tensor2d([features]);
    
    const reconstruction = this.autoencoder.predict(input) as tf.Tensor;
    const reconstructionError = tf.metrics.meanSquaredError(input, reconstruction);
    const errorValue = await reconstructionError.data();

    const isAnomaly = errorValue[0] > this.threshold;
    const confidence = Math.min(1, errorValue[0] / this.threshold);

    const details = this.analyzeAnomaly(isAnomaly, confidence, this.poseSequence);

    return {
      isAnomaly,
      confidence,
      details
    };
  }

  private analyzeAnomaly(
    isAnomaly: boolean,
    confidence: number,
    poses: Keypoint[][]
  ): string[] {
    const details: string[] = [];

    if (!isAnomaly) {
      details.push('Normal behavior pattern detected');
      return details;
    }

    // Analyze movement patterns
    const velocities = this.calculateVelocities(poses);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;

    if (avgVelocity > 50) {
      details.push('Extremely rapid movement detected');
    } else if (avgVelocity > 30) {
      details.push('Unusual movement speed detected');
    }

    // Analyze pose stability
    const poseStability = this.analyzePoseStability(poses);
    if (!poseStability.isStable) {
      details.push(`Unstable pose detected: ${poseStability.reason}`);
    }

    // Add confidence-based detail
    details.push(`Anomaly confidence: ${(confidence * 100).toFixed(1)}%`);

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

  private analyzePoseStability(poses: Keypoint[][]): {
    isStable: boolean;
    reason: string;
  } {
    const stabilityThreshold = 20;
    let maxDeviation = 0;
    let unstableJoint = '';

    // Calculate average position for each keypoint
    const avgPositions = new Map<string, { x: number; y: number }>();
    
    poses[0].forEach(keypoint => {
      if (keypoint.name) {
        avgPositions.set(keypoint.name, { x: 0, y: 0 });
      }
    });

    // Calculate average positions
    poses.forEach(pose => {
      pose.forEach(keypoint => {
        if (keypoint.name && keypoint.score && keypoint.score > 0.5) {
          const avg = avgPositions.get(keypoint.name);
          if (avg) {
            avg.x += keypoint.x / poses.length;
            avg.y += keypoint.y / poses.length;
          }
        }
      });
    });

    // Calculate maximum deviation from average
    poses.forEach(pose => {
      pose.forEach(keypoint => {
        if (keypoint.name && keypoint.score && keypoint.score > 0.5) {
          const avg = avgPositions.get(keypoint.name);
          if (avg) {
            const deviation = Math.sqrt(
              Math.pow(keypoint.x - avg.x, 2) +
              Math.pow(keypoint.y - avg.y, 2)
            );
            
            if (deviation > maxDeviation) {
              maxDeviation = deviation;
              unstableJoint = keypoint.name;
            }
          }
        }
      });
    });

    return {
      isStable: maxDeviation < stabilityThreshold,
      reason: maxDeviation >= stabilityThreshold
        ? `High movement variation in ${unstableJoint}`
        : 'Stable pose'
    };
  }

  public async trainOnNewData(poses: Keypoint[][], labels: number[]) {
    if (!this.autoencoder) return;

    const features = poses.map(pose => this.preprocessPose(pose));
    const xs = tf.tensor2d(features);

    await this.autoencoder.fit(xs, xs, {
      epochs: 10,
      batchSize: 32,
      shuffle: true,
      validationSplit: 0.2
    });

    await this.autoencoder.save('indexeddb://anomaly-detector');
  }
}