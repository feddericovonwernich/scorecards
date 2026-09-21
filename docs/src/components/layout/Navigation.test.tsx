/**
 * Navigation Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';

function LocationDisplay() {
  const { pathname } = useLocation();
  return <output data-testid="location">{pathname}</output>;
}

function renderNavigation(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Navigation />
      <LocationDisplay />
    </MemoryRouter>
  );
}

describe('Navigation', () => {
  it('renders Services and Teams tabs', () => {
    renderNavigation('/services');

    expect(screen.getByRole('tab', { name: 'Services' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Teams' })).toBeInTheDocument();
  });

  it('selects the tab for the current route', () => {
    renderNavigation('/teams');

    expect(screen.getByRole('tab', { name: 'Services' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Teams' })).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to the selected tab route', () => {
    renderNavigation('/services');

    fireEvent.click(screen.getByRole('tab', { name: 'Teams' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/teams');
  });

  it('exposes its tabs in a tab list', () => {
    renderNavigation('/services');

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
