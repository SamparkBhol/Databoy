import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Network, Play, Pause, RotateCcw, Users, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DataContext } from '@/context/DataContext';
import * as tf from '@tensorflow/tfjs';
import { createModel, preprocessData } from '@/lib/ml-utils';

const Federated = () => {
  const { csvData, analysis, fileName } = useContext(DataContext);
  const [clients, setClients] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [globalRound, setGlobalRound] = useState(0);
  const [globalAccuracy, setGlobalAccuracy] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (csvData && analysis) {
      initializeClients();
    }
  }, [csvData, analysis]);

  const addLog = (message) => {
    setTrainingLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message
    }]);
  };

  const initializeClients = () => {
    if (!csvData) return;
    const clientNames = ['Client_Alpha', 'Client_Beta', 'Client_Gamma'];
    const dataPerClient = Math.floor(csvData.length / clientNames.length);

    const newClients = clientNames.map((name, index) => {
      const startIndex = index * dataPerClient;
      const endIndex = (index + 1) * dataPerClient;
      const clientData = csvData.slice(startIndex, endIndex);
      return {
        id: index,
        name,
        status: 'idle',
        localAccuracy: 0,
        dataSize: clientData.length,
        progress: 0,
        rounds: 0,
        data: clientData,
      };
    });
    
    setClients(newClients);
    addLog('Federated clients initialized with partitioned data.');
    addLog(`Active clients: ${newClients.length}, each with ~${dataPerClient} samples.`);
  };

  const simulateClientTraining = async (client, globalModelWeights) => {
    return new Promise(async (resolve) => {
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: 'training', progress: 0 } : c));

      const { features, labels, featureNames, labelName } = preprocessData(client.data, analysis.numericColumns, analysis.categoricalColumns);
      if (!features || !labels) {
        addLog(`[${client.name}] Error: Failed to preprocess data.`);
        resolve({ weights: null, accuracy: 0 });
        return;
      }

      const clientModel = createModel('logistic', features.shape[1]);
      if (globalModelWeights) {
        clientModel.setWeights(globalModelWeights.map(w => tf.clone(w)));
      }

      let progress = 0;
      const epochs = 5;
      await clientModel.fit(features, labels, {
        epochs,
        batchSize: 32,
        callbacks: {
          onEpochEnd: (epoch) => {
            progress = ((epoch + 1) / epochs) * 100;
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, progress } : c));
          }
        }
      });

      const [loss, accuracy] = clientModel.evaluate(features, labels).map(t => t.dataSync()[0]);
      
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: 'completed', progress: 100, localAccuracy: accuracy, rounds: c.rounds + 1 } : c));
      
      addLog(`[${client.name}] Local training complete. Accuracy: ${(accuracy * 100).toFixed(1)}%`);
      
      const newWeights = clientModel.getWeights();
      features.dispose();
      labels.dispose();
      clientModel.dispose();

      resolve({ weights: newWeights, accuracy, dataSize: client.dataSize });
    });
  };

  const federatedAverage = (results) => {
    const totalDataSize = results.reduce((sum, res) => sum + res.dataSize, 0);
    const globalModel = createModel('logistic', analysis.numericColumns.length);
    const avgWeights = globalModel.getWeights().map(w => tf.zerosLike(w));

    results.forEach(res => {
      const weight = res.dataSize / totalDataSize;
      res.weights.forEach((w, i) => {
        avgWeights[i] = avgWeights[i].add(w.mul(weight));
      });
    });
    globalModel.dispose();
    return avgWeights;
  };

  const startFederatedTraining = async () => {
    if (isTraining) return;
    
    setIsTraining(true);
    addLog(`--- Starting Federated Round ${globalRound + 1} ---`);
    
    try {
      let globalModelWeights = null;
      if (globalRound > 0) {
        const globalModel = createModel('logistic', analysis.numericColumns.length);
        globalModel.setWeights(clients[0].modelWeights); // Use a placeholder for now
        globalModelWeights = globalModel.getWeights().map(w => tf.clone(w));
        globalModel.dispose();
      }

      setClients(prev => prev.map(c => ({ ...c, status: 'preparing', progress: 0 })));
      addLog('Broadcasting global model to clients...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const trainingPromises = clients.map(client => simulateClientTraining(client, globalModelWeights));
      const results = await Promise.all(trainingPromises);
      
      addLog('Aggregating client models (Federated Averaging)...');
      const newGlobalWeights = federatedAverage(results.filter(r => r.weights));
      
      const newGlobalAccuracy = results.reduce((sum, res) => sum + res.accuracy * res.dataSize, 0) / results.reduce((sum, res) => sum + res.dataSize, 0);
      setGlobalAccuracy(newGlobalAccuracy);
      setGlobalRound(prev => prev + 1);
      
      setClients(prev => prev.map(c => ({ ...c, status: 'idle', modelWeights: newGlobalWeights.map(w => tf.clone(w)) })));
      
      addLog(`Round ${globalRound + 1} complete. New Global Accuracy: ${(newGlobalAccuracy * 100).toFixed(1)}%`);
      
      toast({
        title: "Federated Round Complete",
        description: `Global accuracy is now ${(newGlobalAccuracy * 100).toFixed(1)}%`
      });
      
    } catch (error) {
      addLog(`Error: ${error.message}`);
      toast({ title: "Training Error", description: error.message, variant: "destructive" });
    } finally {
      setIsTraining(false);
    }
  };

  const resetSimulation = () => {
    setIsTraining(false);
    setGlobalRound(0);
    setGlobalAccuracy(0);
    setTrainingLogs([]);
    if (csvData) initializeClients();
  };

  if (!csvData) {
    return (
      <div className="text-center retro-card p-8 rounded-lg">
        <Upload className="w-12 h-12 text-vscode-blue mx-auto mb-4" />
        <h2 className="pixel-font text-xl text-vscode-yellow mb-2">No Data Loaded</h2>
        <p className="text-vscode-text/80 font-mono">
          Please upload a CSV file on the Analytics page to begin a federated learning simulation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="pixel-font text-3xl mb-4 text-vscode-green">Federated Learning Simulator</h1>
        <p className="text-vscode-text/80 font-mono">Simulate distributed ML on your dataset: <span className="text-vscode-yellow">{fileName}</span></p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="retro-card p-6 rounded-lg">
        <h2 className="pixel-font text-xl mb-4 text-vscode-yellow flex items-center"><Network className="w-6 h-6 mr-2 text-vscode-blue" />Global Model Status</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div><div className="text-2xl font-mono text-vscode-blue mb-2">{globalRound}</div><div className="text-vscode-text/80 text-sm">Training Rounds</div></div>
          <div><div className="text-2xl font-mono text-vscode-blue mb-2">{(globalAccuracy * 100).toFixed(1)}%</div><div className="text-vscode-text/80 text-sm">Global Accuracy</div></div>
          <div><div className="text-2xl font-mono text-vscode-blue mb-2">{clients.length}</div><div className="text-vscode-text/80 text-sm">Active Clients</div></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="retro-card p-6 rounded-lg">
        <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Federation Controls</h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={startFederatedTraining} disabled={isTraining} className="retro-button flex items-center"><Play className="w-4 h-4 mr-2" />{isTraining ? 'Training...' : 'Start Round'}</button>
          <button onClick={() => setIsTraining(false)} disabled={!isTraining} className="retro-button flex items-center"><Pause className="w-4 h-4 mr-2" />Stop Training</button>
          <button onClick={resetSimulation} disabled={isTraining} className="retro-button flex items-center"><RotateCcw className="w-4 h-4 mr-2" />Reset Simulation</button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="retro-card p-6 rounded-lg">
        <h2 className="pixel-font text-xl mb-4 text-vscode-yellow flex items-center"><Users className="w-6 h-6 mr-2 text-vscode-blue" />Client Status</h2>
        <div className="space-y-4">
          {clients.map((client) => (
            <div key={client.id} className="p-4 rounded bg-vscode-bg/50 vscode-border">
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-vscode-blue font-bold">{client.name}</div>
                <div className="text-vscode-text/80 font-mono text-sm">{client.dataSize} samples</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                <div><div className="text-vscode-text/80">Status:</div><div className="text-vscode-yellow">{client.status.toUpperCase()}</div></div>
                <div><div className="text-vscode-text/80">Accuracy:</div><div className="text-vscode-green">{(client.localAccuracy * 100).toFixed(1)}%</div></div>
                <div><div className="text-vscode-text/80">Rounds:</div><div className="text-vscode-purple">{client.rounds}</div></div>
              </div>
              {client.status === 'training' && (
                <div className="mt-3"><div className="progress-bar h-2" style={{ '--progress': `${client.progress}%` }} /></div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="retro-card p-6 rounded-lg">
        <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Federation Console</h2>
        <div className="console-output p-4 rounded h-64 overflow-y-auto">
          <div className="font-mono text-sm space-y-1">
            {trainingLogs.map((log, index) => (<div key={index}><span className="text-vscode-blue/70">[{log.timestamp}]</span> {log.message}</div>))}
            {isTraining && (<div className="text-vscode-yellow flicker"><span>[TRAINING]</span> Processing<span className="loading-dots"></span></div>)}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Federated;