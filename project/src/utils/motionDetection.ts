import { Keypoint } from '@tensorflow-models/pose-detection';

export interface MotionAnalysis {
  isRapidMotion: boolean;
  isPunchingMotion: boolean;
  isAggressive: boolean;
  confidence: number;
}

export const analyzeMotion = (
  currentKeypoints: Keypoint[],
  previousKeypoints: Keypoint[]
): MotionAnalysis => {
  if (!previousKeypoints.length) {
    return {
      isRapidMotion: false,
      isPunchingMotion: false,
      isAggressive: false,
      confidence: 0
    };
  }

  // Calculate motion vectors for arms
  const leftWrist = currentKeypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = currentKeypoints.find(kp => kp.name === 'right_wrist');
  const prevLeftWrist = previousKeypoints.find(kp => kp.name === 'left_wrist');
  const prevRightWrist = previousKeypoints.find(kp => kp.name === 'right_wrist');

  // Calculate velocities
  const leftWristVelocity = leftWrist && prevLeftWrist ? 
    Math.sqrt(
      Math.pow(leftWrist.x - prevLeftWrist.x, 2) + 
      Math.pow(leftWrist.y - prevLeftWrist.y, 2)
    ) : 0;

  const rightWristVelocity = rightWrist && prevRightWrist ? 
    Math.sqrt(
      Math.pow(rightWrist.x - prevRightWrist.x, 2) + 
      Math.pow(rightWrist.y - prevRightWrist.y, 2)
    ) : 0;

  // Detect punching motion
  const isPunchingMotion = leftWristVelocity > 40 || rightWristVelocity > 40;
  
  // Analyze overall aggressive motion
  const isRapidMotion = currentKeypoints.some((kp, i) => {
    const prevKp = previousKeypoints[i];
    if (!prevKp || !kp.score || kp.score < 0.5) return false;
    
    const velocity = Math.sqrt(
      Math.pow(kp.x - prevKp.x, 2) + 
      Math.pow(kp.y - prevKp.y, 2)
    );
    return velocity > 30;
  });

  // Combine signals for aggressive behavior
  const isAggressive = isPunchingMotion && isRapidMotion;
  
  // Calculate confidence based on motion intensity
  const confidence = Math.min(
    0.95,
    Math.max(leftWristVelocity, rightWristVelocity) / 100
  );

  return {
    isRapidMotion,
    isPunchingMotion,
    isAggressive,
    confidence
  };
};