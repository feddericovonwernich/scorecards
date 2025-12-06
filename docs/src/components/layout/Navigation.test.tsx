/**
 * Navigation Component Tests
 */

import { jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from './Navigation';

describe('Navigation', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    mockOnViewChange.mockClear();
  });

  it('renders Services and Teams tabs', () => {
    render(<Navigation activeView="services" onViewChange={mockOnViewChange} />);
    expect(screen.getByRole('button', { name: /Services/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Teams/ })).toBeInTheDocument();
  });

  it('marks Services tab as active when activeView is services', () => {
    render(<Navigation activeView="services" onViewChange={mockOnViewChange} />);
    const servicesTab = screen.getByRole('button', { name: /Services/ });
    // Active state uses bg-accent class in Tailwind
    expect(servicesTab).toHaveClass('bg-accent');
    const teamsTab = screen.getByRole('button', { name: /Teams/ });
    expect(teamsTab).not.toHaveClass('bg-accent');
  });

  it('marks Teams tab as active when activeView is teams', () => {
    render(<Navigation activeView="teams" onViewChange={mockOnViewChange} />);
    const servicesTab = screen.getByRole('button', { name: /Services/ });
    expect(servicesTab).not.toHaveClass('bg-accent');
    const teamsTab = screen.getByRole('button', { name: /Teams/ });
    // Active state uses bg-accent class in Tailwind
    expect(teamsTab).toHaveClass('bg-accent');
  });

  it('calls onViewChange with "services" when Services tab is clicked', () => {
    render(<Navigation activeView="teams" onViewChange={mockOnViewChange} />);
    const servicesTab = screen.getByRole('button', { name: /Services/ });
    fireEvent.click(servicesTab);
    expect(mockOnViewChange).toHaveBeenCalledWith('services');
  });

  it('calls onViewChange with "teams" when Teams tab is clicked', () => {
    render(<Navigation activeView="services" onViewChange={mockOnViewChange} />);
    const teamsTab = screen.getByRole('button', { name: /Teams/ });
    fireEvent.click(teamsTab);
    expect(mockOnViewChange).toHaveBeenCalledWith('teams');
  });

  it('has proper navigation role', () => {
    render(<Navigation activeView="services" onViewChange={mockOnViewChange} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('has data-view attributes for each tab', () => {
    render(<Navigation activeView="services" onViewChange={mockOnViewChange} />);
    const servicesTab = screen.getByRole('button', { name: /Services/ });
    const teamsTab = screen.getByRole('button', { name: /Teams/ });
    expect(servicesTab).toHaveAttribute('data-view', 'services');
    expect(teamsTab).toHaveAttribute('data-view', 'teams');
  });
});
