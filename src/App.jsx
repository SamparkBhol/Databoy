import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Analytics from '@/pages/Analytics';
import MachineLearning from '@/pages/MachineLearning';
import Federated from '@/pages/Federated';
import Explainability from '@/pages/Explainability';
import Reports from '@/pages/Reports';
import { DataProvider } from '@/context/DataContext';

function App() {
  return (
    <>
      <Helmet>
        <title>DataBoy - Advanced Federated Analytics Playground</title>
        <meta name="description" content="An advanced, VSCode-themed federated learning and data science playground. Upload CSV data, train models, and explore AI insights with a professional terminal interface." />
        <meta property="og:title" content="DataBoy - Advanced Federated Analytics Playground" />
        <meta property="og:description" content="An advanced, VSCode-themed federated learning and data science playground. Upload CSV data, train models, and explore AI insights with a professional terminal interface." />
      </Helmet>
      
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-vscode-bg matrix-bg">
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/ml" element={<MachineLearning />} />
                <Route path="/federated" element={<Federated />} />
                <Route path="/explainability" element={<Explainability />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </Layout>
            <Toaster />
          </div>
        </Router>
      </DataProvider>
    </>
  );
}

export default App;