import React, { useState } from 'react';
import { Issue } from '../types';
import SeverityBadge from './SeverityBadge';
import { BulbIcon, ImpactIcon, WrenchIcon, ChevronDownIcon } from './Icons';

interface IssueCardProps {
  issue: Issue;
  isInitiallyExpanded?: boolean;
}

const InfoSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="pt-3">
        <h4 className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {icon}
            <span className="ml-2">{title}</span>
        </h4>
        <p className="text-sm text-slate-800 dark:text-slate-400 ml-6">{children}</p>
    </div>
);

const IssueCard: React.FC<IssueCardProps> = ({ issue, isInitiallyExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const severityStyles = {
    High: 'border-l-4 border-severity-high',
    Medium: 'border-l-4 border-severity-medium',
    Low: 'border-l-4 border-severity-low',
  };

  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-shadow duration-300 hover:shadow-md ${severityStyles[issue.severity]}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50 rounded-lg"
        aria-expanded={isExpanded}
      >
        <div className="flex justify-between items-start">
          <div className="flex-grow pr-4">
            <h3 className="text-md font-bold text-brand-primary dark:text-brand-secondary">{issue.type}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{issue.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-2 flex-shrink-0">
            <SeverityBadge severity={issue.severity} />
            <ChevronDownIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/50">
          <div className="space-y-1">
              <InfoSection icon={<BulbIcon className="h-4 w-4 text-amber-500" />} title="Possible Cause">
                  {issue.possible_cause}
              </InfoSection>
              <InfoSection icon={<ImpactIcon className="h-4 w-4 text-rose-500" />} title="Potential Impact">
                  {issue.impact}
              </InfoSection>
              <InfoSection icon={<WrenchIcon className="h-4 w-4 text-emerald-500" />} title="Recommendation">
                  {issue.recommendation}
              </InfoSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;