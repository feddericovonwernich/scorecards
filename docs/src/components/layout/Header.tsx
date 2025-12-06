/**
 * Header Component
 * App header with logo and title
 * Uses CSS classes from header.css for styling
 */

import { cn } from '../../utils/css.js';

/**
 * Scorecards Logo SVG
 */
function ScorecardsLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back card (pass) - furthest right/down */}
      <rect
        x="12"
        y="8"
        width="14"
        height="18"
        rx="2"
        fill="#1e3a5f"
        stroke="#38BDF8"
        strokeWidth="1"
      />
      <path
        d="M16 14l2 2 3-3"
        stroke="#38BDF8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Middle card (fail) - red */}
      <rect
        x="9"
        y="6"
        width="14"
        height="18"
        rx="2"
        fill="#4a1e1e"
        stroke="#f87171"
        strokeWidth="1"
      />
      <path
        d="M18 12l-4 4M14 12l4 4"
        stroke="#f87171"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Front card (pass) - closest */}
      <rect
        x="6"
        y="4"
        width="14"
        height="18"
        rx="2"
        fill="#0f2942"
        stroke="#0EA5E9"
        strokeWidth="1.2"
      />
      <path
        d="M10 11l2 2 4-4"
        stroke="#38BDF8"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface HeaderProps {
  title?: string;
}

/**
 * Header Component
 */
export function Header({ title = 'Scorecards' }: HeaderProps) {
  return (
    <>
      {/* Elegant Top Strip - Using CSS class for gradient and animation */}
      <div className={cn('header-strip', 'header-strip-react')} />

      {/* Compact Header Bar */}
      <header className="header-bar header-bar-react">
        <div className="header-brand header-brand-react">
          <ScorecardsLogo className="header-logo header-logo-react" />
          <span className="header-title header-title-react">
            {title}
          </span>
        </div>
      </header>
    </>
  );
}

export default Header;
