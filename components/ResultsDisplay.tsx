import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { Issue } from '../types';
import IssueCard from './IssueCard';
import Loader from './Loader';
import { SearchIcon, ErrorIcon, CheckCircleIcon, TableIcon, ChevronDownIcon, DashboardIcon, ListIcon, XIcon, ColumnIcon } from './Icons';
import SeverityBadge from './SeverityBadge';

const DashboardView = lazy(() => import('./DashboardView'));

/**
 * Extracts the simple table name from a fully qualified name.
 * e.g., "[dbo].[MyTable]" -> "MyTable", "schema.table_name" -> "table_name"
 */
export const getShortTableName = (fullName: string): string => {
  if (!fullName) return 'Unnamed Table';
  // Remove brackets, backticks, and double quotes
  const cleanedName = fullName.replace(/[`"\[\]]/g, '');
  // Get the last part after any dots
  const parts = cleanedName.split('.');
  return parts[parts.length - 1];
};


interface ColumnIssuesGroupProps {
  columnName: string;
  issues: Issue[];
}

const ColumnIssuesGroup: React.FC<ColumnIssuesGroupProps> = ({ columnName, issues }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const severityCounts = useMemo(() => {
        return issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, { High: 0, Medium: 0, Low: 0 } as Record<Issue['severity'], number>);
    }, [issues]);

    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left p-3 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50 rounded-lg"
                aria-expanded={isExpanded}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 min-w-0">
                        <ColumnIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 truncate" title={columnName}>{columnName}</h4>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                        <div className="flex items-center space-x-2">
                          {severityCounts.High > 0 && <SeverityBadge severity="High" count={severityCounts.High} />}
                          {severityCounts.Medium > 0 && <SeverityBadge severity="Medium" count={severityCounts.Medium} />}
                          {severityCounts.Low > 0 && <SeverityBadge severity="Low" count={severityCounts.Low} />}
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[10000px]' : 'max-h-0'}`}>
              <div className="px-3 pb-3">
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                  {issues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} />
                  ))}
                </div>
              </div>
            </div>
        </div>
    );
};

interface TableIssuesGroupProps {
  tableName: string;
  issues: Issue[];
  isExpanded: boolean;
  onToggle: () => void;
}

