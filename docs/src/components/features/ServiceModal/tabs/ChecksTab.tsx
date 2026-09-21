/**
 * Checks Tab Component
 * Displays check results grouped by category
 */

import { useEffect, useMemo, useRef } from 'react';
import { ActionButton } from '../../../ui/ActionButton/index.js';
import { useButtonState } from '../../../../hooks/useButtonState.js';
import { hasToken } from '../../../../services/auth.js';
import { getRepoName, getRepoOwner } from '../../../../api/registry.js';
import type {
  CheckResult,
  CheckStatus,
  DispatchReceipt,
  EvaluationSource,
} from '../../../../types/index.js';

interface ChecksTabProps {
  checks: CheckResult[];
  org: string;
  repo: string;
  evaluation?: EvaluationSource;
  onRemediate: (check: CheckResult) => Promise<DispatchReceipt>;
  onSettingsRequired: () => void;
}

const CATEGORY_ORDER = [
  'Scorecards Setup',
  'Documentation',
  'Testing & CI',
  'Configuration & Compliance',
  'Other',
];

function getStatusIcon(status: CheckStatus): string {
  switch (status) {
  case 'pass':
    return '\u2713';
  case 'excluded':
    return '\u2298';
  default:
    return '\u2717';
  }
}

function groupChecksByCategory(checks: CheckResult[]): Record<string, CheckResult[]> {
  const categories: Record<string, CheckResult[]> = {};
  checks.forEach((check) => {
    const category = check.category || 'Other';
    (categories[category] ||= []).push(check);
  });
  const ordered: Record<string, CheckResult[]> = {};
  CATEGORY_ORDER.forEach((category) => {
    const matchingKey = Object.keys(categories).find(
      (key) => key.toLowerCase() === category.toLowerCase()
    );
    if (matchingKey) {ordered[category] = categories[matchingKey];}
  });
  return ordered;
}

interface CheckItemProps {
  check: CheckResult;
  org: string;
  repo: string;
  evaluation?: EvaluationSource;
  onRemediate: (check: CheckResult) => Promise<DispatchReceipt>;
  onSettingsRequired: () => void;
}

function CheckItem({
  check,
  org,
  repo,
  evaluation,
  onRemediate,
  onSettingsRequired,
}: CheckItemProps) {
  const button = useButtonState();
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const isExcluded = check.status === 'excluded';
  const canRemediate = check.status === 'fail'
    && check.remediation?.version === 1
    && typeof check.remediation.label === 'string'
    && check.remediation.label.length > 0
    && evaluation !== undefined
    && typeof evaluation.service_repository === 'string'
    && evaluation.service_repository.toLowerCase() === `${org}/${repo}`.toLowerCase()
    && typeof evaluation.suite_repository === 'string'
    && evaluation.suite_repository.toLowerCase() === `${getRepoOwner()}/${getRepoName()}`.toLowerCase()
    && /^[a-f\d]{40}$/i.test(evaluation.service_sha)
    && /^[a-f\d]{40}$/i.test(evaluation.suite_sha);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const handleRemediation = async () => {
    if (inFlight.current) {return;}
    if (!hasToken()) {
      onSettingsRequired();
      return;
    }
    inFlight.current = true;
    button.setLoading();
    try {
      const receipt = await onRemediate(check);
      if (mounted.current) {
        if (receipt.accepted) {
          button.setSuccess();
        } else {
          button.setError();
        }
      }
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <div className={`check-result ${check.status}`}>
      <div className="check-name">
        {getStatusIcon(check.status)} {check.name}
      </div>
      {check.description && <div className="check-description">{check.description}</div>}
      {isExcluded && (
        <div className="check-excluded-notice"><em>Excluded from scoring</em></div>
      )}
      {check.stdout && check.stdout.trim() && (
        <div className="check-output"><strong>Output:</strong><br />{check.stdout.trim()}</div>
      )}
      {check.stderr && check.stderr.trim() && check.status === 'fail' && (
        <div className="check-output check-output-error"><strong>Error:</strong><br />{check.stderr.trim()}</div>
      )}
      <div className="check-meta">Weight: {check.weight} | Duration: {check.duration}s</div>
      {canRemediate && check.remediation && (
        <ActionButton
          state={button.state}
          onClick={handleRemediation}
          loadingText="Requesting..."
          successText="Requested"
          errorText="Request failed"
          title={`Request remediation for ${org}/${repo}`}
          variant="accent"
        >
          {check.remediation.label}
        </ActionButton>
      )}
    </div>
  );
}

function CheckCategory({
  category,
  checks,
  org,
  repo,
  evaluation,
  onRemediate,
  onSettingsRequired,
}: {
  category: string;
  checks: CheckResult[];
  org: string;
  repo: string;
  evaluation?: EvaluationSource;
  onRemediate: (check: CheckResult) => Promise<DispatchReceipt>;
  onSettingsRequired: () => void;
}) {
  const passCount = checks.filter((check) => check.status === 'pass').length;
  const excludedCount = checks.filter((check) => check.status === 'excluded').length;
  const activeCount = checks.length - excludedCount;
  const allPassed = passCount === activeCount && activeCount > 0;

  return (
    <details className="check-category" open>
      <summary className="check-category-header">
        <span className="category-arrow">{'\u25BC'}</span>
        <span className="category-name">{category}</span>
        <span className={`category-stats ${allPassed ? 'all-passed' : 'has-failures'}`}>
          {passCount}/{activeCount} passed
          {excludedCount > 0 && <span className="excluded-count"> ({excludedCount} excluded)</span>}
        </span>
      </summary>
      <div className="check-category-content">
        {checks.map((check) => (
          <CheckItem
            key={check.check_id}
            check={check}
            org={org}
            repo={repo}
            evaluation={evaluation}
            onRemediate={onRemediate}
            onSettingsRequired={onSettingsRequired}
          />
        ))}
      </div>
    </details>
  );
}

export function ChecksTab({
  checks,
  org,
  repo,
  evaluation,
  onRemediate,
  onSettingsRequired,
}: ChecksTabProps) {
  const categorizedChecks = useMemo(() => groupChecksByCategory(checks), [checks]);
  if (checks.length === 0) {
    return <div className="tab-panel" id="checks-tab"><div className="empty-state">No check results available</div></div>;
  }
  return (
    <div className="tab-panel" id="checks-tab">
      <div className="check-categories">
        {Object.entries(categorizedChecks).map(([category, categoryChecks]) => (
          <CheckCategory
            key={category}
            category={category}
            checks={categoryChecks}
            org={org}
            repo={repo}
            evaluation={evaluation}
            onRemediate={onRemediate}
            onSettingsRequired={onSettingsRequired}
          />
        ))}
      </div>
    </div>
  );
}

export default ChecksTab;
