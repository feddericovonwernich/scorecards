/**
 * ServiceCard Component
 *
 * Displays a service card with score, rank, badges, and metadata.
 * Supports click to open service detail modal.
 */

import { memo, useRef, useEffect } from 'react';
import type { ServiceData, DisplayMode } from '../../types/index.js';
import { RankBadge, ServiceBadges, ScoreBadge, UtilityBadge, type RankType } from '../ui/Badge.js';

// Icons as components for cleaner JSX
function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function PRIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z" />
    </svg>
  );
}

// Utility functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString();
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${diffDays}d ago`;
}

interface ServiceCardProps {
  service: ServiceData;
  isStale?: boolean;
  variant?: DisplayMode;
  onCardClick?: (org: string, repo: string) => void;
  onTeamClick?: (teamName: string) => void;
  onTriggerWorkflow?: (org: string, repo: string, button: HTMLButtonElement) => void;
}

export const ServiceCard = memo(function ServiceCard({
  service,
  isStale = false,
  variant = 'grid',
  onCardClick,
  onTeamClick,
  onTriggerWorkflow,
}: ServiceCardProps) {
  const canTrigger = isStale && service.installed;
  const teamName = service.team?.primary;
  const isListView = variant === 'list';

  const handleCardClick = () => {
    onCardClick?.(service.org, service.repo);
  };

  const handleTeamClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (teamName) {
      onTeamClick?.(teamName);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onTriggerWorkflow?.(service.org, service.repo, e.currentTarget);
  };

  const handleGitHubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handlePRClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  // List view: 7-column grid for perfect vertical alignment
  if (isListView) {
    return (
      <div
        className={`service-card rank-${service.rank} service-card--list`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Column 1: Name & Org */}
        <div className="service-info">
          <div className="service-name">{service.name}</div>
          <div className="service-org">{service.org}/{service.repo}</div>
        </div>

        {/* Column 2: Rank */}
        <RankBadge rank={service.rank as RankType} />

        {/* Column 3: Badges */}
        <div className="service-badges-cell">
          <ServiceBadges
            hasApi={service.has_api}
            isStale={isStale}
            isInstalled={service.installed}
          />
        </div>

        {/* Column 4: Icons */}
        <div className="service-icons">
          {canTrigger && (
            <button
              className="trigger-btn trigger-btn-icon"
              onClick={handleTriggerClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); } }}
              title="Re-run scorecard workflow"
            >
              <RefreshIcon />
            </button>
          )}
          <a
            href={`https://github.com/${service.org}/${service.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="github-icon-link"
            onClick={handleGitHubClick}
            title="View on GitHub"
          >
            <GitHubIcon />
          </a>
          {!service.installed && service.installation_pr && (
            <a
              href={service.installation_pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`pr-icon-link pr-icon-${service.installation_pr.state.toLowerCase()}`}
              onClick={handlePRClick}
              title={`PR #${service.installation_pr.number}`}
            >
              <PRIcon />
            </a>
          )}
        </div>

        {/* Column 5: Score */}
        <div className="score-badge-cell">
          <ScoreBadge score={service.score} />
        </div>

        {/* Column 6: Team (always render placeholder for alignment) */}
        {teamName ? (
          <div className="service-team">
            <span
              className="service-team-link"
              onClick={handleTeamClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTeamClick(e as unknown as React.MouseEvent);
                }
              }}
            >
              <TeamIcon />
              {teamName}
            </span>
          </div>
        ) : (
          <div className="service-team-empty" />
        )}

        {/* Column 7: Last Updated */}
        <div className="service-meta">
          <div>Last updated: {formatDate(service.last_updated)}</div>
        </div>
      </div>
    );
  }

  // Grid view: Original vertical card layout
  return (
    <div
      className={`service-card rank-${service.rank}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="service-header">
        <div>
          <div className="service-title-wrapper">
            <div className="service-name">{service.name}</div>
            <ServiceBadges
              hasApi={service.has_api}
              isStale={isStale}
              isInstalled={false}
            />
          </div>
          <div className="service-org">
            {service.org}/{service.repo}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {canTrigger && (
            <button
              className="trigger-btn trigger-btn-icon"
              onClick={handleTriggerClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              title="Re-run scorecard workflow"
            >
              <RefreshIcon />
            </button>
          )}
          <a
            href={`https://github.com/${service.org}/${service.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="github-icon-link"
            onClick={handleGitHubClick}
            title="View on GitHub"
          >
            <GitHubIcon />
          </a>
          {!service.installed && service.installation_pr && (
            <a
              href={service.installation_pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`pr-icon-link pr-icon-${service.installation_pr.state.toLowerCase()}`}
              onClick={handlePRClick}
              title={`${service.installation_pr.state === 'OPEN' ? 'Open' : 'Closed'} installation PR #${service.installation_pr.number}`}
            >
              <PRIcon />
            </a>
          )}
          <ScoreBadge score={service.score} />
        </div>
      </div>
      <div className="service-status-row">
        <RankBadge rank={service.rank as RankType} />
        {teamName ? (
          <div className="service-team">
            <span
              className="service-team-link"
              onClick={handleTeamClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTeamClick(e as unknown as React.MouseEvent);
                }
              }}
            >
              <TeamIcon />
              {teamName}
            </span>
          </div>
        ) : (
          <div className="service-team-empty" />
        )}
      </div>
      <div className="service-meta">
        <div className="service-meta-left">
          <div>Last updated: {formatDate(service.last_updated)}</div>
          {service.installation_pr?.updated_at && (
            <div
              className="pr-status-timestamp"
              title={`PR status last fetched at ${new Date(service.installation_pr.updated_at).toLocaleString()}`}
            >
              PR status: {formatRelativeTime(service.installation_pr.updated_at)}
            </div>
          )}
        </div>
        {service.installed && <UtilityBadge type="installed" />}
      </div>
    </div>
  );
});

