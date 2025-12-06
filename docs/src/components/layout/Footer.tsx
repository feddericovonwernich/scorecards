/**
 * Footer Component
 * App footer with logo and documentation link
 * Uses CSS classes from footer.css for styling
 */

import { cn } from '../../utils/css.js';

/**
 * Scorecards Logo SVG (compact version for footer)
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

export interface FooterProps {
  docsUrl?: string;
}

/**
 * Footer Component
 */
export function Footer({
  docsUrl = 'https://github.com/feddericovonwernich-org/scorecards',
}: FooterProps) {
  return (
    <>
      <footer className="footer-react">
        <div className="footer-react__container">
          <div className="footer-react__content">
            <ScorecardsLogo className="footer-react__logo" />
            <p className="footer-react__text">
              Powered by Scorecards |{' '}
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-react__link"
              >
                Documentation
              </a>
            </p>
          </div>
        </div>
      </footer>
      {/* Footer Gradient Strip - Using CSS class for gradient and animation */}
      <div className={cn('footer-strip', 'footer-strip-react')} />
    </>
  );
}

export default Footer;
