import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  BarChart3, 
  Brain, 
  Network, 
  Eye, 
  FileText,
  Zap,
  Database,
  Cpu
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Upload CSV data for in-depth EDA in a VSCode-style terminal.',
      path: '/analytics'
    },
    {
      icon: Brain,
      title: 'Real-World ML',
      description: 'Train models on your data with TensorFlow.js and detailed metrics.',
      path: '/ml'
    },
    {
      icon: Network,
      title: 'Federated Learning',
      description: 'Simulate distributed training on your dataset across multiple clients.',
      path: '/federated'
    },
    {
      icon: Eye,
      title: 'Model Explainability',
      description: 'Uncover model decisions with feature importance and SHAP-like analysis.',
      path: '/explainability'
    },
    {
      icon: FileText,
      title: 'AI-Powered Reports',
      description: 'Generate technical and executive summaries from your results.',
      path: '/reports'
    }
  ];

  const perspectives = [
    {
      icon: Database,
      title: 'Data Scientist',
      description: 'Perform comprehensive EDA, train and evaluate models, and interpret results with advanced explainability tools.'
    },
    {
      icon: Cpu,
      title: 'AI Engineer',
      description: 'Build, deploy, and optimize ML models in a simulated federated environment, focusing on performance and scalability.'
    },
    {
      icon: Zap,
      title: 'ML Researcher',
      description: 'Experiment with federated learning algorithms, analyze model convergence, and explore privacy-preserving techniques.'
    }
  ];

  return (
    <div className="space-y-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-6"
      >
        <div className="retro-card p-8 rounded-lg mx-auto max-w-4xl">
          <h1 className="pixel-font text-4xl md:text-6xl mb-4 text-vscode-green">
            Welcome to DataBoy
          </h1>
          <p className="text-xl md:text-2xl text-vscode-text font-mono">
            Advanced Federated Analytics in a VSCode Theme
          </p>
          <div className="mt-6 ascii-art text-center text-vscode-blue">
{`    ██████╗  █████╗ ████████╗ █████╗     ██████╗  ██████╗ ██╗   ██╗
    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗    ██╔══██╗██╔═══██╗╚██╗ ██╔╝
    ██║  ██║███████║   ██║   ███████║    ██████╔╝██║   ██║ ╚████╔╝ 
    ██║  ██║██╔══██║   ██║   ██╔══██║    ██╔══██╗██║   ██║  ╚██╔╝  
    ██████╔╝██║  ██║   ██║   ██║  ██║    ██████╔╝╚██████╔╝   ██║   
    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   `}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="data-grid"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={feature.path}>
              <div className="retro-card p-6 rounded-lg hover:scale-105 hover:border-vscode-blue transition-all duration-200 h-full flex flex-col">
                <feature.icon className="w-8 h-8 text-vscode-blue mb-4" />
                <h3 className="pixel-font text-lg mb-2 text-vscode-yellow">
                  {feature.title}
                </h3>
                <p className="text-vscode-text/80 font-mono text-sm flex-grow">
                  {feature.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="retro-card p-8 rounded-lg"
      >
        <h2 className="pixel-font text-2xl mb-6 text-vscode-green text-center">
          DataBoy Workflow
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {perspectives.map((perspective) => (
            <div key={perspective.title} className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-vscode-blue/20 rounded-full flex items-center justify-center vscode-border">
                <perspective.icon className="w-8 h-8 text-vscode-blue" />
              </div>
              <h3 className="pixel-font text-lg text-vscode-yellow">
                {perspective.title}
              </h3>
              <p className="text-vscode-text/80 font-mono text-sm">
                {perspective.description}
              </p>
            </div>
          ))}
        </div>

        <div className="console-output p-4 rounded">
          <div className="font-mono text-sm space-y-2">
            <div>
              <span className="text-vscode-green">user@databoy</span>:<span className="text-vscode-blue">~</span>$ databoy --init
            </div>
            <div className="text-vscode-text">
              [<span className="text-vscode-green">INFO</span>] Initializing federated analytics environment...
            </div>
            <div className="text-vscode-text">
              [<span className="text-vscode-green">INFO</span>] TensorFlow.js backend ready (webgl)
            </div>
            <div className="text-vscode-text">
              [<span className="text-vscode-green">INFO</span>] CSV data context provider loaded
            </div>
            <div className="text-vscode-text">
              [<span className="text-vscode-green">INFO</span>] Federated client simulator initialized
            </div>
            <div className="text-vscode-yellow">
              [SUCCESS] DataBoy v2.0 ready. Please upload a CSV to begin.
            </div>
            <div className="flicker">
              <span className="text-vscode-green">user@databoy</span>:<span className="text-vscode-blue">~</span>$ _
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-center"
      >
        <h2 className="pixel-font text-2xl mb-6 text-vscode-green">
          Ready to Start?
        </h2>
        <div className="space-y-4">
          <p className="text-vscode-text/80 font-mono">
            Upload your CSV dataset and unlock the power of federated machine learning.
          </p>
          <Link to="/analytics">
            <button className="retro-button text-lg px-8 py-3">
              <Upload className="inline w-5 h-5 mr-2" />
              Upload Data
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;