/**
 * Check Filter Modal Component
 * Modal for filtering services by check status
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../ui/Modal.js';
import type {
  CheckMetadata,
  ServiceData,
  CheckFilter,
} from '../../../types/index.js';

export interface CheckFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Map<string, CheckFilter>;
  onFiltersChange: (filters: Map<string, CheckFilter>) => void;
  services: ServiceData[];
}

interface AdoptionStats {
  passing: number;
  failing: number;
  excluded: number;
  total: number;
  percentage: number;
}

// Category display order
const CATEGORY_ORDER = [
  'Scorecards Setup',
  'Documentation',
  'Testing & CI',
  'Configuration & Compliance',
  'Other',
];

/**
 * Calculate adoption stats for a single check
 */
function calculateCheckAdoption(
  services: ServiceData[],
  checkId: string
): AdoptionStats {
  let passing = 0;
  let failing = 0;
  let excluded = 0;

  services.forEach((service) => {
    const result = service.check_results?.[checkId];
    const isExcluded = service.excluded_checks?.some((e) => e.check === checkId);

    if (isExcluded) {
      excluded++;
    } else if (result === 'pass') {
      passing++;
    } else {
      failing++;
    }
  });

  const activeTotal = passing + failing;
  const percentage = activeTotal > 0 ? Math.round((passing / activeTotal) * 100) : 0;

  return {
    passing,
    failing,
    excluded,
    total: services.length,
    percentage,
  };
}

/**
 * Check option card component
 */
