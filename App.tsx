import React, { useState } from 'react';
import { analyzeDataQuality } from './services/geminiService';
import { DataQualityInputs, Issue } from './types';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { GithubIcon, BotIcon } from './components/Icons';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (inputs: DataQualityInputs) => {
    setIsLoading(true);
    setError(null);
    setIssues(null);

    try {
      const result = await analyzeDataQuality(inputs);
      setIssues(result.issues_detected);
    } catch (err) {
      setError('An error occurred while analyzing the data. Please check your inputs and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-brand-dark text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-900 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <BotIcon className="h-8 w-8 text-brand-primary dark:text-brand-secondary" />
              <h1 className="text-2xl font-bold text-brand-primary dark:text-white">
                Data Quality Bot
              </h1>
            </div>
            <a
              href="https://github.com/google/generative-ai-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <GithubIcon className="h-6 w-6" />
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
          <div className="mb-8 lg:mb-0">
            <InputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>
          <div>
            <ResultsDisplay isLoading={isLoading} error={error} issues={issues} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
