import React, { useMemo, lazy, Suspense } from 'react';
import { Issue } from '../types';
import IssueGroupCard from './IssueGroupCard';
import TableHealthCard from './TableHealthCard';
import { getShortTableName } from './ResultsDisplay';

const BusinessRulesViolations = lazy(() => import('./BusinessRulesViolations'));

interface DashboardViewProps {
    issues: Issue[];
    onIssueTypeSelect: (issueType: string) => void;
    onTableSelect: (tableName: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ issues, onIssueTypeSelect, onTableSelect }) => {
    
    const { businessRuleIssues, hotspotIssues, issuesByTable } = useMemo(() => {
        const businessRuleIssues: Issue[] = [];
        const hotspotIssues: Issue[] = [];
        const issuesByTable: Record<string, Issue[]> = {};

        issues.forEach(issue => {
            if (issue.type === 'Business Rule Violation') {
                businessRuleIssues.push(issue);
            } else {
                hotspotIssues.push(issue);
            }
            
            const tableName = issue.table_name || 'General';
            if (!issuesByTable[tableName]) {
                issuesByTable[tableName] = [];
            }
            issuesByTable[tableName].push(issue);
        });

        return { businessRuleIssues, hotspotIssues, issuesByTable };
    }, [issues]);

    const issuesByType = useMemo(() => {
        return hotspotIssues.reduce((acc, issue) => {
            const type = issue.type || 'Uncategorized';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(issue);
            return acc;
        }, {} as Record<string, Issue[]>);
    }, [hotspotIssues]);

    const sortedIssueTypes = Object.keys(issuesByType).sort((a, b) => {
        const getHighestSeverity = (issueType: string) => {
            const severities = issuesByType[issueType].map(i => i.severity);
            if (severities.includes('High')) return 0;
            if (severities.includes('Medium')) return 1;
            return 2;
        };
        const severityDiff = getHighestSeverity(a) - getHighestSeverity(b);
        if (severityDiff !== 0) return severityDiff;
        return issuesByType[b].length - issuesByType[a].length;
    });

    const sortedTableNames = Object.keys(issuesByTable).sort((a,b) => a.localeCompare(b));

    return (
        <div className="w-full space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Table Health Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedTableNames.map(tableName => (
                        <TableHealthCard
                            key={tableName}
                            tableName={getShortTableName(tableName)}
                            issues={issuesByTable[tableName]}
                            onClick={() => onTableSelect(tableName)}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Issue Hotspots</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                     {sortedIssueTypes.map(issueType => {
                        const groupIssues = issuesByType[issueType];
                        return (
                            <IssueGroupCard
                                key={issueType}
                                issueType={issueType}
                                issues={groupIssues}
                                onClick={() => onIssueTypeSelect(issueType)}
                            />
                        );
                    })}
                </div>
            </div>
            
            {businessRuleIssues.length > 0 && (
                <Suspense fallback={<div className="text-center py-10">Loading Business Rules...</div>}>
                    <BusinessRulesViolations issues={businessRuleIssues} />
                </Suspense>
            )}
        </div>
    );
};

export default DashboardView;