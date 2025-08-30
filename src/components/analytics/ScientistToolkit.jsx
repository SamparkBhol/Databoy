import React from 'react';
import { Sliders, TestTube, Beaker } from 'lucide-react';

const ScientistToolkit = ({ onProcessData }) => {
  return (
    <div className="retro-card p-6 rounded-lg">
      <h2 className="pixel-font text-xl mb-4 text-vscode-yellow flex items-center">
        <TestTube className="w-6 h-6 mr-2 text-vscode-blue" />
        Scientist Toolkit: Data Preprocessing
      </h2>
      <div className="space-y-4">
        <p className="font-mono text-sm text-vscode-text/80">
          Apply transformations to your dataset's numeric columns before analysis or training.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => onProcessData('normalize')}
            className="retro-button flex items-center"
          >
            <Sliders className="w-4 h-4 mr-2" />
            Normalize (0-1)
          </button>
          <button
            onClick={() => onProcessData('standardize')}
            className="retro-button flex items-center"
          >
            <Beaker className="w-4 h-4 mr-2" />
            Standardize (Z-score)
          </button>
           <button
            onClick={() => onProcessData('impute')}
            className="retro-button flex items-center"
          >
            <Sliders className="w-4 h-4 mr-2" />
            Impute Missing (Mean)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScientistToolkit;