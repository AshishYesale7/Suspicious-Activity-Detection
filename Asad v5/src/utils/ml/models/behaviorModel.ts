import * as tf from '@tensorflow/tfjs';

export class BehaviorModel {
  private model: tf.LayersModel | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.model = await tf.loadLayersModel('indexeddb://behavior-model');
    } catch {
      this.model = this.createModel();
      await this.model.save('indexeddb://behavior-model');
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [90] }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 5, activation: 'softmax' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  public async predict(features: tf.Tensor): Promise<[number, number]> {
    if (!this.model) throw new Error('Model not initialized');
    
    const prediction = await this.model.predict(features) as tf.Tensor;
    const probabilities = await prediction.data();
    
    let maxProb = 0;
    let maxIndex = 0;

    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    return [maxProb, maxIndex];
  }

  public async train(features: tf.Tensor2D, labels: tf.Tensor2D) {
    if (!this.model) throw new Error('Model not initialized');

    await this.model.fit(features, labels, {
      epochs: 5,
      batchSize: 32,
      shuffle: true,
      validationSplit: 0.2
    });

    await this.model.save('indexeddb://behavior-model');
  }
}