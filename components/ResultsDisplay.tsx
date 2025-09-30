import React, { useState, useMemo } from 'react';
import { Issue } from '../types';
import IssueCard from './IssueCard';
import Loader from './Loader';
import { SearchIcon, ErrorIcon, CheckCircleIcon, AlertIcon, TotalIssuesIcon, TableIcon, ChevronDownIcon } from './Icons';
import SeverityBadge from './SeverityBadge';

interface ResultsDisplayProps {
  isLoading: boolean;
  error: string | null;
  issues: Issue[] | null;
}

interface TableIssuesGroupProps {
  tableName: string;
  issues: Issue[];
  isInitiallyExpanded: boolean;
}

const TableIssuesGroup: React.FC<TableIssuesGroupProps> = ({ tableName, issues, isInitiallyExpanded }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const severityCounts = useMemo(() => {
    return issues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
    }, { High: 0, Medium: 0, Low: 0 } as Record<Issue['severity'], number>);
  }, [issues]);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50 rounded-lg"
        aria-expanded={isExpanded}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 flex-grow min-w-0">
            <TableIcon className="h-6 w-6 text-brand-primary dark:text-brand-secondary flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate" title={tableName}>{tableName}</h3>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
            <div className="hidden sm:flex items-center space-x-2">
              {severityCounts.High > 0 && <SeverityBadge severity="High" />}
              {severityCounts.Medium > 0 && <SeverityBadge severity="Medium" />}
              {severityCounts.Low > 0 && <SeverityBadge severity="Low" />}
            </div>
            <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[10000px]' : 'max-h-0'}`}>
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700/50">
          <div className="space-y-3 pt-4">
            {issues.map((issue, index) => (
              <IssueCard key={index} issue={issue} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


const IdleState: React.FC = () => (
  <div className="text-center p-8">
    <SearchIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-200">Waiting for analysis</h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your data quality report will appear here once the analysis is complete.</p>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
    <ErrorIcon className="mx-auto h-12 w-12 text-red-500" />
    <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-300">Analysis Failed</h3>
    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{message}</p>
  </div>
);

const NoIssuesState: React.FC = () => (
    <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
    <h3 className="mt-4 text-lg font-medium text-green-800 dark:text-green-300">No Issues Detected</h3>
    <p className="mt-1 text-sm text-green-600 dark:text-green-400">Great job! The bot didn't find any data quality issues.</p>
  </div>
);

const SummaryCard: React.FC<{ icon: React.ReactNode; title: string; count: number; }> = ({ icon, title, count }) => (
    <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {icon}
        <div className="ml-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
        </div>
    </div>
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, error, issues }) => {
    const [activeFilter, setActiveFilter] = useState<Issue['severity'] | 'All'>('All');

    const severityCounts = useMemo(() => {
        if (!issues) return { High: 0, Medium: 0, Low: 0 };
        return issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, { High: 0, Medium: 0, Low: 0 } as Record<Issue['severity'], number>);
    }, [issues]);

    const issuesByTable = useMemo(() => {
        if (!issues) return {};
        return issues.reduce((acc, issue) => {
            const tableName = issue.table_name || 'General Issues';
            if (!acc[tableName]) {
                acc[tableName] = [];
            }
            acc[tableName].push(issue);
            return acc;
        }, {} as Record<string, Issue[]>);
    }, [issues]);

    const filteredIssuesByTable = useMemo(() => {
        if (activeFilter === 'All') return issuesByTable;
        
        const filtered: Record<string, Issue[]> = {};
        Object.keys(issuesByTable).forEach(tableName => {
            const tableIssues = issuesByTable[tableName].filter(
                issue => issue.severity === activeFilter
            );
            if (tableIssues.length > 0) {
                filtered[tableName] = tableIssues;
            }
        });
        return filtered;
    }, [issuesByTable, activeFilter]);


    const renderContent = () => {
        if (isLoading) return <Loader />;
        if (error) return <ErrorState message={error} />;
        if (issues === null) return <IdleState />;
        if (issues.length === 0) return <NoIssuesState />;
        
        const tableNames = Object.keys(filteredIssuesByTable);

        return (
            <div className="w-full">
                {/* Summary Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Analysis Summary</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard icon={<TotalIssuesIcon className="w-8 h-8 text-brand-primary dark:text-brand-secondary"/>} title="Total Issues" count={issues.length} />
                        <SummaryCard icon={<AlertIcon className="w-8 h-8 text-severity-high"/>} title="High Severity" count={severityCounts.High || 0} />
                        <SummaryCard icon={<AlertIcon className="w-8 h-8 text-severity-medium"/>} title="Medium Severity" count={severityCounts.Medium || 0} />
                        <SummaryCard icon={<AlertIcon className="w-8 h-8 text-severity-low"/>} title="Low Severity" count={severityCounts.Low || 0} />
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-4 flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
                    {(['All', 'High', 'Medium', 'Low'] as const).map(sev => (
                        <button
                          key={sev}
                          onClick={() => setActiveFilter(sev)}
                          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                            activeFilter === sev
                              ? 'bg-brand-primary text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {sev}
                        </button>
                    ))}
                </div>
                
                {/* Issues List by Table */}
                 <div className="space-y-4">
                    {tableNames.length > 0 ? (
                         tableNames.map((tableName, index) => (
                            <TableIssuesGroup 
                              key={tableName}
                              tableName={tableName} 
                              issues={filteredIssuesByTable[tableName]}
                              isInitiallyExpanded={index === 0} 
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No issues match the selected filter.
                        </div>
                    )}
                </div>
            </div>
        )
    };
    
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg min-h-[500px] flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Analysis Results</h2>
            <div className="flex-grow flex items-start justify-center pt-4">
                 {renderContent()}
            </div>
        </div>
    );
};

export default ResultsDisplay;