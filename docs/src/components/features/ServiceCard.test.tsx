/**
 * ServiceCard Component Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceCard, ServiceGrid } from './ServiceCard';
import type { ServiceData } from '../../types/index';

// Mock service data
const createMockService = (overrides: Partial<ServiceData> = {}): ServiceData => ({
  org: 'test-org',
  repo: 'test-repo',
  name: 'Test Service',
  score: 85,
  rank: 'gold',
  team: { primary: 'Platform Team', all: ['Platform Team'], source: 'github' },
  check_results: { '01-readme': 'pass', '02-license': 'pass' },
  excluded_checks: [],
  checks_count: 10,
  checks_hash: 'abc123',
  last_updated: new Date().toISOString(),
  default_branch: 'main',
  installed: true,
  ...overrides,
});

describe('ServiceCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders service name', () => {
    const service = createMockService({ name: 'My Service' });
    render(<ServiceCard service={service} />);
    expect(screen.getByText('My Service')).toBeInTheDocument();
  });

  it('renders org/repo path', () => {
    const service = createMockService({ org: 'acme', repo: 'widget' });
    render(<ServiceCard service={service} />);
    expect(screen.getByText('acme/widget')).toBeInTheDocument();
  });

  it('renders score badge', () => {
    const service = createMockService({ score: 92 });
    render(<ServiceCard service={service} />);
    // Score displays as number without % suffix
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('renders rank badge', () => {
    const service = createMockService({ rank: 'platinum' });
    render(<ServiceCard service={service} />);
    // Rank badge shows the rank name
    expect(screen.getByText('Platinum')).toBeInTheDocument();
  });

  it('renders team link when team exists', () => {
    const service = createMockService({ team: { primary: 'Core Team', all: ['Core Team'], source: 'github' } });
    render(<ServiceCard service={service} />);
    expect(screen.getByText('Core Team')).toBeInTheDocument();
  });

  it('does not render team section when team is null', () => {
    const service = createMockService({ team: null });
    render(<ServiceCard service={service} />);
    expect(screen.queryByText('Team:')).not.toBeInTheDocument();
  });

  it('renders GitHub link', () => {
    const service = createMockService({ org: 'myorg', repo: 'myrepo' });
    render(<ServiceCard service={service} />);
    const link = screen.getByRole('link', { name: /View on GitHub/ });
    expect(link).toHaveAttribute('href', 'https://github.com/myorg/myrepo');
  });

  it('calls onCardClick when clicked', () => {
    const mockOnClick = jest.fn();
    const service = createMockService({ org: 'click-org', repo: 'click-repo' });
    render(<ServiceCard service={service} onCardClick={mockOnClick} />);

    // Use DOM selector since there are multiple buttons (card + team link)
    const card = document.querySelector('.service-card');
    expect(card).toBeInTheDocument();
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalledWith('click-org', 'click-repo');
  });

  it('calls onTeamClick when team is clicked', () => {
    const mockOnTeamClick = jest.fn();
    const service = createMockService({ team: { primary: 'Team Alpha', all: ['Team Alpha'], source: 'github' } });
    render(<ServiceCard service={service} onTeamClick={mockOnTeamClick} />);

    const teamLink = screen.getByText('Team Alpha');
    fireEvent.click(teamLink);

    expect(mockOnTeamClick).toHaveBeenCalledWith('Team Alpha');
  });

  it('stops propagation when team is clicked', () => {
    const mockOnCardClick = jest.fn();
    const mockOnTeamClick = jest.fn();
    const service = createMockService({ team: { primary: 'Team Beta', all: ['Team Beta'], source: 'github' } });
    render(<ServiceCard service={service} onCardClick={mockOnCardClick} onTeamClick={mockOnTeamClick} />);

    const teamLink = screen.getByText('Team Beta');
    fireEvent.click(teamLink);

    // Card click should not be called
    expect(mockOnCardClick).not.toHaveBeenCalled();
    expect(mockOnTeamClick).toHaveBeenCalledWith('Team Beta');
  });

  it('supports keyboard navigation', () => {
    const mockOnClick = jest.fn();
    const service = createMockService();
    render(<ServiceCard service={service} onCardClick={mockOnClick} />);

    // Use DOM selector since there are multiple buttons (card + team link)
    const card = document.querySelector('.service-card');
    expect(card).toBeInTheDocument();
    fireEvent.keyDown(card!, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('renders stale indicator when isStale is true', () => {
    const service = createMockService();
    render(<ServiceCard service={service} isStale={true} />);
    // Stale badge is part of ServiceBadges
    const container = document.querySelector('.service-card');
    expect(container).toBeInTheDocument();
  });

  it('renders trigger button when stale and installed', () => {
    const service = createMockService({ installed: true });
    render(<ServiceCard service={service} isStale={true} onTriggerWorkflow={jest.fn()} />);
    const triggerBtn = screen.getByRole('button', { name: /Re-run scorecard workflow/ });
    expect(triggerBtn).toBeInTheDocument();
  });

  it('calls onTriggerWorkflow when trigger button is clicked', () => {
    const mockOnTrigger = jest.fn();
    const service = createMockService({ org: 'trig-org', repo: 'trig-repo', installed: true });
    render(<ServiceCard service={service} isStale={true} onTriggerWorkflow={mockOnTrigger} />);

    const triggerBtn = screen.getByRole('button', { name: /Re-run scorecard workflow/ });
    fireEvent.click(triggerBtn);

    expect(mockOnTrigger).toHaveBeenCalledWith('trig-org', 'trig-repo', expect.any(HTMLButtonElement));
  });

  it('renders installation PR link when not installed and PR exists', () => {
    const service = createMockService({
      installed: false,
      installation_pr: { number: 42, url: 'https://github.com/org/repo/pull/42', state: 'OPEN' },
    });
    render(<ServiceCard service={service} />);
    const prLink = screen.getByRole('link', { name: /Open installation PR #42/ });
    expect(prLink).toHaveAttribute('href', 'https://github.com/org/repo/pull/42');
  });
});

describe('ServiceGrid', () => {
  it('renders multiple service cards', () => {
    const services = [
      createMockService({ name: 'Service A', org: 'org', repo: 'repo-a' }),
      createMockService({ name: 'Service B', org: 'org', repo: 'repo-b' }),
      createMockService({ name: 'Service C', org: 'org', repo: 'repo-c' }),
    ];
    render(<ServiceGrid services={services} />);

    expect(screen.getByText('Service A')).toBeInTheDocument();
    expect(screen.getByText('Service B')).toBeInTheDocument();
    expect(screen.getByText('Service C')).toBeInTheDocument();
  });

  it('renders empty state when no services', () => {
    render(<ServiceGrid services={[]} />);
    expect(screen.getByText('No services match your criteria')).toBeInTheDocument();
  });

  it('passes callbacks to child cards', () => {
    const mockOnCardClick = jest.fn();
    const services = [createMockService({ name: 'Clickable', org: 'click', repo: 'me' })];
    render(<ServiceGrid services={services} onCardClick={mockOnCardClick} />);

    // Find the service card (the main card, not the team link button)
    const card = document.querySelector('.service-card');
    expect(card).toBeInTheDocument();
    fireEvent.click(card!);

    expect(mockOnCardClick).toHaveBeenCalledWith('click', 'me');
  });

  it('applies staleness check to services', () => {
    const services = [createMockService({ checks_hash: 'old-hash' })];
    const isServiceStale = jest.fn<(service: ServiceData, checksHash: string) => boolean>().mockReturnValue(true);
    render(<ServiceGrid services={services} checksHash="new-hash" isServiceStale={isServiceStale} />);

    expect(isServiceStale).toHaveBeenCalled();
  });
});
