import React from 'react';
import { Upload, FileText } from 'lucide-react';

const DataUpload = ({ onFileUpload, isLoading, fileName }) => {
  return (
    <div className="retro-card p-6 rounded-lg">
      <div className="text-center space-y-4">
        <Upload className="w-12 h-12 text-vscode-blue mx-auto" />
        <h2 className="pixel-font text-xl text-vscode-yellow">Data Upload</h2>
        
        <div className="relative inline-block">
          <input
            type="file"
            accept=".csv"
            onChange={onFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />
          <button className="retro-button text-lg px-8 py-3" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-dots">Loading</span>
            ) : (
              <>
                <FileText className="inline w-5 h-5 mr-2" />
                Choose CSV File
              </>
            )}
          </button>
        </div>
        
        {fileName && (
          <p className="text-vscode-text/80 font-mono text-sm mt-2">
            <span className="text-vscode-green">Loaded:</span> {fileName}
          </p>
        )}
      </div>
    </div>
  );
};

export default DataUpload;