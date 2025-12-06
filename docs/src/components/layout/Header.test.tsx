/**
 * Header Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders the default title', () => {
    render(<Header />);
    expect(screen.getByText('Scorecards')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(<Header title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders the Scorecards logo', () => {
    render(<Header />);
    // The logo is an SVG inside the header
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    // Check SVG logo exists in the header
    const logo = header.querySelector('svg');
    expect(logo).toBeInTheDocument();
  });

  it('renders the header strip', () => {
    render(<Header />);
    // Header strip has the header-strip class for shimmer animation
    const strip = document.querySelector('.header-strip');
    expect(strip).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<Header />);
    // Should have a header element
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});