function CheckOptionCard({
  check,
  stats,
  currentState,
  onStateChange,
  visible,
}: {
  check: CheckMetadata;
  stats: AdoptionStats;
  currentState: CheckFilter;
  onStateChange: (checkId: string, state: CheckFilter) => void;
  visible: boolean;
}) {
  // Progress bar class
  let progressClass = 'low';
  if (stats.percentage >= 75) {progressClass = 'high';}
  else if (stats.percentage >= 40) {progressClass = 'medium';}

  if (!visible) {return null;}

  return (
    <div className="check-option-card" data-check-id={check.id}>
      <div className="check-option-info">
        <div className="check-option-name">{check.name}</div>
        {check.description && (
          <div className="check-option-description">{check.description}</div>
        )}
        <div className="check-option-stats">
          <span className="check-option-stat passing">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
            </svg>
            <span className="check-option-stat-value">{stats.passing}</span>{' '}
            passing
          </span>
          <span className="check-option-stat failing">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
            <span className="check-option-stat-value">{stats.failing}</span>{' '}
            failing
          </span>
          {stats.excluded > 0 && (
            <span className="check-option-stat excluded">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="3"
                  y1="13"
                  x2="13"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="check-option-stat-value">{stats.excluded}</span>{' '}
              excluded
            </span>
          )}
          <span className="check-option-progress">
            <span className="check-option-progress-bar">
              <span
                className={`check-option-progress-fill ${progressClass}`}
                style={{ width: `${stats.percentage}%` }}
              />
            </span>
            <span className="check-option-progress-text">{stats.percentage}%</span>
          </span>
        </div>
      </div>
      <div className="check-state-toggle">
        <button
          className={`state-btn state-any ${currentState === null ? 'active' : ''}`}
          onClick={() => onStateChange(check.id, null)}
          title="Any status"
        >
          Any
        </button>
        <button
          className={`state-btn state-pass ${currentState === 'pass' ? 'active' : ''}`}
          onClick={() => onStateChange(check.id, 'pass')}
          title="Must pass"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
          </svg>
        </button>
        <button
          className={`state-btn state-fail ${currentState === 'fail' ? 'active' : ''}`}
          onClick={() => onStateChange(check.id, 'fail')}
          title="Must fail"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Check category section component
 */
function CheckCategorySection({
  category,
  checks,
  filters,
  services,
  searchQuery,
  onStateChange,
  collapsed,
  onToggle,
}: {
  category: string;
  checks: CheckMetadata[];
  filters: Map<string, CheckFilter>;
  services: ServiceData[];
  searchQuery: string;
  onStateChange: (checkId: string, state: CheckFilter) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  // Calculate category stats
  let categoryPassing = 0;
  let categoryTotal = 0;
  const checkStats = new Map<string, AdoptionStats>();

  checks.forEach((check) => {
    const stats = calculateCheckAdoption(services, check.id);
    checkStats.set(check.id, stats);
    categoryPassing += stats.passing;
    categoryTotal += stats.total;
  });

  const categoryAvg =
    categoryTotal > 0 ? Math.round((categoryPassing / categoryTotal) * 100) : 0;

  // Filter by search
  const query = searchQuery.toLowerCase();
  const visibleChecks = checks.filter((check) => {
    if (!searchQuery) {return true;}
    return (
      check.name.toLowerCase().includes(query) ||
      check.id.toLowerCase().includes(query) ||
      check.description?.toLowerCase().includes(query)
    );
  });

  if (visibleChecks.length === 0) {return null;}

  const categoryId = category.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      className={`check-category-section ${collapsed ? 'collapsed' : ''}`}
      data-category={categoryId}
    >
      <div className="check-category-header" onClick={onToggle}>
        <div className="check-category-header-left">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
          <span className="check-category-header-title">{category}</span>
          <span className="check-category-header-count">({checks.length})</span>
        </div>
        {services.length > 0 && (
          <span className="check-category-header-stats">
            {categoryAvg}% avg adoption
          </span>
        )}
      </div>
      <div className="check-category-content" id={`check-category-${categoryId}`}>
        {visibleChecks.map((check) => (
          <CheckOptionCard
            key={check.id}
            check={check}
            stats={checkStats.get(check.id)!}
            currentState={filters.get(check.id) || null}
            onStateChange={onStateChange}
            visible={true}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Check Filter Modal Component
 */
export function CheckFilterModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  services,
}: CheckFilterModalProps) {
  const [checks, setChecks] = useState<CheckMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  // Load checks metadata
  useEffect(() => {
    if (!isOpen) {return;}

    const loadChecksData = async () => {
      setLoading(true);
      try {
        const { loadChecks } = await import('../../../api/checks.js');
        const checksData = await loadChecks();
        setChecks(checksData.checks || []);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    loadChecksData();
  }, [isOpen]);

  // Group checks by category
  const checksByCategory = useMemo(() => {
    const grouped: Record<string, CheckMetadata[]> = {};

    checks.forEach((check) => {
      const category = check.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(check);
    });

    // Return in defined order
    const ordered: Record<string, CheckMetadata[]> = {};
    CATEGORY_ORDER.forEach((category) => {
      const matchingKey = Object.keys(grouped).find(
        (key) => key.toLowerCase() === category.toLowerCase()
      );
      if (matchingKey) {
        ordered[category] = grouped[matchingKey];
      }
    });

    return ordered;
  }, [checks]);

  // Handle filter state change
  const handleStateChange = useCallback(
    (checkId: string, state: CheckFilter) => {
      const newFilters = new Map(filters);
      if (state === null) {
        newFilters.delete(checkId);
      } else {
        newFilters.set(checkId, state);
      }
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onFiltersChange(new Map());
  }, [onFiltersChange]);

  // Toggle category collapse
  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const activeCount = filters.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="check-filter-modal-wrapper"
      contentClassName="check-filter-modal-content"
      showCloseButton={false}
      testId="check-filter-modal"
    >
      <div className="check-filter-modal-header">
        <h2>Filter by Check</h2>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
      </div>
      <div className="check-filter-modal-body">
        {loading ? (
          <div className="loading">Loading checks...</div>
        ) : (
          <div id="check-filter-modal-content">
            {/* Search and summary */}
            <div className="check-filter-search-section">
              <input
                type="text"
                id="check-filter-search"
                placeholder="Search checks by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {activeCount > 0 && (
                <div className="check-filter-summary">
                  <span className="check-filter-summary-count">
                    <strong>{activeCount}</strong> filter
                    {activeCount !== 1 ? 's' : ''} active
                  </span>
                  <button className="check-clear-btn" onClick={handleClearAll}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Categories */}
            <div id="check-filter-categories">
              {Object.keys(checksByCategory).length === 0 ? (
                <div className="check-filter-empty">No checks available</div>
              ) : (
                Object.entries(checksByCategory).map(([category, categoryChecks]) => (
                  <CheckCategorySection
                    key={category}
                    category={category}
                    checks={categoryChecks}
                    filters={filters}
                    services={services}
                    searchQuery={searchQuery}
                    onStateChange={handleStateChange}
                    collapsed={collapsedCategories.has(category)}
                    onToggle={() => toggleCategory(category)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default CheckFilterModal;
