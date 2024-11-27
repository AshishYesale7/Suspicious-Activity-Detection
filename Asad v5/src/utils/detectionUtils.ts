import { Keypoint } from '@tensorflow-models/pose-detection';
import { DetectedObject } from '@tensorflow-models/coco-ssd';

export const calculateDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
};

export const calculateVelocity = (
  current: { x: number; y: number },
  previous: { x: number; y: number },
  timeInterval: number = 1/30
): number => {
  const distance = calculateDistance(current, previous);
  return distance / timeInterval;
};

export const calculateAcceleration = (
  currentVelocity: number,
  previousVelocity: number,
  timeInterval: number = 1/30
): number => {
  return (currentVelocity - previousVelocity) / timeInterval;
};

export const calculateBodyAngle = (
  joint1: Keypoint,
  joint2: Keypoint,
  joint3: Keypoint
): number => {
  if (!isValidKeypoint(joint1) || !isValidKeypoint(joint2) || !isValidKeypoint(joint3)) {
    return 0;
  }

  const vector1 = {
    x: joint1.x - joint2.x,
    y: joint1.y - joint2.y
  };

  const vector2 = {
    x: joint3.x - joint2.x,
    y: joint3.y - joint2.y
  };

  const dot = vector1.x * vector2.x + vector1.y * vector2.y;
  const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

  return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
};

export const isValidKeypoint = (keypoint: Keypoint): boolean => {
  return keypoint.score !== undefined && keypoint.score > 0.5;
};

export const getKeypointVelocity = (
  current: Keypoint,
  previous: Keypoint,
  previousVelocities: { [key: string]: number }
): { velocity: number; acceleration: number } => {
  if (!isValidKeypoint(current) || !isValidKeypoint(previous)) {
    return { velocity: 0, acceleration: 0 };
  }

  const velocity = calculateVelocity(current, previous);
  const previousVelocity = previousVelocities[current.name || ''] || 0;
  const acceleration = calculateAcceleration(velocity, previousVelocity);

  return { velocity, acceleration };
};

export const isObjectNearPerson = (
  personBox: { x: number; y: number; width: number; height: number },
  objectBox: { x: number; y: number; width: number; height: number },
  threshold: number = 100
): boolean => {
  const personCenter = {
    x: personBox.x + personBox.width / 2,
    y: personBox.y + personBox.height / 2
  };
  
  const objectCenter = {
    x: objectBox.x + objectBox.width / 2,
    y: objectBox.y + objectBox.height / 2
  };

  return calculateDistance(personCenter, objectCenter) < threshold;
};

export const isSuspiciousObject = (object: DetectedObject): boolean => {
  const suspiciousItems = [
    'knife', 'scissors', 'bottle', 'cell phone', 'laptop', 'backpack',
    'suitcase', 'handbag', 'sports ball', 'baseball bat', 'umbrella'
  ];
  return suspiciousItems.includes(object.class.toLowerCase());
};

export const detectPoseAggression = (pose: Keypoint[]): number => {
  let aggressionScore = 0;
  let validMeasurements = 0;

  // Check arm angles
  const shoulders = ['left_shoulder', 'right_shoulder'].map(name => 
    pose.find(kp => kp.name === name)
  ).filter(isValidKeypoint);

  const elbows = ['left_elbow', 'right_elbow'].map(name => 
    pose.find(kp => kp.name === name)
  ).filter(isValidKeypoint);

  const wrists = ['left_wrist', 'right_wrist'].map(name => 
    pose.find(kp => kp.name === name)
  ).filter(isValidKeypoint);

  // Analyze arm positions
  for (let i = 0; i < Math.min(shoulders.length, elbows.length, wrists.length); i++) {
    if (shoulders[i] && elbows[i] && wrists[i]) {
      const armAngle = calculateBodyAngle(shoulders[i], elbows[i], wrists[i]);
      if (armAngle < 90) { // Bent arms might indicate aggressive pose
        aggressionScore += 0.3;
      }
      validMeasurements++;
    }
  }

  // Check body orientation
  const nose = pose.find(kp => kp.name === 'nose');
  const neck = pose.find(kp => kp.name === 'neck');
  const hip = pose.find(kp => kp.name === 'hip');

  if (nose && neck && hip && isValidKeypoint(nose) && isValidKeypoint(neck) && isValidKeypoint(hip)) {
    const bodyAngle = calculateBodyAngle(nose, neck, hip);
    if (bodyAngle > 30) { // Leaning forward might indicate aggressive stance
      aggressionScore += 0.4;
    }
    validMeasurements++;
  }

  return validMeasurements > 0 ? aggressionScore / validMeasurements : 0;
};

export const analyzePosture = (pose: Keypoint[]): string => {
  const postureIndicators: string[] = [];

  // Check for raised arms
  const shoulders = ['left_shoulder', 'right_shoulder'].map(name => 
    pose.find(kp => kp.name === name)
  ).filter(isValidKeypoint);

  const wrists = ['left_wrist', 'right_wrist'].map(name => 
    pose.find(kp => kp.name === name)
  ).filter(isValidKeypoint);

  wrists.forEach((wrist, i) => {
    if (wrist && shoulders[i] && wrist.y < shoulders[i].y) {
      postureIndicators.push('Raised arms');
    }
  });

  // Check for forward lean
  const nose = pose.find(kp => kp.name === 'nose');
  const hip = pose.find(kp => kp.name === 'hip');

  if (nose && hip && isValidKeypoint(nose) && isValidKeypoint(hip)) {
    if (Math.abs(nose.x - hip.x) > 100) {
      postureIndicators.push('Forward lean');
    }
  }

  return postureIndicators.length > 0 
    ? `Posture indicators: ${postureIndicators.join(', ')}` 
    : 'Normal posture';
};