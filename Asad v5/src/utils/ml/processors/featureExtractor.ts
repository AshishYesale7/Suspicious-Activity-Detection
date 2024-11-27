import { Keypoint } from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

export class FeatureExtractor {
  public static extractPoseFeatures(pose: Keypoint[]): number[] {
    const features: number[] = [];
    
    pose.forEach(keypoint => {
      features.push(
        keypoint.x / 640, // Normalize x coordinate
        keypoint.y / 480, // Normalize y coordinate
        keypoint.score || 0
      );
    });

    // Pad or truncate to fixed size
    while (features.length < 90) features.push(0);
    if (features.length > 90) features.length = 90;

    return features;
  }

  public static createTensor(features: number[]): tf.Tensor2D {
    return tf.tensor2d([features]);
  }

  public static normalizeFeatures(features: number[]): number[] {
    return features.map(f => {
      if (Number.isNaN(f)) return 0;
      if (!Number.isFinite(f)) return f > 0 ? 1 : -1;
      return f;
    });
  }
}