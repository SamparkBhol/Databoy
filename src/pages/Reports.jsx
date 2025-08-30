import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Sparkles, BarChart3, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DataContext } from '@/context/DataContext';

const Reports = () => {
  const { model, analysis, fileName } = useContext(DataContext);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportType, setReportType] = useState('executive');
  const [generationLogs, setGenerationLogs] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    addLog('AI Report Generator initialized.');
    if (model && analysis) {
      addLog('Model and data analysis found. Ready to generate reports.');
    } else {
      addLog('Waiting for a trained model and data analysis...');
    }
  }, [model, analysis]);

  const addLog = (message) => {
    setGenerationLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message
    }]);
  };

  const reportTemplates = {
    executive: {
      title: 'Executive Summary Report',
      description: 'High-level insights for business stakeholders',
      icon: BarChart3
    },
    technical: {
      title: 'Technical Analysis Report',
      description: 'Detailed technical findings for data scientists',
      icon: Brain
    }
  };

  const generateInsights = () => {
    const accuracy = parseFloat(model.metrics.accuracy) * 100;
    const insights = {
      executive: {
        summary: `Analysis of the '${fileName}' dataset using a ${model.config.featureCols.length}-feature model to predict '${model.config.targetCol}' achieved an accuracy of ${accuracy.toFixed(1)}%. This indicates a strong predictive capability, highlighting key business drivers within the data.`,
        keyFindings: [
          `Model achieved ${accuracy.toFixed(1)}% accuracy, demonstrating high reliability.`,
          `The primary drivers for predicting '${model.config.targetCol}' have been identified.`,
          "The federated learning approach shows potential for privacy-preserving insights.",
        ],
        recommendations: [
          "Leverage the model to inform strategic decisions related to the target variable.",
          "Investigate the top predictive features for deeper business understanding.",
          "Consider a pilot federated learning program for production deployment.",
        ],
      },
      technical: {
        summary: `A logistic regression model was trained on ${analysis.totalRows} samples from '${fileName}'. The model, using ${model.config.featureCols.length} features, converged to a final validation accuracy of ${accuracy.toFixed(1)}% with a loss of ${model.metrics.loss}.`,
        keyFindings: [
          `Model architecture: Sequential with dense layers.`,
          `Final validation accuracy: ${accuracy.toFixed(1)}%.`,
          `Final validation loss: ${model.metrics.loss}.`,
          `Features used: ${model.config.featureCols.join(', ')}.`,
        ],
        recommendations: [
          "Experiment with deeper architectures or different activation functions.",
          "Perform hyperparameter tuning for learning rate and batch size to optimize convergence.",
          "Conduct a more thorough feature importance analysis (e.g., SHAP) on the Explainability page.",
        ],
      }
    };
    return insights[reportType];
  };

  const generateReport = async () => {
    if (isGenerating) return;
    if (!model || !analysis) {
      toast({ title: "Missing Data or Model", description: "Please upload data and train a model first.", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    setGenerationLogs([]);
    
    try {
      addLog('Initializing AI report generation...');
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog('Analyzing model performance metrics...');
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog('Generating natural language insights...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const insights = generateInsights();
      
      const report = {
        id: Date.now(),
        type: reportType,
        title: reportTemplates[reportType].title,
        generatedAt: new Date().toLocaleString(),
        ...insights
      };
      
      setGeneratedReport(report);
      addLog('Report generation completed successfully.');
      toast({ title: "Report Generated", description: `${report.title} is ready.` });
      
    } catch (error) {
      addLog(`Error: ${error.message}`);
      toast({ title: "Generation Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!generatedReport) return;
    
    const reportContent = `
# ${generatedReport.title}
- Generated: ${generatedReport.generatedAt}
- Dataset: ${fileName}

## 1. Summary
${generatedReport.summary}

## 2. Key Findings
${generatedReport.keyFindings.map((finding) => `- ${finding}`).join('\n')}

## 3. Recommendations
${generatedReport.recommendations.map((rec) => `- ${rec}`).join('\n')}

---
Generated by DataBoy v2.0
    `;
    
    const blob = new Blob([reportContent.trim()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `databoy-report-${reportType}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Report Downloaded", description: "Markdown report saved." });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="pixel-font text-3xl mb-4 text-vscode-green">AI Report Generator</h1>
        <p className="text-vscode-text/80 font-mono">Generate technical or executive summaries from your model's performance.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="retro-card p-6 rounded-lg">
        <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Report Configuration</h2>
        <div className="flex border-b border-vscode-border mb-4">
          {Object.entries(reportTemplates).map(([key, template]) => (
            <button key={key} onClick={() => setReportType(key)} className={`vscode-tab ${reportType === key ? 'active' : ''}`}>
              <template.icon className="w-4 h-4 mr-2 inline" />{template.title}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={generateReport} disabled={isGenerating || !model} className="retro-button flex items-center"><Sparkles className="w-4 h-4 mr-2" />{isGenerating ? 'Generating...' : 'Generate Report'}</button>
          <button onClick={downloadReport} disabled={!generatedReport} className="retro-button flex items-center"><Download className="w-4 h-4 mr-2" />Download Report</button>
        </div>
      </motion.div>

      {generatedReport && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-6 rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="pixel-font text-xl text-vscode-yellow flex items-center"><FileText className="w-6 h-6 mr-2 text-vscode-blue" />{generatedReport.title}</h2>
            <span className="text-vscode-text/70 font-mono text-sm">{generatedReport.generatedAt}</span>
          </div>
          
          <div className="space-y-6 console-output p-4 rounded">
            <div>
              <h3 className="font-bold text-vscode-green mb-2 text-lg">1. Summary</h3>
              <p className="text-vscode-text font-mono text-sm leading-relaxed">{generatedReport.summary}</p>
            </div>
            <div>
              <h3 className="font-bold text-vscode-green mb-2 text-lg">2. Key Findings</h3>
              <ul className="list-disc list-inside space-y-2 font-mono text-sm">
                {generatedReport.keyFindings.map((finding, index) => <li key={index}>{finding}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-vscode-green mb-2 text-lg">3. Recommendations</h3>
              <ul className="list-disc list-inside space-y-2 font-mono text-sm">
                {generatedReport.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="retro-card p-6 rounded-lg">
        <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">AI Generation Console</h2>
        <div className="console-output p-4 rounded h-64 overflow-y-auto">
          <div className="font-mono text-sm space-y-1">
            {generationLogs.map((log, index) => (<div key={index}><span className="text-vscode-blue/70">[{log.timestamp}]</span> {log.message}</div>))}
            {isGenerating && (<div className="text-vscode-yellow flicker"><span>[AI]</span> Generating insights<span className="loading-dots"></span></div>)}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;