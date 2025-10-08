import React, { useMemo } from 'react';
import { Issue } from '../types';
import SunburstChart, { SunburstData } from './SunburstChart';

type HealthStatus = 'Critical' | 'Warning' | 'Healthy';

interface TableHealthCardProps {
  tableName: string;
  issues: Issue[];
  onClick: () => void;
}

const TableHealthCard: React.FC<TableHealthCardProps> = ({ tableName, issues, onClick }) => {
  const healthStatus = useMemo(() => {
    let status: HealthStatus = 'Healthy';
    const severities = issues.map(issue => issue.severity);

    if (severities.includes('High')) {
      status = 'Critical';
    } else if (severities.includes('Medium')) {
      status = 'Warning';
    }

    return status;
  }, [issues]);

  const sunburstData: SunburstData = useMemo(() => {
    const severityCounts = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, { High: 0, Medium: 0, Low: 0 } as Record<Issue['severity'], number>);

    return {
      name: `${issues.length} Issues`,
      children: [
        { name: 'High', value: severityCounts.High, color: '#e11d48' }, // rose-600
        { name: 'Medium', value: severityCounts.Medium, color: '#f59e0b' }, // amber-500
        { name: 'Low', value: severityCounts.Low, color: '#10b981' }, // emerald-500
      ].filter(d => d.value > 0),
    };
  }, [issues]);

  const statusStyles: Record<HealthStatus, { bg: string; text: string; border: string; }> = {
    Critical: {
      bg: 'bg-rose-50 dark:bg-severity-high/10',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-500 dark:border-rose-600',
    },
    Warning: {
      bg: 'bg-amber-50 dark:bg-severity-medium/10',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-500 dark:border-amber-600',
    },
    Healthy: {
      bg: 'bg-emerald-50 dark:bg-severity-low/10',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-500 dark:border-emerald-600',
    },
  };

  const currentStyle = statusStyles[healthStatus];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg shadow-sm border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${currentStyle.bg} ${currentStyle.border}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-lg text-slate-800 dark:text-white truncate" title={tableName}>
              {tableName}
            </h4>
            <div className={`hidden sm:block px-2.5 py-1 rounded-full text-xs font-semibold ${currentStyle.bg} ${currentStyle.text}`}>
              {healthStatus}
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {issues.length} total issue{issues.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex-shrink-0 w-20 h-20 -my-2 -mr-2">
          {issues.length > 0 ? (
            <SunburstChart data={sunburstData} width={80} height={80} />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default TableHealthCard;