const TableIssuesGroup: React.FC<TableIssuesGroupProps> = ({ tableName, issues, isExpanded, onToggle }) => {
  const shortTableName = getShortTableName(tableName);

  const severityCounts = useMemo(() => {
    return issues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
    }, { High: 0, Medium: 0, Low: 0 } as Record<Issue['severity'], number>);
  }, [issues]);
  
  const issuesByColumn = useMemo(() => {
    const grouped: Record<string, Issue[]> = { 'Table-Level Issues': [] };
    issues.forEach(issue => {
        const key = issue.column_name || 'Table-Level Issues';
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(issue);
    });
    // Don't show empty table-level group
    if (grouped['Table-Level Issues'].length === 0) {
        delete grouped['Table-Level Issues'];
    }
    // Sort columns to have Table-Level Issues first, then alphabetically
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'Table-Level Issues') return -1;
        if (b === 'Table-Level Issues') return 1;
        return a.localeCompare(b);
    });

    return sortedKeys.reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
    }, {} as Record<string, Issue[]>);
  }, [issues]);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" id={`table-group-${tableName.replace(/\s+/g, '-')}`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50 rounded-lg"
        aria-expanded={isExpanded}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 flex-grow min-w-0">
            <TableIcon className="h-6 w-6 text-brand-primary dark:text-brand-secondary flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate" title={tableName}>{shortTableName}</h3>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
            <div className="hidden sm:flex items-center space-x-2">
              {severityCounts.High > 0 && <SeverityBadge severity="High" count={severityCounts.High} />}
              {severityCounts.Medium > 0 && <SeverityBadge severity="Medium" count={severityCounts.Medium} />}
              {severityCounts.Low > 0 && <SeverityBadge severity="Low" count={severityCounts.Low} />}
            </div>
            <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[10000px]' : 'max-h-0'}`}>
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700/50">
          <div className="space-y-3 pt-4">
            {Object.keys(issuesByColumn).map(columnName => (
                <ColumnIssuesGroup
                    key={columnName}
                    columnName={columnName}
                    issues={issuesByColumn[columnName]}
                />
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

interface ResultsDisplayProps {
  isLoading: boolean;
  error: string | null;
  issues: Issue[] | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, error, issues }) => {
    const [activeSeverityFilter, setActiveSeverityFilter] = useState<Issue['severity'] | 'All'>('All');
    const [activeTypeFilter, setActiveTypeFilter] = useState<string | 'All'>('All');
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

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
    
    useEffect(() => {
        // When new issues are loaded, reset filters and expand the first table group by default
        if (issues && issues.length > 0) {
            const firstTable = Object.keys(issuesByTable)[0];
            if(firstTable) {
                setExpandedTables(new Set([firstTable]));
            }
            setActiveSeverityFilter('All');
            setActiveTypeFilter('All');
            setSelectedTable(null);
            setViewMode('dashboard');
        }
    }, [issues, issuesByTable]);

    const filteredIssuesByTable = useMemo(() => {
        let baseIssues = issuesByTable;
        if (selectedTable && baseIssues[selectedTable]) {
            baseIssues = { [selectedTable]: baseIssues[selectedTable] };
        }

        const isSeverityFiltered = activeSeverityFilter !== 'All';
        const isTypeFiltered = activeTypeFilter !== 'All';
        
        if (!isSeverityFiltered && !isTypeFiltered) return baseIssues;
        
        const filtered: Record<string, Issue[]> = {};
        Object.keys(baseIssues).forEach(tableName => {
            const tableIssues = baseIssues[tableName].filter(issue => {
                const severityMatch = !isSeverityFiltered || issue.severity === activeSeverityFilter;
                const typeMatch = !isTypeFiltered || issue.type === activeTypeFilter;
                return severityMatch && typeMatch;
            });

            if (tableIssues.length > 0) {
                filtered[tableName] = tableIssues;
            }
        });
        return filtered;
    }, [issuesByTable, activeSeverityFilter, activeTypeFilter, selectedTable]);

    const handleIssueTypeSelect = (issueType: string) => {
      setViewMode('list');
      setActiveSeverityFilter('All');
      setActiveTypeFilter(issueType);
      setSelectedTable(null);

      // Expand all tables that contain this issue type
      const tablesWithIssue = Object.keys(issuesByTable).filter(tableName =>
          issuesByTable[tableName].some(issue => issue.type === issueType)
      );
      setExpandedTables(new Set(tablesWithIssue));
    };

    const handleTableSelect = (tableName: string) => {
        setViewMode('list');
        setSelectedTable(tableName);
        setActiveTypeFilter('All');
        setActiveSeverityFilter('All');
        setExpandedTables(new Set([tableName]));
    };
    
    const toggleTableExpansion = (tableName: string) => {
        setExpandedTables(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tableName)) {
                newSet.delete(tableName);
            } else {
                newSet.add(tableName);
            }
            return newSet;
        });
    };

    const renderContent = () => {
        if (isLoading) return <Loader />;
        if (error) return <ErrorState message={error} />;
        if (issues === null) return <IdleState />;
        if (issues.length === 0) return <NoIssuesState />;
        
        const tableNames = Object.keys(filteredIssuesByTable);

        return (
            <div className="w-full">
                 <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Analysis Summary</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{issues.length} total issues found.</p>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                        <button onClick={() => setViewMode('dashboard')} className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${viewMode === 'dashboard' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                            <DashboardIcon className="w-4 h-4" /> Dashboard
                        </button>
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                            <ListIcon className="w-4 h-4" /> List View
                        </button>
                    </div>
                </div>

                {viewMode === 'dashboard' ? (
                     <Suspense fallback={<div className="text-center py-10">Loading Dashboard...</div>}>
                        <DashboardView
                            issues={issues}
                            onIssueTypeSelect={handleIssueTypeSelect}
                            onTableSelect={handleTableSelect}
                         />
                     </Suspense>
                ) : (
                    <>
                        {selectedTable && (
                             <div className="my-4 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center text-sm">
                                <p className="text-blue-800 dark:text-blue-200">
                                    <span className="font-semibold">Filtering by table:</span> {getShortTableName(selectedTable)}
                                </p>
                                <button onClick={() => setSelectedTable(null)} className="p-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                                    <XIcon className="w-4 h-4 text-blue-600 dark:text-blue-300"/>
                                    <span className="sr-only">Clear table filter</span>
                                </button>
                            </div>
                        )}
                        <div className="my-6 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Severity:</span>
                            {(['All', 'High', 'Medium', 'Low'] as const).map(sev => (
                                <button key={sev} onClick={() => setActiveSeverityFilter(sev)} className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${activeSeverityFilter === sev ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                {sev}
                                </button>
                            ))}
                        </div>
                        {activeTypeFilter !== 'All' && (
                             <div className="my-4 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center text-sm">
                                <p className="text-blue-800 dark:text-blue-200">
                                    <span className="font-semibold">Filtering by issue type:</span> {activeTypeFilter}
                                </p>
                                <button onClick={() => setActiveTypeFilter('All')} className="p-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                                    <XIcon className="w-4 h-4 text-blue-600 dark:text-blue-300"/>
                                    <span className="sr-only">Clear issue type filter</span>
                                </button>
                            </div>
                        )}
                        <div className="space-y-4">
                            {tableNames.length > 0 ? (
                                tableNames.map((tableName) => (
                                    <TableIssuesGroup 
                                      key={tableName} 
                                      tableName={tableName} 
                                      issues={filteredIssuesByTable[tableName]} 
                                      isExpanded={expandedTables.has(tableName)}
                                      onToggle={() => toggleTableExpansion(tableName)} 
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No issues match the selected filter.
                                </div>
                            )}
                        </div>
                    </>
                )}
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