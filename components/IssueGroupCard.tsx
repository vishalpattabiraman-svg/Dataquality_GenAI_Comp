import React from 'react';
import { Issue } from '../types';
import { AlertIcon } from './Icons';
import SeverityBadge from './SeverityBadge';

interface IssueGroupCardProps {
  issueType: string;
  issues: Issue[];
  onClick: () => void;
}

const SeverityCount: React.FC<{ severity: Issue['severity'], count: number }> = ({ severity, count }) => {
    const styles = {
        High: 'text-rose-600 dark:text-rose-400',
        Medium: 'text-amber-600 dark:text-amber-400',
        Low: 'text-emerald-600 dark:text-emerald-400',
    };
    if (count === 0) return null;
    return (
        <div className={`text-xs font-semibold ${styles[severity]}`}>
            {count} {severity}
        </div>
    );
};

const IssueGroupCard: React.FC<IssueGroupCardProps> = ({ issueType, issues, onClick }) => {
  const { severityCounts, affectedTablesCount } = React.useMemo(() => {
    const counts: Record<Issue['severity'], number> = { High: 0, Medium: 0, Low: 0 };
    const uniqueTables = new Set(issues.map(i => i.table_name));

    issues.forEach(issue => {
        counts[issue.severity]++;
    });

    return { severityCounts: counts, affectedTablesCount: uniqueTables.size };
  }, [issues]);

  const borderStyle = severityCounts.High > 0 ? 'border-rose-500 dark:border-rose-600'
                   : severityCounts.Medium > 0 ? 'border-amber-500 dark:border-amber-600'
                   : 'border-emerald-500 dark:border-emerald-600';


  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg shadow-sm border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-slate-900 bg-white dark:bg-slate-800/50 ${borderStyle}`}
    >
      <div className="flex justify-between items-start gap-2">
         <div className="flex items-start gap-3 min-w-0">
            <AlertIcon className="h-6 w-6 text-brand-secondary mt-1 flex-shrink-0" />
            <div className="min-w-0">
                 <h4 className="font-bold text-base text-slate-800 dark:text-white whitespace-normal break-words" title={issueType}>
                    {issueType}
                </h4>
            </div>
         </div>
         <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <SeverityCount severity="High" count={severityCounts.High} />
            <SeverityCount severity="Medium" count={severityCounts.Medium} />
            <SeverityCount severity="Low" count={severityCounts.Low} />
        </div>
      </div>
      <div className="mt-2 pl-9">
         <p className="text-sm text-slate-500 dark:text-slate-400">
          Across <span className="font-semibold text-slate-700 dark:text-slate-200">{affectedTablesCount}</span> table{affectedTablesCount !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  );
};

export default IssueGroupCard;