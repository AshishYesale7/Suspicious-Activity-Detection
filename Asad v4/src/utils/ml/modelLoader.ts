import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

export class ModelLoader {
  private static instance: ModelLoader;
  private models: {
    faceDetector?: blazeface.BlazeFaceModel;
    poseDetector?: poseDetection.PoseDetector;
    objectDetector?: cocoSsd.ObjectDetection;
    segmentation?: bodySegmentation.BodySegmenter;
  } = {};

  private constructor() {}

  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  async loadModels(progressCallback?: (progress: number) => void) {
    await tf.ready();
    await tf.setBackend('webgl');

    const totalModels = 4;
    let loadedModels = 0;

    try {
      // Load face detection model
      this.models.faceDetector = await blazeface.load();
      loadedModels++;
      progressCallback?.(loadedModels / totalModels);

      // Load pose detection model
      this.models.poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { 
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          multiPoseMaxDimension: 256,
        }
      );
      loadedModels++;
      progressCallback?.(loadedModels / totalModels);

      // Load object detection model
      this.models.objectDetector = await cocoSsd.load({
        base: 'lite',
        modelUrl: undefined
      });
      loadedModels++;
      progressCallback?.(loadedModels / totalModels);

      // Load segmentation model
      this.models.segmentation = await bodySegmentation.createSegmenter(
        bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
        {
          runtime: 'tfjs',
          modelType: 'general'
        }
      );
      loadedModels++;
      progressCallback?.(loadedModels / totalModels);

      return this.models;
    } catch (error) {
      console.error('Error loading models:', error);
      throw error;
    }
  }

  getModels() {
    return this.models;
  }

  async warmupModels() {
    const dummyTensor = tf.zeros([1, 256, 256, 3]);
    
    try {
      if (this.models.faceDetector) {
        await this.models.faceDetector.estimateFaces(dummyTensor as unknown as HTMLVideoElement);
      }
      if (this.models.poseDetector) {
        await this.models.poseDetector.estimatePoses(dummyTensor as unknown as HTMLVideoElement);
      }
      if (this.models.objectDetector) {
        await this.models.objectDetector.detect(dummyTensor as unknown as HTMLVideoElement);
      }
      if (this.models.segmentation) {
        await this.models.segmentation.segmentPeople(dummyTensor as unknown as HTMLVideoElement);
      }
    } finally {
      dummyTensor.dispose();
    }
  }
}