/**
 * ServiceGrid - Container for service cards
 */
interface ServiceGridProps {
  services: ServiceData[];
  checksHash?: string | null;
  variant?: DisplayMode;
  isServiceStale?: (service: ServiceData, checksHash: string | null) => boolean;
  onCardClick?: (org: string, repo: string) => void;
  onTeamClick?: (teamName: string) => void;
  onTriggerWorkflow?: (org: string, repo: string, button: HTMLButtonElement) => void;
}

export function ServiceGrid({
  services,
  checksHash = null,
  variant = 'grid',
  isServiceStale,
  onCardClick,
  onTeamClick,
  onTriggerWorkflow,
}: ServiceGridProps) {
  // Note: ServiceGrid renders INTO a container that already has 'services-grid' class
  // We use a ref and add --list class via useEffect to the parent container
  // Hooks must be called unconditionally, before any early returns
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find the parent container (the one with ID 'services-grid') and add/remove --list class
    const parent = gridRef.current?.parentElement;
    if (parent && parent.id === 'services-grid') {
      if (variant === 'list') {
        parent.classList.add('services-grid--list');
      } else {
        parent.classList.remove('services-grid--list');
      }
    }
  }, [variant]);

  if (services.length === 0) {
    return (
      <div className="empty-state">
        <h3>No services match your criteria</h3>
      </div>
    );
  }

  return (
    <div ref={gridRef} style={{ display: 'contents' }}>
      {services.map((service) => {
        const isStale = isServiceStale?.(service, checksHash) ?? false;
        return (
          <ServiceCard
            key={`${service.org}/${service.repo}`}
            service={service}
            isStale={isStale}
            variant={variant}
            onCardClick={onCardClick}
            onTeamClick={onTeamClick}
            onTriggerWorkflow={onTriggerWorkflow}
          />
        );
      })}
    </div>
  );
}
