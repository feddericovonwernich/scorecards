# Phase 4: Stats Dashboard Migration

## Objective

Migrate the stat cards section from vanilla DOM updates (`document.getElementById()` + `textContent`) to React components connected to the Zustand store.

## Current State Analysis

### Stat Cards Update Logic

**File: `docs/src/app-init.ts`** - `updateServicesStats()` function (lines 24-78):

```typescript
function updateServicesStats(services: ServiceData[], checksHash: string | null): void {
  // Total services
  const totalEl = document.getElementById('total-services');
  if (totalEl) {
    totalEl.textContent = String(services.length);
  }

  // Average score
  const avgEl = document.getElementById('avg-score');
  if (avgEl && services.length > 0) {
    const avg = services.reduce((sum, s) => sum + s.score, 0) / services.length;
    avgEl.textContent = String(Math.round(avg));
  }

  // ... similar patterns for api-count, stale-count, installed-count, rank counts
}
```

**File: `docs/src/main.ts`** - `updateTeamsStats()` function (lines 313-376):

Similar patterns for teams view stat cards.

### HTML Stat Cards Structure

**File: `docs/index.html`** (lines 35-72):

```html
<section class="stats services-stats">
    <div class="stat-card non-filterable">
        <div class="stat-value" id="total-services">-</div>
        <div class="stat-label">Total Services</div>
    </div>
    <!-- ... more stat cards with filterable class and data-filter attribute -->
</section>
```

## Migration Steps

### Step 1: Create Stats Components

```typescript
// docs/src/components/features/StatsSection/StatsSection.tsx

import { useMemo } from 'react';
import { useAppStore, selectServicesAll, selectChecksHash } from '../../../stores/appStore';
import { isServiceStale } from '../../../services/staleness';
import { StatCard } from '../../ui/StatCard';
import styles from './StatsSection.module.css';

type FilterMode = 'include' | 'exclude' | null;

interface StatsSectionProps {
  onFilterChange?: (filter: string, mode: FilterMode) => void;
  activeFilters?: Map<string, FilterMode>;
}

export function ServicesStatsSection({ onFilterChange, activeFilters }: StatsSectionProps) {
  const services = useAppStore(selectServicesAll);
  const checksHash = useAppStore(selectChecksHash);

  const stats = useMemo(() => {
    const total = services.length;
    const avgScore = total > 0
      ? Math.round(services.reduce((sum, s) => sum + s.score, 0) / total)
      : 0;
    const withApi = services.filter(s => s.has_api).length;
    const stale = services.filter(s => isServiceStale(s, checksHash)).length;
    const installed = services.filter(s => s.installed).length;
    const platinum = services.filter(s => s.rank === 'platinum').length;
    const gold = services.filter(s => s.rank === 'gold').length;
    const silver = services.filter(s => s.rank === 'silver').length;
    const bronze = services.filter(s => s.rank === 'bronze').length;

    return { total, avgScore, withApi, stale, installed, platinum, gold, silver, bronze };
  }, [services, checksHash]);

  const handleFilterClick = (filter: string) => {
    if (!onFilterChange) return;

    const currentState = activeFilters?.get(filter) ?? null;
    let newState: FilterMode;

    if (currentState === null) {
      newState = 'include';
    } else if (currentState === 'include') {
      newState = 'exclude';
    } else {
      newState = null;
    }

    onFilterChange(filter, newState);
  };

  const getFilterState = (filter: string): 'active' | 'exclude' | null => {
    const state = activeFilters?.get(filter);
    if (state === 'include') return 'active';
    if (state === 'exclude') return 'exclude';
    return null;
  };

  return (
    <section className={`stats services-stats ${styles.statsSection}`}>
      <StatCard
        value={stats.total}
        label="Total Services"
        filterable={false}
      />
      <StatCard
        value={stats.avgScore}
        label="Average Score"
        filterable={false}
      />
      <StatCard
        value={stats.withApi}
        label="With API"
        filterable
        filterKey="has-api"
        filterState={getFilterState('has-api')}
        onClick={() => handleFilterClick('has-api')}
        className="filter-api"
      />
      <StatCard
        value={stats.stale}
        label="Stale"
        filterable
        filterKey="stale"
        filterState={getFilterState('stale')}
        onClick={() => handleFilterClick('stale')}
        className="filter-stale"
      />
      <StatCard
        value={stats.installed}
        label="Installed"
        filterable
        filterKey="installed"
        filterState={getFilterState('installed')}
        onClick={() => handleFilterClick('installed')}
        className="filter-installed"
      />
      <StatCard
        value={stats.platinum}
        label="Platinum"
        filterable
        filterKey="platinum"
        filterState={getFilterState('platinum')}
        onClick={() => handleFilterClick('platinum')}
        className="rank-platinum"
      />
      <StatCard
        value={stats.gold}
        label="Gold"
        filterable
        filterKey="gold"
        filterState={getFilterState('gold')}
        onClick={() => handleFilterClick('gold')}
        className="rank-gold"
      />
      <StatCard
        value={stats.silver}
        label="Silver"
        filterable
        filterKey="silver"
        filterState={getFilterState('silver')}
        onClick={() => handleFilterClick('silver')}
        className="rank-silver"
      />
      <StatCard
        value={stats.bronze}
        label="Bronze"
        filterable
        filterKey="bronze"
        filterState={getFilterState('bronze')}
        onClick={() => handleFilterClick('bronze')}
        className="rank-bronze"
      />
    </section>
  );
}
```

