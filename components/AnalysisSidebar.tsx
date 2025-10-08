import React from 'react';
import { Issue } from '../types';
import { getShortTableName } from './ResultsDisplay';
import { DashboardIcon, TableIcon, TotalIssuesIcon } from './Icons';
import SeverityBadge from './SeverityBadge';

// Props for the sidebar
interface AnalysisSidebarProps {
  issues: Issue[];
  issuesByTable: Record<string, Issue[]>;
  activeSelection: string; // Can be 'dashboard' or a table name
  onSelectionChange: (selection: string) => void;
  activeSeverityFilter: Issue['severity'] | 'All';
  onSeverityFilterChange: (severity: Issue['severity'] | 'All') => void;
}

// A single item in the table navigation list
const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  issueCount?: number;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, issueCount, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-brand-secondary text-white shadow'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`}
  >
    <div className="flex items-center min-w-0">
      <div className="flex-shrink-0 w-5 h-5 mr-3">{icon}</div>
      <span className="truncate">{label}</span>
    </div>
    {issueCount !== undefined && (
      <span
        className={`flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
          isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        {issueCount}
      </span>
    )}
  </button>
);

const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({
  issues,
  issuesByTable,
  activeSelection,
  onSelectionChange,
  activeSeverityFilter,
  onSeverityFilterChange,
}) => {
  const tableNames = Object.keys(issuesByTable).sort((a, b) => a.localeCompare(b));
  
  const severityCounts = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, { High: 0, Medium: 0, Low: 0 } as Record<Issue['severity'], number>);

  return (
    <div className="sticky top-6 space-y-6">
      {/* Summary Section */}
      <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-md shadow-sm">
            <div className="flex items-center">
              <TotalIssuesIcon className="w-6 h-6 text-brand-primary dark:text-brand-secondary mr-3" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Total Issues</span>
            </div>
            <span className="font-bold text-xl text-slate-800 dark:text-white">{issues.length}</span>
          </div>
          <div className="flex justify-around pt-2">
            <SeverityBadge severity="High" count={severityCounts.High} />
            <SeverityBadge severity="Medium" count={severityCounts.Medium} />
            <SeverityBadge severity="Low" count={severityCounts.Low} />
          </div>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Filter by Severity</h3>
        <div className="flex flex-wrap gap-2">
          {(['All', 'High', 'Medium', 'Low'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => onSeverityFilterChange(sev)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                activeSeverityFilter === sev
                  ? 'bg-brand-primary text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="space-y-1">
        <NavItem
          label="Dashboard"
          icon={<DashboardIcon />}
          isActive={activeSelection === 'dashboard'}
          onClick={() => onSelectionChange('dashboard')}
        />
        <hr className="!my-3 border-slate-200 dark:border-slate-700" />
        <h3 className="px-3 pt-1 pb-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tables</h3>
        {tableNames.map(tableName => (
          <NavItem
            key={tableName}
            label={getShortTableName(tableName)}
            icon={<TableIcon />}
            issueCount={issuesByTable[tableName].length}
            isActive={activeSelection === tableName}
            onClick={() => onSelectionChange(tableName)}
          />
        ))}
      </nav>
    </div>
  );
};

export default AnalysisSidebar;