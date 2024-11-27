import { Keypoint } from '@tensorflow-models/pose-detection';
import { DetectedObject } from '@tensorflow-models/coco-ssd';
import { ActivityAnalysis } from './detectionTypes';
import { 
  getKeypointVelocity, 
  isValidKeypoint, 
  isObjectNearPerson,
  isSuspiciousObject,
  calculateDistance,
  calculateBodyAngle,
  detectPoseAggression,
  analyzePosture
} from './detectionUtils';

const THRESHOLDS = {
  FIGHTING: {
    VELOCITY: 35,
    ACCELERATION: 800,
    MIN_CONFIDENCE: 0.55,
    POSE_AGGRESSION: 0.6
  },
  THEFT: {
    VELOCITY: 30,
    PROXIMITY: 80,
    MIN_CONFIDENCE: 0.6,
    SUSPICIOUS_DURATION: 2000
  },
  FIRE: {
    MIN_CONFIDENCE: 0.65,
    THERMAL_OBJECTS: ['oven', 'tv', 'laptop', 'cell phone', 'microwave'],
    SMOKE_INDICATORS: ['bottle', 'cup', 'wine glass']
  },
  SUSPICIOUS: {
    VELOCITY: 25,
    MIN_CONFIDENCE: 0.5,
    LOITERING_TIME: 5000
  }
};

const detectFighting = (
  currentPose: Keypoint[],
  previousPose: Keypoint[],
  previousVelocities: { [key: string]: number }
): { isFighting: boolean; confidence: number; details: string } => {
  const aggressiveJoints = ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow', 'left_knee', 'right_knee'];
  let maxVelocity = 0;
  let maxAcceleration = 0;
  let violentMovements = 0;
  let validJoints = 0;
  let poseAggressionScore = 0;

  // Analyze pose aggression
  if (currentPose.length > 0) {
    poseAggressionScore = detectPoseAggression(currentPose);
  }

  // Analyze joint movements
  aggressiveJoints.forEach(joint => {
    const current = currentPose.find(kp => kp.name === joint);
    const previous = previousPose.find(kp => kp.name === joint);

    if (current && previous && isValidKeypoint(current) && isValidKeypoint(previous)) {
      const { velocity, acceleration } = getKeypointVelocity(current, previous, previousVelocities);
      previousVelocities[joint] = velocity;

      maxVelocity = Math.max(maxVelocity, velocity);
      maxAcceleration = Math.max(maxAcceleration, acceleration);
      
      if (velocity > THRESHOLDS.FIGHTING.VELOCITY && acceleration > THRESHOLDS.FIGHTING.ACCELERATION) {
        violentMovements++;
      }
      validJoints++;
    }
  });

  // Calculate body angles and posture
  const postureAnalysis = analyzePosture(currentPose);

  const confidence = validJoints > 0 
    ? Math.min(0.95, 
        (violentMovements / validJoints) * 0.4 +
        (maxVelocity / THRESHOLDS.FIGHTING.VELOCITY) * 0.3 +
        (poseAggressionScore) * 0.3
      )
    : 0;

  return {
    isFighting: confidence > THRESHOLDS.FIGHTING.MIN_CONFIDENCE,
    confidence,
    details: `Violent movements: ${violentMovements}, Aggression score: ${(poseAggressionScore * 100).toFixed(1)}%, ${postureAnalysis}`
  };
};

const detectTheft = (
  currentPose: Keypoint[],
  previousPose: Keypoint[],
  objects: DetectedObject[],
  previousVelocities: { [key: string]: number },
  lastSuspiciousTime: { current: number }
): { isTheft: boolean; confidence: number; details: string } => {
  // Calculate person's bounding box
  const validKeypoints = currentPose.filter(kp => isValidKeypoint(kp));
  if (validKeypoints.length < 5) {
    return { isTheft: false, confidence: 0, details: 'Insufficient pose data' };
  }

  const personBox = {
    x: Math.min(...validKeypoints.map(kp => kp.x)),
    y: Math.min(...validKeypoints.map(kp => kp.y)),
    width: Math.max(...validKeypoints.map(kp => kp.x)) - Math.min(...validKeypoints.map(kp => kp.x)),
    height: Math.max(...validKeypoints.map(kp => kp.y)) - Math.min(...validKeypoints.map(kp => kp.y))
  };

  let nearObjects = 0;
  let suspiciousObjects = 0;
  let maxVelocity = 0;
  let suspiciousInteractions = 0;

  // Analyze movement patterns
  const torso = currentPose.find(kp => kp.name === 'nose');
  const prevTorso = previousPose.find(kp => kp.name === 'nose');
  
  if (torso && prevTorso && isValidKeypoint(torso) && isValidKeypoint(prevTorso)) {
    const { velocity } = getKeypointVelocity(torso, prevTorso, previousVelocities);
    maxVelocity = velocity;
  }

  // Analyze object interactions
  objects.forEach(obj => {
    const objectBox = { 
      x: obj.bbox[0], 
      y: obj.bbox[1], 
      width: obj.bbox[2], 
      height: obj.bbox[3] 
    };

    if (isObjectNearPerson(personBox, objectBox, THRESHOLDS.THEFT.PROXIMITY)) {
      nearObjects++;
      if (isSuspiciousObject(obj)) {
        suspiciousObjects++;
        
        // Check hand proximity to suspicious objects
        const hands = ['left_wrist', 'right_wrist'].map(name => 
          currentPose.find(kp => kp.name === name)
        ).filter(kp => kp && isValidKeypoint(kp));

        hands.forEach(hand => {
          if (hand && calculateDistance(hand, {
            x: objectBox.x + objectBox.width/2,
            y: objectBox.y + objectBox.height/2
          }) < THRESHOLDS.THEFT.PROXIMITY) {
            suspiciousInteractions++;
          }
        });
      }
    }
  });

  // Update suspicious timing
  const now = Date.now();
  if (suspiciousInteractions > 0) {
    if (!lastSuspiciousTime.current) {
      lastSuspiciousTime.current = now;
    }
  } else {
    lastSuspiciousTime.current = 0;
  }

  const suspiciousDuration = lastSuspiciousTime.current ? now - lastSuspiciousTime.current : 0;
  const durationFactor = Math.min(1, suspiciousDuration / THRESHOLDS.THEFT.SUSPICIOUS_DURATION);

  const confidence = Math.min(0.95,
    (maxVelocity / THRESHOLDS.THEFT.VELOCITY) * 0.3 +
    (suspiciousObjects > 0 ? 0.3 : 0) +
    (suspiciousInteractions / 2) * 0.2 +
    durationFactor * 0.2
  );

  return {
    isTheft: confidence > THRESHOLDS.THEFT.MIN_CONFIDENCE,
    confidence,
    details: `Suspicious objects: ${suspiciousObjects}, Interactions: ${suspiciousInteractions}, Duration: ${(suspiciousDuration/1000).toFixed(1)}s`
  };
};

