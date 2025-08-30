import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, BarElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, BarElement);

// This is a simplified "heatmap" using bar charts for visual representation.
// A proper matrix/heatmap chart type would require a more complex setup or a different chart library.
const CorrelationHeatmap = ({ correlations }) => {
  const chartRef = useRef(null);

  const getStrengthColor = (value) => {
    const alpha = Math.abs(value);
    return value > 0 ? `rgba(78, 201, 176, ${alpha})` : `rgba(244, 71, 71, ${alpha})`;
  };

  useEffect(() => {
    if (Object.keys(correlations).length === 0) return;

    const labels = Object.keys(correlations);
    const data = {
      labels: labels,
      datasets: [{
        label: 'Correlation',
        data: labels.map(label => correlations[label]),
        backgroundColor: labels.map(label => getStrengthColor(correlations[label])),
        borderColor: '#3c3c3c',
        borderWidth: 1,
      }]
    };

    const config = {
      type: 'bar',
      data: data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            min: -1,
            max: 1,
            ticks: { color: '#d4d4d4', font: { family: "'Fira Code', monospace" } },
            grid: { color: 'rgba(212, 212, 212, 0.1)' },
          },
          y: {
            ticks: { color: '#d4d4d4', font: { family: "'Fira Code', monospace" } },
            grid: { color: 'rgba(212, 212, 212, 0.1)' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Correlation: ${context.raw.toFixed(3)}`;
              }
            }
          }
        }
      },
    };

    const chartInstance = new ChartJS(chartRef.current, config);

    return () => {
      chartInstance.destroy();
    };
  }, [correlations]);

  return (
    <div className="retro-card p-6 rounded-lg">
      <h2 className="pixel-font text-xl mb-4 text-vscode-yellow">Correlation Heatmap</h2>
      <div className="console-output p-4 rounded h-96">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default CorrelationHeatmap;