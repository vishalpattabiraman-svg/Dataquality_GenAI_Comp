import React from 'react';
import { Issue } from '../types';

type HealthStatus = 'Critical' | 'Warning' | 'Healthy';

interface TableHealthCardProps {
  tableName: string;
  issues: Issue[];
  onClick: () => void;
}

const TableHealthCard: React.FC<TableHealthCardProps> = ({ tableName, issues, onClick }) => {
  const healthStatus = React.useMemo(() => {
    let status: HealthStatus = 'Healthy';
    const severities = issues.map(issue => issue.severity);

    if (severities.includes('High')) {
      status = 'Critical';
    } else if (severities.includes('Medium')) {
      status = 'Warning';
    }

    return status;
  }, [issues]);

  const statusStyles: Record<HealthStatus, { bg: string; text: string; border: string; }> = {
    Critical: {
      bg: 'bg-red-50 dark:bg-severity-high/10',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-500 dark:border-red-600',
    },
    Warning: {
      bg: 'bg-orange-50 dark:bg-severity-medium/10',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-500 dark:border-orange-600',
    },
    Healthy: {
      bg: 'bg-green-50 dark:bg-severity-low/10',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-500 dark:border-green-600',
    },
  };

  const currentStyle = statusStyles[healthStatus];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg shadow-sm border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${currentStyle.bg} ${currentStyle.border}`}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-lg text-gray-800 dark:text-white truncate pr-2" title={tableName}>
          {tableName}
        </h4>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${currentStyle.bg} ${currentStyle.text}`}>
          {healthStatus}
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {issues.length} total issue{issues.length !== 1 ? 's' : ''} found
      </p>
    </button>
  );
};

export default TableHealthCard;