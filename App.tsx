
import React, { useState } from 'react';
import Header from './components/Header';
import InputArea from './components/InputArea';
import ResultsDashboard from './components/ResultsDashboard';
import { analyzeSentiment } from './services/geminiService';
import { AnalysisResult } from './types';

type View = 'input' | 'results';

const App: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('input');

  const handleAnalyze = async (texts: string[]) => {
    if (texts.length === 0) {
      setError("Please enter some text or upload a file to analyze.");
      return; // Stay on input view to show the error
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResults(null);
    setActiveView('results'); // Switch to results view immediately to show loading

    try {
      const results = await analyzeSentiment(texts);
      setAnalysisResults(results);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const changeView = (view: View) => {
    if (activeView !== view) {
      setError(null); // Clear errors when manually switching tabs
      setActiveView(view);
    }
  };

  const getTabClassName = (view: View) => {
    const baseClasses = "px-4 py-2 text-lg font-medium transition-colors duration-200 focus:outline-none";
    if (activeView === view) {
      return `${baseClasses} border-b-2 border-blue-500 text-blue-600 dark:text-blue-400`;
    }
    return `${baseClasses} border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300`;
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">

          <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => changeView('input')}
                className={getTabClassName('input')}
                role="tab"
                aria-selected={activeView === 'input'}
                aria-controls="input-panel"
              >
                1. Input Data
              </button>
              <button
                onClick={() => (analysisResults || isLoading) && changeView('results')}
                className={`${getTabClassName('results')} disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-600`}
                disabled={!analysisResults && !isLoading}
                role="tab"
                aria-selected={activeView === 'results'}
                aria-controls="results-panel"
              >
                2. View Results
              </button>
            </nav>
          </div>

          {activeView === 'input' && (
            <div id="input-panel" role="tabpanel">
              <InputArea onAnalyze={handleAnalyze} isLoading={isLoading} />
              {error && !isLoading && (
                 <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                  </div>
              )}
            </div>
          )}

          {activeView === 'results' && (
            <div id="results-panel" role="tabpanel">
              {isLoading && (
                <div className="flex flex-col justify-center items-center mt-12 h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                  <p className="ml-4 text-lg mt-4">Analyzing sentiment...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a moment.</p>
                </div>
              )}

              {error && !isLoading && (
                <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <strong className="font-bold">Analysis Failed: </strong>
                  <span className="block sm:inline">{error}</span>
                   <p className="text-sm mt-2">Please return to the 'Input Data' tab to try again.</p>
                </div>
              )}

              {analysisResults && !isLoading && (
                <ResultsDashboard results={analysisResults} />
              )}
            </div>
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Sentiment Analysis Dashboard powered by Gemini</p>
      </footer>
    </div>
  );
};

export default App;
