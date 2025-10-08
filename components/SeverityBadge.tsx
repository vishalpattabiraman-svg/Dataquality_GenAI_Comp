import React from 'react';
import { Issue } from '../types';

interface SeverityBadgeProps {
  severity: Issue['severity'];
  count?: number;
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, count }) => {
  const severityClasses = {
    High: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    Low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
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