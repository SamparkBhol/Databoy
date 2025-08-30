import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Brain, Play, Square, TrendingUp, Zap, Upload, Settings, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as tf from '@tensorflow/tfjs';
import { DataContext } from '@/context/DataContext';
import { createModel, preprocessData } from '@/lib/ml-utils';

const MachineLearning = () => {
  const { csvData, analysis, fileName, model, setModel } = useContext(DataContext);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('logistic');
  const [featureCols, setFeatureCols] = useState([]);
  const [targetCol, setTargetCol] = useState('');
  const [hyperparams, setHyperparams] = useState({ epochs: 20, learningRate: 0.01, batchSize: 32 });
  const { toast } = useToast();

  useEffect(() => {
    tf.ready().then(() => addLog('TensorFlow.js backend initialized (' + tf.getBackend() + ').'));
    if (analysis) {
      setFeatureCols(analysis.numericColumns);
      setTargetCol(analysis.categoricalColumns[0] || '');
    }
  }, [analysis]);

  const addLog = (message) => {
    setTrainingLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message }]);
  };

  const handleFeatureToggle = (col) => {
    setFeatureCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const trainModel = async () => {
    if (isTraining || !csvData || featureCols.length === 0 || !targetCol) {
      toast({ title: "Prerequisites not met", description: "Please upload data and select features/target.", variant: "destructive" });
      return;
    }
    
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    
    try {
      addLog('Starting model training...');
      addLog(`Algorithm: ${selectedAlgorithm}, Epochs: ${hyperparams.epochs}, LR: ${hyperparams.learningRate}`);
      
      const { features, labels, featureNames, labelName, labelMap } = preprocessData(csvData, featureCols, [targetCol]);
      if (!features || !labels) {
        throw new Error("Data preprocessing failed. Check column selections.");
      }
      addLog(`Training with ${featureNames.length} features to predict '${labelName}'.`);

      const newModel = createModel(selectedAlgorithm, features.shape[1], hyperparams.learningRate);
      addLog(`Model architecture created with ${newModel.countParams()} parameters.`);
      
      await newModel.fit(features, labels, {
        epochs: hyperparams.epochs,
        batchSize: hyperparams.batchSize,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            setTrainingProgress(((epoch + 1) / hyperparams.epochs) * 100);
            if ((epoch + 1) % 5 === 0 || epoch === hyperparams.epochs - 1) {
              addLog(`Epoch ${epoch + 1}/${hyperparams.epochs} - Loss: ${logs.loss.toFixed(4)} - Acc: ${logs.acc.toFixed(4)}`);
            }
          }
        }
      });
      
      const [loss, accuracy] = newModel.evaluate(features, labels).map(t => t.dataSync()[0]);
      const metrics = { loss: loss.toFixed(4), accuracy: accuracy.toFixed(4) };
      
      setModel({ tfModel: newModel, metrics, config: { featureCols, targetCol, labelMap } });
      addLog(`Training complete! Final Accuracy: ${(accuracy * 100).toFixed(2)}%`);
      toast({ title: "Training Complete", description: `Model accuracy: ${(accuracy * 100).toFixed(2)}%` });
      
      features.dispose();
      labels.dispose();
      
    } catch (error) {
      addLog(`Error: ${error.message}`);
      toast({ title: "Training Error", description: error.message, variant: "destructive" });
    } finally {
      setIsTraining(false);
    }
  };

  if (!csvData || !analysis) {
    return (
      <div className="text-center retro-card p-8 rounded-lg">
        <Upload className="w-12 h-12 text-vscode-blue mx-auto mb-4" />
        <h2 className="pixel-font text-xl text-vscode-yellow mb-2">No Data Loaded</h2>
        <p className="text-vscode-text/80 font-mono">
          Please upload a CSV file on the Analytics page to begin training a model.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="pixel-font text-3xl mb-4 text-vscode-green">Machine Learning Lab</h1>
        <p className="text-vscode-text/80 font-mono">Train models on your dataset: <span className="text-vscode-yellow">{fileName}</span></p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="retro-card p-4 rounded-lg">
            <h3 className="pixel-font text-lg mb-3 text-vscode-yellow flex items-center"><Target className="w-5 h-5 mr-2 text-vscode-blue"/>Features & Target</h3>
            <div className="space-y-3">
              <div>
                <label className="font-mono text-sm text-vscode-text/80">Target Column (Categorical)</label>
                <select value={targetCol} onChange={e => setTargetCol(e.target.value)} className="w-full p-2 mt-1 bg-vscode-input-bg border border-vscode-border rounded text-vscode-text">
                  {analysis.categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-sm text-vscode-text/80">Feature Columns (Numeric)</label>
                <div className="console-output p-2 rounded max-h-40 overflow-y-auto mt-1">
                  {analysis.numericColumns.map(c => (
                    <div key={c} className="flex items-center">
                      <input type="checkbox" id={`feat-${c}`} checked={featureCols.includes(c)} onChange={() => handleFeatureToggle(c)} className="mr-2 accent-vscode-blue"/>
                      <label htmlFor={`feat-${c}`} className="font-mono text-sm">{c}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="retro-card p-4 rounded-lg">
            <h3 className="pixel-font text-lg mb-3 text-vscode-yellow flex items-center"><Settings className="w-5 h-5 mr-2 text-vscode-blue"/>Hyperparameters</h3>
            <div className="space-y-3 font-mono text-sm">
              <div><label>Epochs: {hyperparams.epochs}</label><input type="range" min="5" max="100" step="5" value={hyperparams.epochs} onChange={e => setHyperparams(p => ({...p, epochs: +e.target.value}))} className="w-full accent-vscode-blue"/></div>
              <div><label>Learning Rate: {hyperparams.learningRate}</label><input type="range" min="0.0001" max="0.1" step="0.001" value={hyperparams.learningRate} onChange={e => setHyperparams(p => ({...p, learningRate: +e.target.value}))} className="w-full accent-vscode-blue"/></div>
              <div><label>Batch Size: {hyperparams.batchSize}</label><input type="range" min="8" max="128" step="8" value={hyperparams.batchSize} onChange={e => setHyperparams(p => ({...p, batchSize: +e.target.value}))} className="w-full accent-vscode-blue"/></div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="retro-card p-6 rounded-lg">
            <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Training Controls</h2>
            <div className="flex flex-wrap gap-4 mb-6">
              <button onClick={trainModel} disabled={isTraining} className="retro-button flex items-center"><Play className="w-4 h-4 mr-2" />{isTraining ? 'Training...' : 'Start Training'}</button>
              <button onClick={() => { if (model?.tfModel) model.tfModel.stopTraining = true; setIsTraining(false); }} disabled={!isTraining} className="retro-button flex items-center"><Square className="w-4 h-4 mr-2" />Stop Training</button>
            </div>
            {isTraining && <div className="progress-bar" style={{ '--progress': `${trainingProgress}%` }} />}
          </div>

          {model && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-6 rounded-lg">
              <h2 className="pixel-font text-xl mb-4 text-vscode-yellow flex items-center"><TrendingUp className="w-6 h-6 mr-2 text-vscode-blue" />Model Performance</h2>
              <div className="console-output p-4 rounded">
                <div className="font-mono text-sm space-y-1 whitespace-pre">
                  <div className="text-vscode-green font-bold">═══ MODEL METRICS ═══</div>
                  <div><span className="text-vscode-blue">Algorithm:</span>     {selectedAlgorithm}</div>
                  <div><span className="text-vscode-blue">Final Loss:</span>      {model.metrics.loss}</div>
                  <div><span className="text-vscode-blue">Final Accuracy:</span>  {(parseFloat(model.metrics.accuracy) * 100).toFixed(2)}%</div>
                  <div className="text-vscode-yellow">Status: TRAINING COMPLETE ✓</div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="retro-card p-6 rounded-lg">
            <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Training Console</h2>
            <div className="console-output p-4 rounded h-64 overflow-y-auto">
              <div className="font-mono text-sm space-y-1">
                {trainingLogs.map((log, index) => (<div key={index}><span className="text-vscode-blue/70">[{log.timestamp}]</span> {log.message}</div>))}
                {isTraining && (<div className="text-vscode-yellow flicker"><span>[TRAINING]</span> Processing<span className="loading-dots"></span></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineLearning;