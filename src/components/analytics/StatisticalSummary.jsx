import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatisticalSummary = ({ statistics }) => {
  if (Object.keys(statistics).length === 0) return null;

  return (
    <div className="retro-card p-6 rounded-lg">
      <h2 className="pixel-font text-xl mb-4 text-vscode-yellow flex items-center">
        <TrendingUp className="w-6 h-6 mr-2 text-vscode-blue" />
        Statistical Summary
      </h2>
      
      <div className="console-output p-4 rounded overflow-x-auto">
        <div className="font-mono text-xs whitespace-pre">
          <div className="text-vscode-green font-bold">
            {'Column'.padEnd(20)} {'Count'.padStart(8)} {'Mean'.padStart(10)} {'Median'.padStart(10)} {'Std Dev'.padStart(10)} {'Min'.padStart(10)} {'Max'.padStart(10)}
          </div>
          {Object.entries(statistics).map(([column, stats]) => (
            <div key={column} className="text-vscode-text">
              {column.padEnd(20).substring(0,20)} {stats.count.toString().padStart(8)} {stats.mean.padStart(10)} {stats.median.padStart(10)} {stats.std.padStart(10)} {stats.min.padStart(10)} {stats.max.padStart(10)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticalSummary;