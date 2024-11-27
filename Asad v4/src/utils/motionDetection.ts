import { Keypoint } from '@tensorflow-models/pose-detection';

export interface MotionAnalysis {
  isRapidMotion: boolean;
  isPunchingMotion: boolean;
  isAggressive: boolean;
  confidence: number;
  detectionType: string;
}

const calculateVelocity = (current: Keypoint, previous: Keypoint): number => {
  return Math.sqrt(
    Math.pow(current.x - previous.x, 2) + 
    Math.pow(current.y - previous.y, 2)
  );
};

const VELOCITY_THRESHOLD = 35;
const CONFIDENCE_THRESHOLD = 0.6;

export const analyzeMotion = (
  currentKeypoints: Keypoint[],
  previousKeypoints: Keypoint[]
): MotionAnalysis => {
  if (!previousKeypoints.length) {
    return {
      isRapidMotion: false,
      isPunchingMotion: false,
      isAggressive: false,
      confidence: 0,
      detectionType: 'No motion detected'
    };
  }

  // Get relevant keypoints
  const keypointPairs = [
    ['left_wrist', 'left_elbow'],
    ['right_wrist', 'right_elbow'],
    ['left_knee', 'left_hip'],
    ['right_knee', 'right_hip']
  ];

  let maxVelocity = 0;
  let detectionType = 'Normal movement';
  let totalConfidence = 0;
  let validKeypoints = 0;

  // Analyze each keypoint pair
  keypointPairs.forEach(([joint1, joint2]) => {
    const currentJoint1 = currentKeypoints.find(kp => kp.name === joint1);
    const currentJoint2 = currentKeypoints.find(kp => kp.name === joint2);
    const previousJoint1 = previousKeypoints.find(kp => kp.name === joint1);
    const previousJoint2 = previousKeypoints.find(kp => kp.name === joint2);

    if (currentJoint1?.score && currentJoint2?.score && 
        previousJoint1?.score && previousJoint2?.score &&
        currentJoint1.score > CONFIDENCE_THRESHOLD && 
        currentJoint2.score > CONFIDENCE_THRESHOLD) {
      
      const velocity1 = calculateVelocity(currentJoint1, previousJoint1);
      const velocity2 = calculateVelocity(currentJoint2, previousJoint2);
      
      maxVelocity = Math.max(maxVelocity, velocity1, velocity2);
      totalConfidence += (currentJoint1.score + currentJoint2.score) / 2;
      validKeypoints++;
    }
  });

  const averageConfidence = validKeypoints > 0 ? totalConfidence / validKeypoints : 0;
  const isPunchingMotion = maxVelocity > VELOCITY_THRESHOLD * 1.2;
  const isRapidMotion = maxVelocity > VELOCITY_THRESHOLD;
  
  // Determine aggressive behavior
  const isAggressive = isPunchingMotion && isRapidMotion && averageConfidence > CONFIDENCE_THRESHOLD;

  // Classify motion type
  if (isAggressive) {
    detectionType = 'Aggressive Behavior';
  } else if (isPunchingMotion) {
    detectionType = 'Rapid Arm Movement';
  } else if (isRapidMotion) {
    detectionType = 'Fast Movement';
  }

  const confidence = Math.min(0.95, (maxVelocity / (VELOCITY_THRESHOLD * 2)) * averageConfidence);

  return {
    isRapidMotion,
    isPunchingMotion,
    isAggressive,
    confidence,
    detectionType
  };
};