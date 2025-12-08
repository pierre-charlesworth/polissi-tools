import React, { useState, useEffect } from 'react';
import { Calculator } from './components/Calculator';
import { Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-lab-dark font-sans text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-800 dark:selection:text-emerald-200 transition-colors duration-300 flex flex-col">
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-lab-dark/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-serif italic font-medium text-zinc-900 dark:text-white tracking-wide">
              BioCalc
            </span>
            <span className="text-xs font-sans tracking-[0.2em] text-zinc-500 uppercase">
              Laboratory
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-xs font-medium text-zinc-500 border border-zinc-200 dark:border-white/10 px-3 py-1 rounded-full">
              v1.0
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-12 pb-0 sm:px-6 lg:px-8 flex-grow">
        <Calculator isDarkMode={isDarkMode} />
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 text-center border-t border-zinc-200 dark:border-white/5 mt-4">
        <p className="text-[10px] tracking-[0.2em] text-zinc-400 dark:text-zinc-600 uppercase font-sans">
          &copy; 2025 THE <span className="font-serif italic text-sm text-zinc-600 dark:text-zinc-500 lowercase px-1" style={{ fontVariant: 'small-caps' }}>Polissi</span> LAB. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
};

export default App;