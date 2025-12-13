/**
 * TeamCard Component
 *
 * Displays a team card with statistics, rank distribution, and progress bar.
 * Supports click to open team detail modal.
 */

import { memo } from 'react';
import type { DisplayMode } from '../../types/index.js';
import { RankBadge, RankBadgeGroup, type RankType } from '../ui/Badge.js';

// Types for team data
interface TeamStatistics {
  serviceCount: number;
  averageScore: number;
  installedCount: number;
  staleCount: number;
  rankDistribution: Record<RankType, number>;
}

interface TeamData {
  id?: string;
  name: string;
  description?: string;
  slug?: string;
  github_org?: string;
  github_slug?: string;
  slack_channel?: string | null;
  serviceCount?: number;
  averageScore?: number;
  installedCount?: number;
  staleCount?: number;
  rankDistribution?: Record<string, number>;
  statistics?: TeamStatistics;
}

// Calculate dominant rank from distribution
function getDominantRank(distribution: Record<string, number>): RankType {
  const ranks: RankType[] = ['platinum', 'gold', 'silver', 'bronze'];
  for (const rank of ranks) {
    if (distribution[rank] > 0) {
      return rank;
    }
  }
  return 'bronze';
}

interface TeamStatProps {
  value: number | string;
  label: string;
  warning?: boolean;
}

function TeamStat({ value, label, warning = false }: TeamStatProps) {
  return (
    <div className={`team-stat${warning ? ' warning' : ''}`}>
      <span className="team-stat-value">{value}</span>
      <span className="team-stat-label">{label}</span>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  percentage: number;
}

function ProgressBar({ label, percentage }: ProgressBarProps) {
  return (
    <div className="team-card-progress">
      <div className="progress-label">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

interface TeamCardProps {
  team: TeamData;
  variant?: DisplayMode;
  onCardClick?: (teamName: string) => void;
}

export const TeamCard = memo(function TeamCard({ team, variant = 'grid', onCardClick }: TeamCardProps) {
  // Normalize team data (can come from different sources)
  const serviceCount = team.serviceCount ?? team.statistics?.serviceCount ?? 0;
  const averageScore = team.averageScore ?? team.statistics?.averageScore ?? 0;
  const installedCount = team.installedCount ?? team.statistics?.installedCount ?? 0;
  const staleCount = team.staleCount ?? team.statistics?.staleCount ?? 0;
  const rankDistribution = (team.rankDistribution ?? team.statistics?.rankDistribution ?? {
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
  }) as Record<RankType, number>;

  const dominantRank = getDominantRank(rankDistribution);
  const installedPct = serviceCount > 0 ? Math.round((installedCount / serviceCount) * 100) : 0;
  const isListView = variant === 'list';

  const handleCardClick = () => {
    onCardClick?.(team.name);
  };

  return (
    <div
      className={`team-card rank-${dominantRank}${isListView ? ' team-card--list' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="team-card-header">
        <h3 className="team-card-name">{team.name}</h3>
        {team.slack_channel && (
          <span className="team-slack">{team.slack_channel}</span>
        )}
      </div>

      <RankBadge rank={dominantRank} />

      {team.description && (
        <p className="team-card-description">{team.description}</p>
      )}

      <div className="team-card-stats">
        <TeamStat value={Math.round(averageScore)} label="Avg Score" />
        <TeamStat value={serviceCount} label="Services" />
        <TeamStat value={installedCount} label="Installed" />
        {staleCount > 0 && (
          <TeamStat value={staleCount} label="Stale" warning />
        )}
      </div>

      <RankBadgeGroup distribution={rankDistribution} className="team-card-ranks" />

      <ProgressBar label="Installed" percentage={installedPct} />
    </div>
  );
});

/**
 * TeamGrid - Container for team cards
 */
interface TeamGridProps {
  teams: TeamData[];
  variant?: DisplayMode;
  onCardClick?: (teamName: string) => void;
  emptyMessage?: string;
}

export function TeamGrid({
  teams,
  variant = 'grid',
  onCardClick,
  emptyMessage = 'No teams found',
}: TeamGridProps) {
  // Grid/list mode is now managed by TeamGridContainer via className
  // No DOM manipulation needed - React handles styling

  if (teams.length === 0) {
    return (
      <div className="empty-state">
        <h3>{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'contents' }}>
      {teams.map((team) => (
        <TeamCard
          key={team.id ?? team.name}
          team={team}
          variant={variant}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
