import { Keypoint } from '@tensorflow-models/pose-detection';

export class MotionAnalyzer {
  public static calculateVelocities(currentPose: Keypoint[], previousPose: Keypoint[]): number[] {
    const velocities: number[] = [];
    
    currentPose.forEach((keypoint, index) => {
      if (keypoint.score && keypoint.score > 0.5 && previousPose[index]) {
        const velocity = Math.sqrt(
          Math.pow(keypoint.x - previousPose[index].x, 2) +
          Math.pow(keypoint.y - previousPose[index].y, 2)
        );
        velocities.push(velocity);
      }
    });

    return velocities;
  }

  public static analyzePoseStability(poses: Keypoint[][]): {
    isStable: boolean;
    reason: string;
  } {
    const stabilityThreshold = 20;
    let maxDeviation = 0;
    let unstableJoint = '';

    // Calculate average positions
    const avgPositions = new Map<string, { x: number; y: number }>();
    
    poses[0].forEach(keypoint => {
      if (keypoint.name) {
        avgPositions.set(keypoint.name, { x: 0, y: 0 });
      }
    });

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

    // Find maximum deviation
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
}