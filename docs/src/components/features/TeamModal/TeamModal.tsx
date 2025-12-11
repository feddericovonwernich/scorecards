/**
 * Team Modal Component
 * Displays detailed information about a team with multiple tabs
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../ui/Modal.js';
import { Tabs, type Tab } from '../../ui/Tabs.js';
import { ServicesTab } from './tabs/ServicesTab.js';
import { DistributionTab } from './tabs/DistributionTab.js';
import { CheckAdoptionTab } from './tabs/CheckAdoptionTab.js';
import { GitHubTab } from './tabs/GitHubTab.js';
import { useAppStore } from '../../../stores/appStore.js';
import type { ServiceData, RankName, TeamMember, TeamWithStats as BaseTeamWithStats } from '../../../types/index.js';

// Extend the base TeamWithStats type for use in this modal
type TeamWithStats = BaseTeamWithStats & {
  oncall_rotation?: string;
  aliases?: string[];
};

export interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string | null;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get dominant rank from distribution
 */
function getDominantRank(
  rankDistribution: Record<string, number>
): RankName {
  const ranks: RankName[] = ['platinum', 'gold', 'silver', 'bronze'];
  for (const rank of ranks) {
    if (rankDistribution[rank] > 0) {
      return rank;
    }
  }
  return 'bronze';
}

/**
 * Team Modal Component
 */
