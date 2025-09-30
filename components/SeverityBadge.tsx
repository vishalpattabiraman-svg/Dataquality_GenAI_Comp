import React from 'react';
import { Issue } from '../types';

interface SeverityBadgeProps {
  severity: Issue['severity'];
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const severityClasses = {
    High: 'bg-red-100 text-red-800 dark:bg-severity-high/20 dark:text-red-300',
    Medium: 'bg-orange-100 text-orange-800 dark:bg-severity-medium/20 dark:text-orange-300',
    Low: 'bg-green-100 text-green-800 dark:bg-severity-low/20 dark:text-green-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityClasses[severity]}`}
    >
      {severity}
    </span>
  );
};

export default SeverityBadge;
