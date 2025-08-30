import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  Brain, 
  Network, 
  Eye, 
  FileText,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/ml', label: 'ML', icon: Brain },
    { path: '/federated', label: 'Federated', icon: Network },
    { path: '/explainability', label: 'Explainability', icon: Eye },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen crt-effect">
      <header className="vscode-border bg-vscode-panel-bg/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-vscode-blue rounded-sm flex items-center justify-center text-white text-sm font-bold">
                DB
              </div>
              <span className="pixel-font text-xl text-vscode-text">DataBoy</span>
            </Link>

            <nav className="hidden md:flex items-center border border-vscode-border rounded-md">
              {navItems.map(({ path, label, icon: Icon }, index) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2 transition-all duration-200 ${
                    location.pathname === path
                      ? 'bg-vscode-blue text-white'
                      : 'text-vscode-text hover:bg-white/10'
                  } ${index === 0 ? 'rounded-l-md' : ''} ${index === navItems.length - 1 ? 'rounded-r-md' : ''}`}
                >
                  <Icon size={16} />
                  <span className="font-mono text-sm">{label}</span>
                </Link>
              ))}
            </nav>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden retro-button p-2"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 space-y-2"
            >
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-all duration-200 ${
                    location.pathname === path
                      ? 'bg-vscode-blue text-white'
                      : 'text-vscode-text hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} />
                  <span className="font-mono text-sm">{label}</span>
                </Link>
              ))}
            </motion.nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="vscode-border bg-vscode-panel-bg mt-16">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <span className="font-mono text-vscode-text/70 text-sm">
              DataBoy v2.0 - Advanced Federated Analytics Playground
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;