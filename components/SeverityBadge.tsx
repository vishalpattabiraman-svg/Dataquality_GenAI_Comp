import React from 'react';
import { Issue } from '../types';

interface SeverityBadgeProps {
  severity: Issue['severity'];
  count?: number;
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, count }) => {
  const severityClasses = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityClasses[severity]}`}
    >
      {count !== undefined && <span className="mr-1.5 font-bold">{count}</span>}
      {severity}
    </span>
  );
};

export default SeverityBadge;
