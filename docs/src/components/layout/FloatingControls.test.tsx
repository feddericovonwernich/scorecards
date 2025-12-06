/**
 * FloatingControls Component Tests
 */

import { jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingControls } from './FloatingControls';

describe('FloatingControls', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Reset document theme
    document.documentElement.setAttribute('data-theme', 'light');
  });

  it('renders theme toggle button', () => {
    render(<FloatingControls />);
    const themeBtn = screen.getByRole('button', { name: /Toggle night mode/ });
    expect(themeBtn).toBeInTheDocument();
  });

  it('renders settings button', () => {
    render(<FloatingControls />);
    const settingsBtn = screen.getByRole('button', { name: /Settings/ });
    expect(settingsBtn).toBeInTheDocument();
  });

  it('renders actions widget button', () => {
    render(<FloatingControls />);
    const actionsBtn = screen.getByRole('button', { name: /Show GitHub Actions/ });
    expect(actionsBtn).toBeInTheDocument();
  });

  it('displays badge count', () => {
    render(<FloatingControls actionsBadgeCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays zero badge count by default', () => {
    render(<FloatingControls />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    render(<FloatingControls />);
    const themeBtn = screen.getByRole('button', { name: /Toggle night mode/ });

    // Initial theme is light
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Click to toggle
    fireEvent.click(themeBtn);

    // Theme should now be dark
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('calls onSettingsClick when settings button is clicked', () => {
    const mockOnSettingsClick = jest.fn();
    render(<FloatingControls onSettingsClick={mockOnSettingsClick} />);
    const settingsBtn = screen.getByRole('button', { name: /Settings/ });
    fireEvent.click(settingsBtn);
    expect(mockOnSettingsClick).toHaveBeenCalled();
  });

  it('calls onActionsWidgetClick when actions button is clicked', () => {
    const mockOnActionsWidgetClick = jest.fn();
    render(<FloatingControls onActionsWidgetClick={mockOnActionsWidgetClick} />);
    const actionsBtn = screen.getByRole('button', { name: /Show GitHub Actions/ });
    fireEvent.click(actionsBtn);
    expect(mockOnActionsWidgetClick).toHaveBeenCalled();
  });

  it('clicks settings button without error when no callback provided', () => {
    render(<FloatingControls />);
    const settingsBtn = screen.getByRole('button', { name: /Settings/ });
    // Should not throw when clicking
    expect(() => fireEvent.click(settingsBtn)).not.toThrow();
  });

  it('clicks actions button without error when no callback provided', () => {
    render(<FloatingControls />);
    const actionsBtn = screen.getByRole('button', { name: /Show GitHub Actions/ });
    // Should not throw when clicking
    expect(() => fireEvent.click(actionsBtn)).not.toThrow();
  });

  it('has proper container positioning', () => {
    render(<FloatingControls />);
    // Container is fixed positioned in bottom-right corner with Tailwind
    const container = document.querySelector('.fixed.bottom-6.right-6');
    expect(container).toBeInTheDocument();
  });
});
