import React, { useState, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { DataContext } from '@/context/DataContext';
import Papa from 'papaparse';

import DataUpload from '@/components/analytics/DataUpload';
import StatisticalSummary from '@/components/analytics/StatisticalSummary';
import CorrelationHeatmap from '@/components/analytics/CorrelationHeatmap';
import ScientistToolkit from '@/components/analytics/ScientistToolkit';

const Analytics = () => {
  const { csvData, setCsvData, analysis, setAnalysis, fileName, setFileName } = useContext(DataContext);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const performAnalysis = useCallback((data) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const numericColumns = [];
    const categoricalColumns = [];

    headers.forEach(header => {
      const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
      if (values.length === 0) return;
      const numericValues = values.filter(val => !isNaN(parseFloat(val)));
      
      if (numericValues.length / values.length > 0.8) {
        numericColumns.push(header);
      } else {
        categoricalColumns.push(header);
      }
    });

    const statistics = {};
    numericColumns.forEach(col => {
      const values = data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
      if (values.length > 0) {
        const sorted = values.slice().sort((a, b) => a - b);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        statistics[col] = {
          count: values.length,
          mean: mean.toFixed(3),
          median: sorted[Math.floor(sorted.length / 2)].toFixed(3),
          std: Math.sqrt(variance).toFixed(3),
          min: Math.min(...values).toFixed(3),
          max: Math.max(...values).toFixed(3)
        };
      }
    });

    const correlations = {};
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        const values1 = data.map(row => parseFloat(row[col1]));
        const values2 = data.map(row => parseFloat(row[col2]));
        
        const pairedValues = values1.map((v1, index) => [v1, values2[index]]).filter(([v1, v2]) => !isNaN(v1) && !isNaN(v2));
        
        if (pairedValues.length > 1) {
          const x = pairedValues.map(p => p[0]);
          const y = pairedValues.map(p => p[1]);
          const n = x.length;
          const sumX = x.reduce((a, b) => a + b, 0);
          const sumY = y.reduce((a, b) => a + b, 0);
          const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
          const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
          const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
          const numerator = n * sumXY - sumX * sumY;
          const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
          const correlation = denominator === 0 ? 0 : numerator / denominator;
          correlations[`${col1} | ${col2}`] = correlation;
        }
      }
    }

    setAnalysis({
      totalRows: data.length,
      totalColumns: headers.length,
      numericColumns,
      categoricalColumns,
      statistics,
      correlations
    });
  }, [setAnalysis]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({ title: "Invalid File Type", description: "Please upload a CSV file.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    Papa.parse(file, {
      complete: (results) => {
        if (results.errors.length > 0) {
          toast({ title: "Parse Error", description: "Error parsing CSV file.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        
        const parsedData = results.data.map(row => {
          const newRow = {};
          for (const key in row) {
             const trimmedKey = key.trim();
             newRow[trimmedKey] = row[key];
          }
          return newRow;
        });

        setCsvData(parsedData);
        performAnalysis(parsedData);
        setIsLoading(false);
        toast({ title: "File Uploaded Successfully", description: `Loaded ${parsedData.length} rows from ${file.name}.` });
      },
      header: true,
      skipEmptyLines: true,
      error: (error) => {
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
        setIsLoading(false);
      }
    });
  }, [toast, setCsvData, performAnalysis, setFileName]);

  const handleProcessData = useCallback((method) => {
    if (!csvData) {
      toast({ title: 'No Data', description: 'Please upload a CSV file first.', variant: 'destructive' });
      return;
    }
    
    let processedData = JSON.parse(JSON.stringify(csvData));
    const { numericColumns } = analysis;

    if (method === 'normalize') {
      numericColumns.forEach(col => {
        const values = processedData.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
        const min = Math.min(...values);
        const max = Math.max(...values);
        processedData.forEach(row => {
          row[col] = (parseFloat(row[col]) - min) / (max - min);
        });
      });
    } else if (method === 'standardize') {
      numericColumns.forEach(col => {
        const values = processedData.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / values.length);
        processedData.forEach(row => {
          row[col] = (parseFloat(row[col]) - mean) / std;
        });
      });
    } else if (method === 'impute') {
       numericColumns.forEach(col => {
        const values = processedData.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
         processedData.forEach(row => {
          if (row[col] === '' || row[col] === null || isNaN(parseFloat(row[col]))) {
            row[col] = mean;
          }
        });
      });
    }

    setCsvData(processedData);
    performAnalysis(processedData);
    toast({ title: 'Data Processed', description: `Applied ${method} to numeric columns.` });
  }, [csvData, analysis, setCsvData, performAnalysis, toast]);


  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="pixel-font text-3xl mb-4 text-vscode-green">Analytics Terminal</h1>
        <p className="text-vscode-text/80 font-mono">Upload and analyze your CSV dataset with advanced tools.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <DataUpload onFileUpload={handleFileUpload} isLoading={isLoading} fileName={fileName} />
      </motion.div>

      {analysis && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <ScientistToolkit onProcessData={handleProcessData} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
            <StatisticalSummary statistics={analysis.statistics} />
            <CorrelationHeatmap correlations={analysis.correlations} />
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Analytics;