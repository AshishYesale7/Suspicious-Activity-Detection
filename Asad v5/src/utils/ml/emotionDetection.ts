import * as faceapi from 'face-api.js';
import { Detection } from '../detectionTypes';

export class EmotionDetector {
  private model: faceapi.TinyFaceDetectorOptions;
  private isInitialized: boolean = false;

  constructor() {
    this.model = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5
    });
    this.initialize();
  }

  private async initialize() {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing emotion detection:', error);
    }
  }

  public async detectEmotions(video: HTMLVideoElement): Promise<Detection[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const detections = await faceapi
        .detectAllFaces(video, this.model)
        .withFaceLandmarks()
        .withFaceExpressions();

      return detections.map(detection => {
        const expressions = detection.expressions;
        const dominantEmotion = Object.entries(expressions).reduce((a, b) => 
          a[1] > b[1] ? a : b
        );

        let severity: 'low' | 'medium' | 'high' = 'low';
        if (dominantEmotion[1] > 0.8) severity = 'high';
        else if (dominantEmotion[1] > 0.6) severity = 'medium';

        return {
          timestamp: Date.now(),
          type: 'Emotion',
          confidence: dominantEmotion[1],
          details: `Detected emotion: ${dominantEmotion[0]} (${(dominantEmotion[1] * 100).toFixed(1)}%)`,
          severity
        };
      });
    } catch (error) {
      console.error('Error detecting emotions:', error);
      return [];
    }
  }

  public async analyzeEmotionalState(detections: Detection[]): Promise<{
    dominantEmotion: string;
    emotionalStability: number;
    details: string[];
  }> {
    if (detections.length === 0) {
      return {
        dominantEmotion: 'unknown',
        emotionalStability: 1,
        details: ['No emotional data available']
      };
    }

    const emotionCounts = new Map<string, number>();
    let totalConfidence = 0;
    let emotionChanges = 0;
    let previousEmotion = '';

    detections.forEach(detection => {
      const emotion = detection.details.split(': ')[1].split(' ')[0];
      emotionCounts.set(
        emotion,
        (emotionCounts.get(emotion) || 0) + 1
      );
      totalConfidence += detection.confidence;

      if (previousEmotion && previousEmotion !== emotion) {
        emotionChanges++;
      }
      previousEmotion = emotion;
    });

    const dominantEmotion = Array.from(emotionCounts.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    const emotionalStability = Math.max(0, 1 - (emotionChanges / detections.length));

    const details = [
      `Dominant emotion: ${dominantEmotion}`,
      `Emotional stability: ${(emotionalStability * 100).toFixed(1)}%`,
      `Average confidence: ${((totalConfidence / detections.length) * 100).toFixed(1)}%`
    ];

    if (emotionalStability < 0.5) {
      details.push('Warning: High emotional instability detected');
    }

    return {
      dominantEmotion,
      emotionalStability,
      details
    };
  }
}