const detectFire = (objects: DetectedObject[]): { isFire: boolean; confidence: number; details: string } => {
  const thermalObjects = objects.filter(obj => 
    THRESHOLDS.FIRE.THERMAL_OBJECTS.includes(obj.class.toLowerCase()) &&
    obj.score > THRESHOLDS.FIRE.MIN_CONFIDENCE
  );

  const smokeIndicators = objects.filter(obj =>
    THRESHOLDS.FIRE.SMOKE_INDICATORS.includes(obj.class.toLowerCase()) &&
    obj.score > THRESHOLDS.FIRE.MIN_CONFIDENCE
  );

  let confidence = 0;
  let details = '';

  if (thermalObjects.length > 0) {
    confidence = Math.max(...thermalObjects.map(obj => obj.score)) * 0.7;
    details = `Thermal sources: ${thermalObjects.map(obj => obj.class).join(', ')}`;
  }

  if (smokeIndicators.length > 0) {
    confidence = Math.max(confidence, Math.max(...smokeIndicators.map(obj => obj.score)) * 0.5);
    details += details ? ', ' : '';
    details += `Smoke indicators: ${smokeIndicators.map(obj => obj.class).join(', ')}`;
  }

  return {
    isFire: confidence > THRESHOLDS.FIRE.MIN_CONFIDENCE,
    confidence,
    details: details || 'No fire indicators detected'
  };
};

export const analyzeActivity = (
  currentPose: Keypoint[],
  previousPose: Keypoint[],
  objects: DetectedObject[],
  previousVelocities: { [key: string]: number },
  lastSuspiciousTime: { current: number }
): ActivityAnalysis => {
  if (!previousPose.length || currentPose.length === 0) {
    return {
      type: 'normal',
      confidence: 0,
      details: 'Initializing detection...',
      severity: 'none'
    };
  }

  const fighting = detectFighting(currentPose, previousPose, previousVelocities);
  const theft = detectTheft(currentPose, previousPose, objects, previousVelocities, lastSuspiciousTime);
  const fire = detectFire(objects);

  // Determine the most severe activity
  if (fighting.isFighting) {
    return {
      type: 'fighting',
      confidence: fighting.confidence,
      details: fighting.details,
      severity: fighting.confidence > 0.8 ? 'high' : 'medium'
    };
  }

  if (fire.isFire) {
    return {
      type: 'fire',
      confidence: fire.confidence,
      details: fire.details,
      severity: fire.confidence > 0.8 ? 'high' : 'medium'
    };
  }

  if (theft.isTheft) {
    return {
      type: 'theft',
      confidence: theft.confidence,
      details: theft.details,
      severity: theft.confidence > 0.8 ? 'high' : 'medium'
    };
  }

  // Check for suspicious behavior
  const suspiciousMovement = currentPose.some((kp, i) => {
    const prevKp = previousPose[i];
    if (!prevKp || !isValidKeypoint(kp) || !isValidKeypoint(prevKp)) return false;
    
    const { velocity } = getKeypointVelocity(kp, prevKp, previousVelocities);
    return velocity > THRESHOLDS.SUSPICIOUS.VELOCITY;
  });

  if (suspiciousMovement) {
    return {
      type: 'suspicious',
      confidence: 0.7,
      details: 'Unusual movement patterns detected',
      severity: 'low'
    };
  }

  return {
    type: 'normal',
    confidence: 0.9,
    details: 'No suspicious activity detected',
    severity: 'none'
  };
};