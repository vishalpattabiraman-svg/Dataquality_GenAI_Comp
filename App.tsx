import React, { useState, lazy, Suspense } from 'react';
import { analyzeDataQuality, generateReportSummary } from './services/geminiService';
import { DataQualityInputs, Issue } from './types';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { GithubIcon, BotIcon, ChatIcon } from './components/Icons';

const ChatView = lazy(() => import('./components/ChatView'));

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleAnalyze = async (inputs: DataQualityInputs) => {
    setIsLoading(true);
    setError(null);
    setIssues(null);
    setReport(null);
    setIsChatOpen(false);

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

  const handleGenerateReport = async () => {
    if (!issues || issues.length === 0) return;
    setIsReportLoading(true);
    setReport(null);
    try {
      const summaryReport = await generateReportSummary(issues);
      setReport(summaryReport);
    } catch (reportError) {
      console.error("Failed to generate summary report:", reportError);
      setReport("### Report Generation Failed\n\nAn error occurred while generating the summary. Please try again later.");
    } finally {
      setIsReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-dark text-slate-800 dark:text-slate-200 font-sans">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3">
              <BotIcon className="h-8 w-8 text-brand-primary dark:text-brand-secondary" />
              <h1 className="text-2xl font-bold text-brand-primary dark:text-white">
                Data Quality Bot
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {issues && issues.length > 0 && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-brand-accent rounded-lg shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all"
                  aria-label="Start chat with AI assistant"
                >
                  <ChatIcon className="w-4 h-4" />
                  <span>Ask AI</span>
                </button>
              )}
              <a
                href="https://github.com/google/generative-ai-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <GithubIcon className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-12">
          <InputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
          
          <ResultsDisplay
            isLoading={isLoading}
            error={error}
            issues={issues}
            report={report}
            isReportLoading={isReportLoading}
            onGenerateReport={handleGenerateReport}
          />
        </div>
      </main>

      <Suspense fallback={null}>
          <ChatView 
              issues={issues || []} 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
          />
      </Suspense>
    </div>
  );
};

export default App;