### Step 2: Update StatCard Component

Check if `docs/src/components/ui/StatCard.tsx` exists and update it:

```typescript
// docs/src/components/ui/StatCard.tsx

import { type MouseEvent } from 'react';
import styles from './StatCard.module.css';

type FilterState = 'active' | 'exclude' | null;

interface StatCardProps {
  value: number | string;
  label: string;
  filterable?: boolean;
  filterKey?: string;
  filterState?: FilterState;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  value,
  label,
  filterable = false,
  filterKey,
  filterState,
  onClick,
  className = '',
}: StatCardProps) {
  const handleClick = (e: MouseEvent) => {
    if (filterable && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const cardClasses = [
    'stat-card',
    filterable ? 'filterable' : 'non-filterable',
    filterState === 'active' ? 'active' : '',
    filterState === 'exclude' ? 'exclude' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      data-filter={filterKey}
      onClick={handleClick}
      role={filterable ? 'button' : undefined}
      tabIndex={filterable ? 0 : undefined}
      onKeyDown={filterable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
```

### Step 3: Create Teams Stats Section

```typescript
// docs/src/components/features/StatsSection/TeamsStatsSection.tsx

import { useMemo } from 'react';
import { useAppStore, selectTeamsAll, selectServicesAll } from '../../../stores/appStore';
import { getRank } from '../../../utils/team-statistics';
import { getTeamName } from '../../../utils/team-statistics';
import { StatCard } from '../../ui/StatCard';

type FilterMode = 'include' | 'exclude' | null;

interface TeamsStatsSectionProps {
  onFilterChange?: (filter: string, mode: FilterMode) => void;
  activeFilters?: Map<string, FilterMode>;
}

export function TeamsStatsSection({ onFilterChange, activeFilters }: TeamsStatsSectionProps) {
  const teams = useAppStore(selectTeamsAll);
  const services = useAppStore(selectServicesAll);

  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const avgScore = totalTeams > 0
      ? Math.round(teams.reduce((sum, t) => sum + (t.averageScore || 0), 0) / totalTeams)
      : 0;
    const totalServices = services.length;
    const noTeam = services.filter(s => !getTeamName(s)).length;

    let platinum = 0, gold = 0, silver = 0, bronze = 0;
    teams.forEach(team => {
      const rank = getRank(team);
      if (rank === 'platinum') platinum++;
      else if (rank === 'gold') gold++;
      else if (rank === 'silver') silver++;
      else if (rank === 'bronze') bronze++;
    });

    return { totalTeams, avgScore, totalServices, noTeam, platinum, gold, silver, bronze };
  }, [teams, services]);

  const handleFilterClick = (filter: string) => {
    if (!onFilterChange) return;
    const currentState = activeFilters?.get(filter) ?? null;
    let newState: FilterMode;
    if (currentState === null) newState = 'include';
    else if (currentState === 'include') newState = 'exclude';
    else newState = null;
    onFilterChange(filter, newState);
  };

  const getFilterState = (filter: string): 'active' | 'exclude' | null => {
    const state = activeFilters?.get(filter);
    if (state === 'include') return 'active';
    if (state === 'exclude') return 'exclude';
    return null;
  };

  return (
    <section className="stats teams-stats">
      <StatCard value={stats.totalTeams} label="Total Teams" filterable={false} />
      <StatCard value={stats.avgScore} label="Average Score" filterable={false} />
      <StatCard value={stats.totalServices} label="Total Services" filterable={false} />
      <StatCard value={stats.noTeam} label="No Team" filterable={false} />
      <StatCard
        value={stats.platinum}
        label="Platinum"
        filterable
        filterKey="platinum"
        filterState={getFilterState('platinum')}
        onClick={() => handleFilterClick('platinum')}
        className="rank-platinum"
      />
      <StatCard
        value={stats.gold}
        label="Gold"
        filterable
        filterKey="gold"
        filterState={getFilterState('gold')}
        onClick={() => handleFilterClick('gold')}
        className="rank-gold"
      />
      <StatCard
        value={stats.silver}
        label="Silver"
        filterable
        filterKey="silver"
        filterState={getFilterState('silver')}
        onClick={() => handleFilterClick('silver')}
        className="rank-silver"
      />
      <StatCard
        value={stats.bronze}
        label="Bronze"
        filterable
        filterKey="bronze"
        filterState={getFilterState('bronze')}
        onClick={() => handleFilterClick('bronze')}
        className="rank-bronze"
      />
    </section>
  );
}
```

