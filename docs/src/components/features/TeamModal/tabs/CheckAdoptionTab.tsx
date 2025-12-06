/**
 * Check Adoption Tab Component
 * Displays check adoption rates for a team
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ServiceData, RankName, CheckMetadata } from '../../../../types/index.js';
import { cn } from '../../../../utils/css.js';

interface CheckAdoptionTabProps {
  teamServices: ServiceData[];
  teamName?: string;
}

interface AdoptionStats {
  passing: number;
  failing: number;
  excluded?: number;
  total: number;
  activeTotal?: number;
  percentage: number;
  services: Array<{
    org: string;
    repo: string;
    name: string;
    score: number;
    rank: RankName;
    checkStatus?: 'pass' | 'fail' | 'excluded';
    exclusionReason?: string;
  }>;
}

/**
 * Check Adoption Tab Component
 */
export function CheckAdoptionTab({
  teamServices,
  teamName: _teamName,
}: CheckAdoptionTabProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [checks, setChecks] = useState<CheckMetadata[]>([]);
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) {return;}

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Load checks metadata
  useEffect(() => {
    const loadChecks = async () => {
      setLoading(true);
      try {
        const { loadChecks: loadChecksApi } = await import(
          '../../../../api/checks.js'
        );
        const checksData = await loadChecksApi();
        setChecks(checksData.checks || []);
        if (checksData.checks?.length > 0 && !selectedCheckId) {
          setSelectedCheckId(checksData.checks[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load check data'
        );
      } finally {
        setLoading(false);
      }
    };

    loadChecks();
  }, [selectedCheckId]);

  // Calculate adoption stats for selected check
  const stats = useMemo((): AdoptionStats | null => {
    if (!selectedCheckId || teamServices.length === 0) {
      return null;
    }

    const services = teamServices.map((s) => {
      const checkResult = s.check_results?.[selectedCheckId];
      const excluded = s.excluded_checks?.find(
        (e) => e.check === selectedCheckId
      );

      return {
        org: s.org,
        repo: s.repo,
        name: s.name,
        score: s.score,
        rank: s.rank,
        checkStatus: excluded
          ? ('excluded' as const)
          : checkResult === 'pass'
            ? ('pass' as const)
            : ('fail' as const),
        exclusionReason: excluded?.reason,
      };
    });

    const passing = services.filter((s) => s.checkStatus === 'pass').length;
    const failing = services.filter((s) => s.checkStatus === 'fail').length;
    const excluded = services.filter((s) => s.checkStatus === 'excluded').length;
    const activeTotal = passing + failing;
    const percentage =
      activeTotal > 0 ? Math.round((passing / activeTotal) * 100) : 0;

    return {
      passing,
      failing,
      excluded,
      total: services.length,
      activeTotal,
      percentage,
      services,
    };
  }, [selectedCheckId, teamServices]);

  // Handle check selection
  const handleSelectCheck = useCallback((checkId: string) => {
    setSelectedCheckId(checkId);
    setDropdownOpen(false);
  }, []);

  // Handle service click
  const handleServiceClick = useCallback((org: string, repo: string) => {
    window.showServiceDetail?.(org, repo);
  }, []);

  // Filter checks by search
  const filteredChecks = useMemo(() => {
    if (!searchQuery) {return checks;}
    const query = searchQuery.toLowerCase();
    return checks.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [checks, searchQuery]);

  // Selected check info
  const selectedCheck = checks.find((c) => c.id === selectedCheckId);

  if (loading) {
    return (
      <div className="tab-panel" id="team-tab-adoption">
        <div className="check-adoption-loading">
          <span className="loading-spinner" /> Loading check data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-panel" id="team-tab-adoption">
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className="tab-panel" id="team-tab-adoption">
        <div className="empty-state">No check metadata available</div>
      </div>
    );
  }

  const passingServices =
    stats?.services.filter((s) => s.checkStatus === 'pass') || [];
  const failingServices =
    stats?.services.filter((s) => s.checkStatus === 'fail') || [];
  const excludedServices =
    stats?.services.filter((s) => s.checkStatus === 'excluded') || [];

  return (
    <div className="tab-panel" id="team-tab-adoption">
      <div className="check-adoption-content">
        {/* Check Card Selector */}
        <div className="check-card-selector" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn('check-card-selected', dropdownOpen && 'open')}
          >
            {selectedCheck ? (
              <>
                <div className="check-card-header">
                  <span className="check-card-name">{selectedCheck.name}</span>
                  <span className="check-card-category">{selectedCheck.category}</span>
                  <svg
                    className="check-card-chevron"
                    width="20"
                    height="20"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z" />
                  </svg>
                </div>
                <p className="check-card-description">{selectedCheck.description}</p>
              </>
            ) : (
              <span className="check-card-placeholder">Select a check to view adoption...</span>
            )}
          </button>

          {/* Dropdown with card options */}
          <div className={cn('check-card-dropdown', dropdownOpen && 'open')}>
            <div className="check-card-search">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search checks..."
                autoFocus={dropdownOpen}
              />
            </div>
            <div className="check-card-options">
              {filteredChecks.map((check) => (
                <button
                  key={check.id}
                  onClick={() => handleSelectCheck(check.id)}
                  className={cn('check-card-option', check.id === selectedCheckId && 'selected')}
                >
                  <div className="check-card-option-header">
                    <span className="check-card-name">{check.name}</span>
                    <span className="check-card-category">{check.category}</span>
                  </div>
                  <p className="check-card-option-desc">
                    {check.description?.slice(0, 100)}{check.description && check.description.length > 100 ? '...' : ''}
                  </p>
                </button>
              ))}
              {filteredChecks.length === 0 && (
                <div className="check-card-empty">No checks found</div>
              )}
            </div>
          </div>
        </div>

        {/* Adoption progress */}
        {stats && (
          <div className="adoption-progress">
            <div className="progress-header">
              <span className="progress-label">Adoption Rate</span>
              <span className="progress-value">
                {stats.percentage}% ({stats.passing}/{stats.activeTotal} active)
                {excludedServices.length > 0 && (
                  <span className="excluded-note">
                    {excludedServices.length} excluded
                  </span>
                )}
              </span>
            </div>
            <div className="progress-bar-large">
              <div
                className={`progress-fill ${stats.percentage >= 80 ? 'high' : stats.percentage >= 50 ? 'medium' : 'low'}`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Service lists */}
        <div
          className={`adoption-lists ${excludedServices.length > 0 ? 'three-columns' : ''}`}
        >
          <div className="adoption-column passing">
            <h4>Passing ({passingServices.length})</h4>
            <div className="adoption-service-list">
              {passingServices.length === 0 ? (
                <div className="empty-list">No passing services</div>
              ) : (
                passingServices.map((s) => (
                  <div
                    key={`${s.org}/${s.repo}`}
                    className="adoption-service-item passing"
                    onClick={() => handleServiceClick(s.org, s.repo)}
                  >
                    <span className="service-name">{s.name}</span>
                    <span className={`service-score rank-${s.rank}`}>
                      {Math.round(s.score)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="adoption-column failing">
            <h4>Failing ({failingServices.length})</h4>
            <div className="adoption-service-list">
              {failingServices.length === 0 ? (
                <div className="empty-list">No failing services</div>
              ) : (
                failingServices.map((s) => (
                  <div
                    key={`${s.org}/${s.repo}`}
                    className="adoption-service-item failing"
                    onClick={() => handleServiceClick(s.org, s.repo)}
                  >
                    <span className="service-name">{s.name}</span>
                    <span className={`service-score rank-${s.rank}`}>
                      {Math.round(s.score)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {excludedServices.length > 0 && (
            <div className="adoption-column excluded">
              <h4>Excluded ({excludedServices.length})</h4>
              <div className="adoption-service-list excluded-list">
                {excludedServices.map((s) => (
                  <div
                    key={`${s.org}/${s.repo}`}
                    className="adoption-service-item excluded"
                    onClick={() => handleServiceClick(s.org, s.repo)}
                  >
                    <span className="service-name">{s.name}</span>
                    <span
                      className="exclusion-reason"
                      title={s.exclusionReason || 'Excluded'}
                    >
                      {s.exclusionReason || 'Excluded'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckAdoptionTab;
