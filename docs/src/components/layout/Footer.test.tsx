/**
 * Footer Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the powered by text', () => {
    render(<Footer />);
    expect(screen.getByText(/Powered by Scorecards/)).toBeInTheDocument();
  });

  it('renders the documentation link with default URL', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /Documentation/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/feddericovonwernich-org/scorecards'
    );
  });

  it('renders the documentation link with custom URL', () => {
    render(<Footer docsUrl="https://custom-docs.example.com" />);
    const link = screen.getByRole('link', { name: /Documentation/ });
    expect(link).toHaveAttribute('href', 'https://custom-docs.example.com');
  });

  it('opens link in new tab', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /Documentation/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the footer logo', () => {
    render(<Footer />);
    // The logo is an SVG inside the footer
    const footer = screen.getByRole('contentinfo');
    const logo = footer.querySelector('svg');
    expect(logo).toBeInTheDocument();
  });

  it('renders the footer strip', () => {
    render(<Footer />);
    // Footer strip has the footer-strip class for shimmer animation
    const strip = document.querySelector('.footer-strip');
    expect(strip).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<Footer />);
    // Should have a contentinfo (footer) element
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });
});
