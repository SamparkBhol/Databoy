import * as tf from '@tensorflow/tfjs';

function cosineDistance(a, b) {
  const dotProduct = a.dot(b).dataSync()[0];
  const aNorm = a.norm().dataSync()[0];
  const bNorm = b.norm().dataSync()[0];
  return 1 - dotProduct / (aNorm * bNorm);
}

export async function runLIME(instance, model, featureNames, numSamples = 100) {
  const instanceTensor = tf.tensor1d(instance);
  
  const perturbations = tf.randomNormal([numSamples, instance.length], 0, 0.1);
  const perturbedInstances = perturbations.add(instanceTensor);

  const predictions = model.predict(perturbedInstances);
  
  const distances = tf.tidy(() => {
    const dists = [];
    for (let i = 0; i < numSamples; i++) {
      dists.push(cosineDistance(instanceTensor, perturbedInstances.slice([i, 0], [1, -1]).as1D()));
    }
    return tf.tensor1d(dists);
  });
  
  const kernelWidth = 0.25;
  const weights = tf.exp(distances.neg().div(kernelWidth ** 2));

  const linearModel = tf.sequential();
  linearModel.add(tf.layers.dense({ units: 1, inputShape: [instance.length] }));
  linearModel.compile({ loss: 'meanSquaredError', optimizer: tf.train.adam(0.01) });

  await linearModel.fit(perturbedInstances, predictions, {
    epochs: 20,
    batchSize: 32,
    sampleWeight: weights,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        // console.log(`LIME fit Epoch ${epoch}: loss = ${logs.loss}`);
      },
    },
  });

  const limeWeights = linearModel.getWeights()[0].dataSync();

  const featureContributions = featureNames.map((name, i) => ({
    feature: name,
    contribution: limeWeights[i],
  })).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  tf.dispose([instanceTensor, perturbations, perturbedInstances, predictions, distances, weights]);
  linearModel.dispose();

  return featureContributions;
}