export function TeamModal({ isOpen, onClose, teamName }: TeamModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<TeamWithStats | null>(null);
  const [teamServices, setTeamServices] = useState<ServiceData[]>([]);
  const [githubMembers, setGithubMembers] = useState<TeamMember[] | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);

  // Fetch team data when modal opens
  useEffect(() => {
    if (!isOpen || !teamName) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get team data from window globals
        const allTeams = useAppStore.getState().teams.all || [];
        const allServices = useAppStore.getState().services.all || [];

        // If no teams, calculate from services
        if (allTeams.length === 0 && allServices.length > 0) {
          const { calculateTeamStats } = await import(
            '../../../utils/team-statistics.js'
          );
          const stats = calculateTeamStats(allServices);
          // Convert TeamStatsEntry[] to TeamWithStats[] (null -> undefined)
          useAppStore.getState().teams.all = Object.values(stats).map(s => ({
            ...s,
            github_org: s.github_org ?? undefined,
            github_slug: s.github_slug ?? undefined,
          }));
        }

        // Find team
        const team = (useAppStore.getState().teams.all || []).find(
          (t: TeamWithStats) => t.name === teamName
        );

        if (!team) {
          setError('Team not found');
          return;
        }

        setTeamData(team as TeamWithStats);

        // Get services for this team (case-insensitive match)
        const { getTeamName } = await import('../../../utils/team-statistics.js');
        const teamNameLower = teamName.toLowerCase();
        const services = allServices.filter(
          (s: ServiceData) => getTeamName(s)?.toLowerCase() === teamNameLower
        );
        setTeamServices(services);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, teamName]);

  // Fetch GitHub members
  useEffect(() => {
    if (!isOpen || !teamData?.github_org || !teamData?.github_slug) {
      return;
    }

    const fetchMembers = async () => {
      setGithubLoading(true);
      try {
        const { fetchTeamMembers } = await import('../../../api/github-teams.js');
        const members = await fetchTeamMembers(
          teamData.github_org!,
          teamData.github_slug!
        );
        setGithubMembers(members);
      } catch {
        setGithubMembers([]);
      } finally {
        setGithubLoading(false);
      }
    };

    fetchMembers();
  }, [isOpen, teamData?.github_org, teamData?.github_slug]);

  // Handle service click
  const handleServiceClick = useCallback((org: string, repo: string) => {
    window.showServiceDetail?.(org, repo);
  }, []);

  // Handle edit team click
  const handleEditClick = useCallback(() => {
    if (!teamData) {return;}
    const teamId = teamData.id || teamData.name.toLowerCase().replace(/\s+/g, '-');
    window.openTeamEditModal?.('edit', teamId);
  }, [teamData]);

  // Build tabs
  const tabs = useMemo((): Tab[] => {
    if (!teamData) {return [];}

    const tabList: Tab[] = [
      {
        id: 'services',
        label: 'Services',
        content: (
          <ServicesTab
            services={teamServices}
            onServiceClick={handleServiceClick}
          />
        ),
      },
      {
        id: 'distribution',
        label: 'Distribution',
        content: (
          <DistributionTab
            rankDistribution={teamData.rankDistribution ?? {}}
            serviceCount={teamData.serviceCount ?? 0}
          />
        ),
      },
      {
        id: 'adoption',
        label: 'Check Adoption',
        content: (
          <CheckAdoptionTab
            teamServices={teamServices}
            teamName={teamName || ''}
          />
        ),
      },
      {
        id: 'github',
        label: 'GitHub',
        content: (
          <GitHubTab
            githubOrg={teamData.github_org}
            githubSlug={teamData.github_slug}
            members={githubMembers}
            loading={githubLoading}
          />
        ),
      },
    ];

    return tabList;
  }, [
    teamData,
    teamServices,
    teamName,
    githubMembers,
    githubLoading,
    handleServiceClick,
  ]);

  // Render content
  const renderContent = () => {
    if (loading) {
      return <div className="loading">Loading team details...</div>;
    }

    if (error) {
      return (
        <div className="error-state">
          <h3>Error loading team</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (!teamData) {
      return <div className="empty-state">Team not found</div>;
    }

    const dominantRank = getDominantRank(teamData.rankDistribution ?? {});
    const teamId =
      teamData.id || teamData.name.toLowerCase().replace(/\s+/g, '-');

    return (
      <>
        {/* Header - title row with badge */}
        <div className="service-modal-title-row">
          <h2>
            {teamData.name}
            <button
              className="edit-icon-btn"
              onClick={handleEditClick}
              title="Edit Team"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064l6.286-6.286zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z" />
              </svg>
            </button>
          </h2>
          <div className={`rank-badge modal-header-badge ${dominantRank}`}>
            {capitalize(dominantRank)}
          </div>
        </div>

        {/* Metadata */}
        <div className="team-metadata">
          <span className="team-id">ID: {teamId}</span>
          {teamData.description && (
            <p className="team-description">{teamData.description}</p>
          )}
          {teamData.aliases && teamData.aliases.length > 0 && (
            <div className="team-aliases">
              <span className="aliases-label">Also known as:</span>
              {teamData.aliases.map((alias, i) => (
                <span key={i} className="alias-tag">
                  {alias}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="team-modal-stats">
          <div className="team-modal-stat">
            <span className="stat-value">
              {Math.round(teamData.averageScore || 0)}
            </span>
            <span className="stat-label">Average Score</span>
          </div>
          <div className="team-modal-stat">
            <span className="stat-value">{teamData.serviceCount}</span>
            <span className="stat-label">Services</span>
          </div>
          <div className="team-modal-stat">
            <span className="stat-value">{teamData.installedCount}</span>
            <span className="stat-label">Installed</span>
          </div>
          <div
            className={`team-modal-stat ${(teamData.staleCount ?? 0) > 0 ? 'warning' : ''}`}
          >
            <span className="stat-value">{teamData.staleCount || 0}</span>
            <span className="stat-label">Stale</span>
          </div>
        </div>

        {/* Contact info */}
        {(teamData.slack_channel || teamData.oncall_rotation) && (
          <div className="team-modal-contact">
            {teamData.slack_channel && (
              <span className="contact-item">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M5.2 8.4a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0zm6 0a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0z" />
                </svg>
                {teamData.slack_channel}
              </span>
            )}
            {teamData.oncall_rotation && (
              <span className="contact-item">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
                </svg>
                {teamData.oncall_rotation}
              </span>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab="services" />
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="team-modal-wrapper"
      contentClassName="team-modal-content"
      testId="team-modal"
    >
      <div id="team-detail">{renderContent()}</div>
    </Modal>
  );
}

export default TeamModal;
