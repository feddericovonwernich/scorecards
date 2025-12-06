/**
 * TeamCard Component Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamCard, TeamGrid } from './TeamCard';

// Types for test data
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
  statistics?: {
    serviceCount: number;
    averageScore: number;
    installedCount: number;
    staleCount: number;
    rankDistribution: Record<string, number>;
  };
}

// Mock team data
const createMockTeam = (overrides: Partial<TeamData> = {}): TeamData => ({
  id: 'team-1',
  name: 'Platform Team',
  description: 'Core platform services',
  serviceCount: 5,
  averageScore: 85,
  installedCount: 4,
  staleCount: 1,
  rankDistribution: { platinum: 1, gold: 2, silver: 1, bronze: 1 },
  ...overrides,
});

describe('TeamCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders team name', () => {
    const team = createMockTeam({ name: 'Engineering Team' });
    render(<TeamCard team={team} />);
    expect(screen.getByText('Engineering Team')).toBeInTheDocument();
  });

  it('renders team description when provided', () => {
    const team = createMockTeam({ description: 'Handles infrastructure' });
    render(<TeamCard team={team} />);
    expect(screen.getByText('Handles infrastructure')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const team = createMockTeam({ description: undefined });
    render(<TeamCard team={team} />);
    expect(screen.queryByText('Core platform services')).not.toBeInTheDocument();
  });

  it('renders slack channel when provided', () => {
    const team = createMockTeam({ slack_channel: '#platform-team' });
    render(<TeamCard team={team} />);
    expect(screen.getByText('#platform-team')).toBeInTheDocument();
  });

  it('renders average score stat', () => {
    const team = createMockTeam({ averageScore: 92 });
    render(<TeamCard team={team} />);
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('Avg Score')).toBeInTheDocument();
  });

  it('renders service count stat', () => {
    const team = createMockTeam({ serviceCount: 7 });
    render(<TeamCard team={team} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
  });

  it('renders installed count stat', () => {
    const team = createMockTeam({ installedCount: 6 });
    render(<TeamCard team={team} />);
    expect(screen.getByText('6')).toBeInTheDocument();
    // "Installed" appears both in stat label and progress bar, check for stat label specifically
    const installedLabels = screen.getAllByText('Installed');
    expect(installedLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders stale count when greater than zero', () => {
    const team = createMockTeam({ staleCount: 3 });
    render(<TeamCard team={team} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Stale')).toBeInTheDocument();
  });

  it('does not render stale stat when zero', () => {
    const team = createMockTeam({ staleCount: 0 });
    render(<TeamCard team={team} />);
    expect(screen.queryByText('Stale')).not.toBeInTheDocument();
  });

  it('calls onCardClick when clicked', () => {
    const mockOnClick = jest.fn();
    const team = createMockTeam({ name: 'Clickable Team' });
    render(<TeamCard team={team} onCardClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith('Clickable Team');
  });

  it('supports keyboard navigation with Enter', () => {
    const mockOnClick = jest.fn();
    const team = createMockTeam({ name: 'Keyboard Team' });
    render(<TeamCard team={team} onCardClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledWith('Keyboard Team');
  });

  it('supports keyboard navigation with Space', () => {
    const mockOnClick = jest.fn();
    const team = createMockTeam({ name: 'Space Team' });
    render(<TeamCard team={team} onCardClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });

    expect(mockOnClick).toHaveBeenCalledWith('Space Team');
  });

  it('renders rank badge based on dominant rank', () => {
    const team = createMockTeam({
      rankDistribution: { platinum: 5, gold: 2, silver: 1, bronze: 0 },
    });
    render(<TeamCard team={team} />);
    // Platinum should be the dominant rank
    expect(screen.getByText('Platinum')).toBeInTheDocument();
  });

  it('uses statistics object when direct properties not provided', () => {
    const team = {
      id: 'team-stats',
      name: 'Stats Team',
      statistics: {
        serviceCount: 10,
        averageScore: 78,
        installedCount: 8,
        staleCount: 2,
        rankDistribution: { platinum: 0, gold: 5, silver: 3, bronze: 2 },
      },
    };
    render(<TeamCard team={team} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('calculates installed percentage for progress bar', () => {
    const team = createMockTeam({ serviceCount: 10, installedCount: 8 });
    render(<TeamCard team={team} />);
    // 80% installed
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('handles zero service count gracefully', () => {
    const team = createMockTeam({ serviceCount: 0, installedCount: 0 });
    render(<TeamCard team={team} />);
    // Should show 0% without dividing by zero
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('TeamGrid', () => {
  it('renders multiple team cards', () => {
    const teams = [
      createMockTeam({ id: '1', name: 'Team Alpha' }),
      createMockTeam({ id: '2', name: 'Team Beta' }),
      createMockTeam({ id: '3', name: 'Team Gamma' }),
    ];
    render(<TeamGrid teams={teams} />);

    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText('Team Gamma')).toBeInTheDocument();
  });

  it('renders empty state when no teams', () => {
    render(<TeamGrid teams={[]} />);
    expect(screen.getByText('No teams found')).toBeInTheDocument();
  });

  it('renders custom empty message', () => {
    render(<TeamGrid teams={[]} emptyMessage="No matching teams" />);
    expect(screen.getByText('No matching teams')).toBeInTheDocument();
  });

  it('passes onCardClick to child cards', () => {
    const mockOnCardClick = jest.fn();
    const teams = [createMockTeam({ name: 'Click Me Team' })];
    render(<TeamGrid teams={teams} onCardClick={mockOnCardClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnCardClick).toHaveBeenCalledWith('Click Me Team');
  });

  it('uses team id as key when available', () => {
    const teams = [
      createMockTeam({ id: 'unique-id-1', name: 'Team One' }),
      createMockTeam({ id: 'unique-id-2', name: 'Team Two' }),
    ];
    // This shouldn't throw any errors about duplicate keys
    render(<TeamGrid teams={teams} />);

    expect(screen.getByText('Team One')).toBeInTheDocument();
    expect(screen.getByText('Team Two')).toBeInTheDocument();
  });

  it('falls back to team name as key when id not provided', () => {
    const teams = [
      { name: 'Unique Team A', serviceCount: 1 } as TeamData,
      { name: 'Unique Team B', serviceCount: 2 } as TeamData,
    ];
    // This shouldn't throw any errors about duplicate keys
    render(<TeamGrid teams={teams} />);

    expect(screen.getByText('Unique Team A')).toBeInTheDocument();
    expect(screen.getByText('Unique Team B')).toBeInTheDocument();
  });
});
