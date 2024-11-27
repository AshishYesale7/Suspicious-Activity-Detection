import * as tf from '@tensorflow/tfjs';

export class AnomalyModel {
  private model: tf.LayersModel | null = null;
  private readonly threshold = 0.8;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.model = await tf.loadLayersModel('indexeddb://anomaly-detector');
    } catch {
      this.model = this.createModel();
      await this.model.save('indexeddb://anomaly-detector');
    }
  }

  private createModel(): tf.LayersModel {
    const inputDim = 90;
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

    const decoded = tf.layers.dense({
      units: 32,
      activation: 'relu'
    }).apply(bottleneck);

    const output = tf.layers.dense({
      units: inputDim,
      activation: 'sigmoid'
    }).apply(decoded);

    const model = tf.model({inputs: input, outputs: output});
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    return model;
  }

  public async detectAnomaly(input: tf.Tensor2D): Promise<{
    isAnomaly: boolean;
    confidence: number;
  }> {
    if (!this.model) throw new Error('Model not initialized');

    const reconstruction = this.model.predict(input) as tf.Tensor;
    const reconstructionError = tf.metrics.meanSquaredError(input, reconstruction);
    const errorValue = await reconstructionError.data();

    const isAnomaly = errorValue[0] > this.threshold;
    const confidence = Math.min(1, errorValue[0] / this.threshold);

    return { isAnomaly, confidence };
  }

  public async train(features: tf.Tensor2D) {
    if (!this.model) throw new Error('Model not initialized');

    await this.model.fit(features, features, {
      epochs: 10,
      batchSize: 32,
      shuffle: true,
      validationSplit: 0.2
    });

    await this.model.save('indexeddb://anomaly-detector');
  }
}