### Step 4: Create Stats Portal in Main App

Update `docs/src/components/index.tsx` to render stats via portals:

```typescript
// Add to imports
import { ServicesStatsSection, TeamsStatsSection } from './features/StatsSection';

// Add portal target refs
let servicesStatsEl: HTMLElement | null = null;
let teamsStatsEl: HTMLElement | null = null;

// In initPortalTargets():
servicesStatsEl = document.querySelector('.services-stats');
teamsStatsEl = document.querySelector('.teams-stats');

// Set management flags
if (servicesStatsEl) {
  window.__REACT_MANAGES_SERVICES_STATS = true;
  servicesStatsEl.innerHTML = '';
}
if (teamsStatsEl) {
  window.__REACT_MANAGES_TEAMS_STATS = true;
  teamsStatsEl.innerHTML = '';
}

// In App component, add filter state handling
const activeFilters = useAppStore(state => state.filters.active);
const setFilter = useAppStore(state => state.setFilter);

const handleServiceFilterChange = useCallback((filter: string, mode: FilterMode) => {
  setFilter(filter, mode);
}, [setFilter]);

// In App return, add portals
{servicesStatsEl && createPortal(
  <ServicesStatsSection
    onFilterChange={handleServiceFilterChange}
    activeFilters={activeFilters}
  />,
  servicesStatsEl
)}

{teamsStatsEl && createPortal(
  <TeamsStatsSection
    onFilterChange={handleTeamsFilterChange}
    activeFilters={teamsActiveFilters}
  />,
  teamsStatsEl
)}
```

### Step 5: Update HTML Structure

Modify `docs/index.html` to have simpler mount points:

```html
<!-- Services Stats - React will populate -->
<section class="stats services-stats">
    <!-- React portal renders here -->
</section>

<!-- Teams Stats - React will populate -->
<section class="stats teams-stats">
    <!-- React portal renders here -->
</section>
```

### Step 6: Remove Vanilla Update Functions

Update `docs/src/app-init.ts`:

```typescript
// REMOVE the updateServicesStats function entirely
// Or comment out and mark deprecated:

/**
 * @deprecated Use ServicesStatsSection React component instead
 */
// function updateServicesStats(...) { ... }

// REMOVE the call in initializeApp():
// updateServicesStats(services, window.currentChecksHash);
```

Update `docs/src/main.ts`:

```typescript
// REMOVE the updateTeamsStats function entirely
// Or mark deprecated
```

## Verification Checklist

- [ ] Services stats display correct counts
- [ ] Teams stats display correct counts
- [ ] Clicking filterable stat cards toggles filter state
- [ ] Filter state cycles: null → include (active) → exclude → null
- [ ] Visual styling correct (active = highlighted, exclude = strikethrough/different)
- [ ] Stats update when services/teams data changes
- [ ] Stats update when filters change
- [ ] No flicker on initial load
- [ ] Keyboard accessibility works (Enter key activates filter)

## Files Modified

| File | Action |
|------|--------|
| `docs/src/components/features/StatsSection/StatsSection.tsx` | Create (new) |
| `docs/src/components/features/StatsSection/TeamsStatsSection.tsx` | Create (new) |
| `docs/src/components/features/StatsSection/index.ts` | Create (new) |
| `docs/src/components/ui/StatCard.tsx` | Update (if exists) or create |
| `docs/src/components/index.tsx` | Add stats portals |
| `docs/index.html` | Simplify stats sections |
| `docs/src/app-init.ts` | Remove updateServicesStats |
| `docs/src/main.ts` | Remove updateTeamsStats |

## Rollback Instructions

If issues arise:
1. Restore HTML: `git checkout HEAD -- docs/index.html`
2. Restore app-init: `git checkout HEAD -- docs/src/app-init.ts`
3. Restore main: `git checkout HEAD -- docs/src/main.ts`
4. Remove portals from index.tsx
5. Delete new component files

## Notes for Executing Model

- **Requires Phase 2** (global state migration) to be complete
- The existing StatCard component may need updates - check its current interface
- Stats should reactively update when store changes - use Zustand selectors
- Use `useMemo` for computed stats to avoid unnecessary recalculations
- Keep CSS classes for compatibility with existing styles
- Test filter cycling: click once (include), twice (exclude), three times (clear)
