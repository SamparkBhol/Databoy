import React, { createContext, useState } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [csvData, setCsvData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [fileName, setFileName] = useState('');
  const [model, setModel] = useState(null); // { tfModel, metrics, config }
  const [explanation, setExplanation] = useState(null);

  const value = {
    csvData,
    setCsvData,
    analysis,
    setAnalysis,
    fileName,
    setFileName,
    model,
    setModel,
    explanation,
    setExplanation,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};