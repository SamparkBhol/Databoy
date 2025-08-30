import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Eye, BarChart3, Zap, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DataContext } from '@/context/DataContext';
import { runLIME } from '@/lib/lime';
import { preprocessData } from '@/lib/ml-utils';
import * as tf from '@tensorflow/tfjs';

const Explainability = () => {
  const { model, analysis, csvData, explanation, setExplanation } = useContext(DataContext);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState([]);
  const [limeResult, setLimeResult] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    addLog('Explainability engine initialized.');
    if (model && analysis) {
      addLog('Model and data analysis found. Ready for explainability tasks.');
      if (!explanation) {
         generateFeatureImportance();
      }
    } else {
      addLog('Waiting for a trained model and data analysis...');
    }
  }, [model, analysis]);

  const addLog = (message) => {
    setAnalysisLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message
    }]);
  };

  const generateFeatureImportance = async () => {
    if (!analysis || !model) return;
    setIsAnalyzing(true);
    addLog('Starting permutation feature importance analysis...');
    
    await new Promise(r => setTimeout(r, 100));
    
    const { features, labels, featureNames } = preprocessData(csvData, model.config.featureCols, [model.config.targetCol]);
    if (!features) {
       addLog('Failed to preprocess data for importance analysis.');
       setIsAnalyzing(false);
       return;
    }

    const baseline = model.tfModel.evaluate(features, labels)[1].dataSync()[0];
    addLog(`Baseline accuracy: ${(baseline * 100).toFixed(2)}%`);

    let importances = [];

    for (let i = 0; i < featureNames.length; i++) {
        const shuffledFeatures = features.clone();
        const column = shuffledFeatures.slice([0, i], [-1, 1]);
        const shuffledColumn = tf.util.shuffle(column.dataSync());
        
        const newColumn = tf.tensor2d(shuffledColumn, [shuffledFeatures.shape[0], 1]);
        
        const left = shuffledFeatures.slice([0, 0], [-1, i]);
        const right = shuffledFeatures.slice([0, i + 1], [-1, -1]);
        
        const newFeatures = tf.concat([left, newColumn, right], 1);
        
        const newAccuracy = model.tfModel.evaluate(newFeatures, labels)[1].dataSync()[0];
        const importance = baseline - newAccuracy;
        importances.push({ name: featureNames[i], importance });
        
        addLog(`Feature '${featureNames[i]}' permutation importance: ${importance.toFixed(4)}`);
        
        tf.dispose([shuffledFeatures, column, newColumn, left, right, newFeatures]);
        await new Promise(r => setTimeout(r, 50));
    }
    
    tf.dispose([features, labels]);

    const maxImportance = Math.max(...importances.map(imp => imp.importance));
    const normalizedImportances = importances.map(imp => ({
      ...imp,
      importance: maxImportance > 0 ? imp.importance / maxImportance : 0,
    })).sort((a, b) => b.importance - a.importance);

    const newExplanation = {
      modelAccuracy: baseline,
      features: normalizedImportances
    };
    
    setExplanation(newExplanation);
    addLog('Feature importance analysis complete.');
    setIsAnalyzing(false);
    toast({ title: "Analysis Complete", description: "Feature importance calculated successfully." });
  };
  
  const runLimeAnalysis = async () => {
    if (!model || !csvData) {
      toast({ title: 'Prerequisites not met', description: 'Train a model and load data first.', variant: 'destructive' });
      return;
    }
    
    setIsAnalyzing(true);
    setLimeResult(null);
    addLog('Starting LIME analysis on a sample instance...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
        const sampleInstanceRaw = csvData[Math.floor(Math.random() * csvData.length)];
        const sampleInstance = model.config.featureCols.map(col => parseFloat(sampleInstanceRaw[col] || 0));

        const limeContributions = await runLIME(sampleInstance, model.tfModel, model.config.featureCols);
        
        const prediction = model.tfModel.predict(tf.tensor2d([sampleInstance])).dataSync()[0];
        
        setLimeResult({ contributions: limeContributions, prediction });
        
        addLog(`LIME analysis complete. Prediction: ${prediction.toFixed(3)}`);
        limeContributions.slice(0, 5).forEach(c => {
            addLog(`  - ${c.feature}: ${c.contribution.toFixed(4)}`);
        });

        toast({ title: "LIME Analysis Complete", description: "Local explanation generated for a sample instance." });

    } catch (error) {
        addLog(`LIME Error: ${error.message}`);
        toast({ title: "LIME Error", description: error.message, variant: "destructive" });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const getImportanceColor = (importance) => {
    if (importance > 0.7) return 'text-vscode-red';
    if (importance > 0.4) return 'text-vscode-yellow';
    return 'text-vscode-green';
  };
  
  const getContributionColor = (contribution) => {
    return contribution >= 0 ? 'bg-vscode-green' : 'bg-vscode-red';
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="pixel-font text-3xl mb-4 text-vscode-green">Model Explainability</h1>
        <p className="text-vscode-text/80 font-mono">Understand AI decisions with global and local feature analysis.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="retro-card p-6 rounded-lg">
        <h2 className="pixel-font text-xl mb-4 text-vscode-yellow flex items-center"><Eye className="w-6 h-6 mr-2 text-vscode-blue" />Explainability Controls</h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={generateFeatureImportance} disabled={isAnalyzing || !model} className="retro-button flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Global Importance (Permutation)'}
          </button>
          <button onClick={runLimeAnalysis} disabled={isAnalyzing || !model} className="retro-button flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Local Explanation (LIME)
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {explanation ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="retro-card p-6 rounded-lg">
            <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Global Feature Importance</h2>
            <div className="space-y-3">
              {explanation.features.map((feature, index) => (
                <motion.div key={feature.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="p-3 rounded-md bg-vscode-bg/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-vscode-text">{feature.name}</div>
                    <span className={`font-mono font-bold ${getImportanceColor(feature.importance)}`}>{(feature.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-vscode-border rounded h-2 overflow-hidden">
                    <div className="h-full bg-vscode-green transition-all duration-500" style={{ width: `${feature.importance * 100}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="retro-card p-8 rounded-lg text-center flex flex-col justify-center items-center">
            <BarChart3 className="w-12 h-12 text-vscode-blue mx-auto mb-4" />
            <h2 className="pixel-font text-xl text-vscode-yellow mb-2">Awaiting Global Analysis</h2>
            <p className="text-vscode-text/80 font-mono">Run Global Importance analysis to see results here.</p>
          </motion.div>
        )}

        {limeResult ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="retro-card p-6 rounded-lg">
            <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Local (LIME) Explanation</h2>
             <p className="font-mono text-sm text-vscode-text mb-4">Sample Prediction: <span className="text-vscode-yellow font-bold">{limeResult.prediction.toFixed(3)}</span></p>
            <div className="space-y-3">
              {limeResult.contributions.map((c, index) => (
                <motion.div key={c.feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="p-3 rounded-md bg-vscode-bg/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-vscode-text">{c.feature}</div>
                    <span className={`font-mono font-bold ${c.contribution >= 0 ? 'text-vscode-green' : 'text-vscode-red'}`}>{c.contribution.toFixed(4)}</span>
                  </div>
                  <div className="w-full bg-vscode-border rounded h-2 overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${getContributionColor(c.contribution)}`} style={{ width: `${Math.abs(c.contribution) * 100}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="retro-card p-8 rounded-lg text-center flex flex-col justify-center items-center">
            <Zap className="w-12 h-12 text-vscode-blue mx-auto mb-4" />
            <h2 className="pixel-font text-xl text-vscode-yellow mb-2">Awaiting Local Analysis</h2>
            <p className="text-vscode-text/80 font-mono">Run LIME analysis to see results here.</p>
          </motion.div>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="retro-card p-6 rounded-lg">
        <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Analysis Console</h2>
        <div className="console-output p-4 rounded h-64 overflow-y-auto">
          <div className="font-mono text-sm space-y-1">
            {analysisLogs.map((log, index) => (
              <div key={index}><span className="text-vscode-blue/70">[{log.timestamp}]</span> {log.message}</div>
            ))}
            {isAnalyzing && (
              <div className="text-vscode-yellow flicker">
                <span className="text-vscode-green">[ANALYZING]</span> Processing<span className="loading-dots"></span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Explainability;