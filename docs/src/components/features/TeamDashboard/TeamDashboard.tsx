/**
 * TeamDashboard Component
 * Modal displaying team statistics and allowing filtering by team
 * Replaces vanilla JS ui/team-dashboard.ts
 */

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../ui/Modal.js';
import { MiniRankBadge } from '../../ui/Badge.js';
import {
  useAppStore,
  selectServicesAll,
  selectChecksHash,
} from '../../../stores/appStore.js';
import {
  calculateTeamStats,
  sortTeamStats,
  mergeTeamDataWithStats,
  type TeamSortBy,
  type SortDirection,
  type MergedTeamData,
} from '../../../utils/team-statistics.js';
import { loadTeams } from '../../../api/registry.js';
import { isServiceStale } from '../../../services/staleness.js';
import type { RankName, TeamsData, ServiceData } from '../../../types/index.js';

interface TeamDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam?: () => void;
  onEditTeam?: (teamId: string) => void;
}

type SortOption = `${TeamSortBy}-${SortDirection}`;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'serviceCount-desc', label: 'Services: High to Low' },
  { value: 'serviceCount-asc', label: 'Services: Low to High' },
  { value: 'averageScore-desc', label: 'Score: High to Low' },
  { value: 'averageScore-asc', label: 'Score: Low to High' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

export function TeamDashboard({ isOpen, onClose, onCreateTeam: _onCreateTeam, onEditTeam: _onEditTeam }: TeamDashboardProps) {
  const services = useAppStore(selectServicesAll);
  const checksHash = useAppStore(selectChecksHash);
  const updateFilters = useAppStore((state) => state.updateFilters);
  const openModal = useAppStore((state) => state.openModal);

  const [teamsData, setTeamsData] = useState<TeamsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('serviceCount-desc');
  const [loading, setLoading] = useState(false);

  // Load teams data when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { teams } = await loadTeams();
        if (!cancelled) {
          setTeamsData(teams);
        }
      } catch (err) {
        console.error('Failed to load teams:', err);
        if (!cancelled) {
          setTeamsData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    const staleCheckFn = (service: ServiceData) =>
      isServiceStale(service, checksHash);
    return calculateTeamStats(services, staleCheckFn, checksHash);
  }, [services, checksHash]);

  // Merge with registry data and process
  const processedTeams = useMemo(() => {
    // Merge with team registry data
    let merged: MergedTeamData[];
    if (teamsData) {
      const mergedMap = mergeTeamDataWithStats(teamsData, teamStats);
      merged = Object.values(mergedMap);
    } else {
      // Create from stats only
      merged = Object.entries(teamStats).map(([name, stats]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        description: null,
        aliases: [],
        metadata: {},
        statistics: stats,
      }));
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      merged = merged.filter(
        (team) =>
          team.name.toLowerCase().includes(query) ||
          team.description?.toLowerCase().includes(query) ||
          team.aliases?.some((a) => a.toLowerCase().includes(query))
      );
    }

    // Sort
    const [sortBy, direction] = sortOption.split('-') as [TeamSortBy, SortDirection];
    // Convert array to Record format for sortTeamStats
    const flattenedForSort = merged.reduce((acc, t) => {
      acc[t.id] = {
        name: t.name,
        serviceCount: t.statistics?.serviceCount ?? 0,
        averageScore: t.statistics?.averageScore ?? 0,
        staleCount: t.statistics?.staleCount ?? 0,
        installedCount: t.statistics?.installedCount ?? 0,
        rankDistribution: t.statistics?.rankDistribution ?? { platinum: 0, gold: 0, silver: 0, bronze: 0 },
        github_org: null,
        github_slug: null,
      };
      return acc;
    }, {} as Record<string, import('../../../utils/team-statistics.js').TeamStatsEntry>);
    const sortedFlat = sortTeamStats(flattenedForSort, sortBy, direction);

    // Map back to merged teams in sorted order
    return sortedFlat.map((flat) =>
      merged.find((t) => t.name === flat.name)!
    ).filter(Boolean);
  }, [teamsData, teamStats, searchQuery, sortOption]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalServices = Object.values(teamStats).reduce(
      (sum, t) => sum + t.serviceCount,
      0
    );
    const totalTeams = Object.keys(teamStats).length;
    const servicesWithoutTeam = services.filter((s) => !s.team).length;
    return { totalServices, totalTeams, servicesWithoutTeam };
  }, [teamStats, services]);

  const handleFilterByTeam = (teamName: string) => {
    updateFilters({ teamFilter: teamName });
    onClose();
  };

  const handleCreateTeam = () => {
    openModal('teamEdit', { mode: 'create' });
  };

  const handleEditTeam = (teamId: string) => {
    openModal('teamEdit', { mode: 'edit', teamId });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="team-dashboard-modal"
      testId="team-dashboard-modal"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="team-dashboard-header p-4 border-b border-border">
          <h2 className="modal-title mb-4">Team Dashboard</h2>

          {/* Summary stats */}
          <div className="team-dashboard-summary flex gap-4 mb-4">
            <div className="team-summary-stat">
              <div className="team-summary-stat__value">{totals.totalTeams}</div>
              <div className="team-summary-stat__label">Teams</div>
            </div>
            <div className="team-summary-stat">
              <div className="team-summary-stat__value">{totals.totalServices}</div>
              <div className="team-summary-stat__label">With Team</div>
            </div>
            {totals.servicesWithoutTeam > 0 && (
              <div className="team-summary-stat team-summary-stat--warning">
                <div className="team-summary-stat__value team-summary-stat__value--warning">{totals.servicesWithoutTeam}</div>
                <div className="team-summary-stat__label team-summary-stat__label--warning">Without Team</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="team-dashboard-controls flex gap-2">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="team-dashboard-search"
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              aria-label="Sort teams by"
              className="team-dashboard-sort"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateTeam}
              className="team-dashboard-create-btn"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
              </svg>
              Create Team
            </button>
          </div>
        </div>

        {/* Team cards grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="team-dashboard-loading">
              <div>Loading teams...</div>
            </div>
          ) : processedTeams.length === 0 ? (
            <div className="team-dashboard-empty">
              <div>
                {searchQuery ? 'No teams match your search.' : 'No teams found.'}
              </div>
            </div>
          ) : (
            <div className="team-dashboard-grid">
              {processedTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onFilter={() => handleFilterByTeam(team.name)}
                  onEdit={() => handleEditTeam(team.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Team Card Sub-component
interface TeamCardProps {
  team: MergedTeamData;
  onFilter: () => void;
  onEdit: () => void;
}

function TeamCard({ team, onFilter, onEdit }: TeamCardProps) {
  const stats = team.statistics;
  const progressPercent = stats.serviceCount > 0
    ? Math.round((stats.installedCount / stats.serviceCount) * 100)
    : 0;

  const ranks: RankName[] = ['platinum', 'gold', 'silver', 'bronze'];
  const activeRanks = ranks.filter((r) => stats.rankDistribution[r] > 0);

  return (
    <div className="team-card-react">
      {/* Header */}
      <div className="team-card-react__header">
        <h3 className="team-card-react__name">{team.name}</h3>
        {(team.metadata as { slack_channel?: string })?.slack_channel && (
          <span className="team-card-react__slack">
            {(team.metadata as { slack_channel: string }).slack_channel}
          </span>
        )}
      </div>

      {team.description && (
        <p className="team-card-react__description">{team.description}</p>
      )}

      {/* Stats */}
      <div className="team-card-react__stats">
        <div className="team-card-react__stat">
          <div className="team-card-react__stat-value">{stats.serviceCount}</div>
          <div className="team-card-react__stat-label">Services</div>
        </div>
        <div className="team-card-react__stat">
          <div className="team-card-react__stat-value">{stats.averageScore}</div>
          <div className="team-card-react__stat-label">Avg Score</div>
        </div>
        {stats.staleCount > 0 && (
          <div className="team-card-react__stat">
            <div className="team-card-react__stat-value team-card-react__stat-value--warning">{stats.staleCount}</div>
            <div className="team-card-react__stat-label">Stale</div>
          </div>
        )}
      </div>

      {/* Rank badges */}
      {activeRanks.length > 0 && (
        <div className="team-card-react__ranks">
          {activeRanks.map((rank) => (
            <MiniRankBadge key={rank} rank={rank} count={stats.rankDistribution[rank]} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="team-card-react__progress">
        <div className="team-card-react__progress-header">
          <span>Installed</span>
          <span>{stats.installedCount}/{stats.serviceCount} ({progressPercent}%)</span>
        </div>
        <div className="team-card-react__progress-bar">
          <div
            className="team-card-react__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="team-card-react__actions">
        <button onClick={onFilter} className="team-card-react__action-btn">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
          </svg>
          Filter
        </button>
        <button onClick={onEdit} className="team-card-react__action-btn">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
          </svg>
          Edit
        </button>
      </div>
    </div>
  );
}

export default TeamDashboard;
