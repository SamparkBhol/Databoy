import * as tf from '@tensorflow/tfjs';

export function createModel(type, inputShape, learningRate = 0.01) {
  const model = tf.sequential();
  
  if (type === 'logistic') {
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    
    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  } else { // decision tree approximation
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    
    model.compile({
      optimizer: tf.train.rmsprop(learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }
  
  return model;
}

export function preprocessData(data, featureCols, targetCols) {
  if (!data || data.length === 0 || featureCols.length === 0 || targetCols.length === 0) {
    return {};
  }

  const targetCol = targetCols[0];
  const uniqueLabels = [...new Set(data.map(row => row[targetCol]))];
  const labelMap = Object.fromEntries(uniqueLabels.map((label, i) => [label, i]));

  const cleanedData = data.map(row => {
    const features = featureCols.map(col => parseFloat(row[col] || 0));
    const label = labelMap[row[targetCol]];
    return { features, label };
  }).filter(d => d.label !== undefined && d.features.every(f => !isNaN(f)));

  if (cleanedData.length === 0) {
    return {};
  }

  const features = tf.tensor2d(cleanedData.map(d => d.features));
  const labels = tf.tensor2d(cleanedData.map(d => d.label), [cleanedData.length, 1]);

  return {
    features,
    labels,
    featureNames: featureCols,
    labelName: targetCol,
    labelMap
  };
}