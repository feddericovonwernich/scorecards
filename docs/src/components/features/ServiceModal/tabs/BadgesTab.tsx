/**
 * Badges Tab Component
 * Displays badge markdown for README files
 */

import { useState, useCallback, useEffect } from 'react';
import { copyText } from '../../../../utils/clipboard.js';


interface BadgesTabProps {
  org: string;
  repo: string;
}

/**
 * Badges Tab Component
 */
export function BadgesTab({ org, repo }: BadgesTabProps) {
  const [rawBaseUrl, setRawBaseUrl] = useState('');
  const [copiedScore, setCopiedScore] = useState(false);
  const [copiedRank, setCopiedRank] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);


  // Get raw base URL on mount
  useEffect(() => {
    const getBaseUrl = async () => {
      try {
        const { getRawBaseUrl } = await import('../../../../api/registry.js');
        setRawBaseUrl(getRawBaseUrl());
      } catch {
        // Fallback
        setRawBaseUrl(
          'https://raw.githubusercontent.com/example/scorecards/catalog'
        );
      }
    };
    getBaseUrl();
  }, []);

  const scoreBadgeUrl = `https://img.shields.io/endpoint?url=${rawBaseUrl}/badges/${org}/${repo}/score.json`;
  const rankBadgeUrl = `https://img.shields.io/endpoint?url=${rawBaseUrl}/badges/${org}/${repo}/rank.json`;

  const scoreBadgeMarkdown = `![Score](${scoreBadgeUrl})`;
  const rankBadgeMarkdown = `![Rank](${rankBadgeUrl})`;

  const handleCopy = useCallback(
    async (text: string, type: 'score' | 'rank', invoker: HTMLButtonElement) => {
      setCopyError(null);
      if (type === 'score') {
        setCopiedScore(false);
      } else {
        setCopiedRank(false);
      }

      if (await copyText(text, invoker)) {
        if (type === 'score') {
          setCopiedScore(true);
          setTimeout(() => setCopiedScore(false), 2000);
        } else {
          setCopiedRank(true);
          setTimeout(() => setCopiedRank(false), 2000);
        }
      } else {
        setCopyError('Unable to copy. Please copy manually.');
      }
    },
    []
  );


  return (
    <div className="tab-panel" id="badges-tab">
      <h4 className="tab-section-header">Badge Preview</h4>
      <div className="badge-preview-container">
        <img src={scoreBadgeUrl} alt="Score Badge" style={{ height: 20 }} />
        <img src={rankBadgeUrl} alt="Rank Badge" style={{ height: 20 }} />
      </div>

      <h4 className="tab-section-header" style={{ marginBottom: 10 }}>
        Add to Your README
      </h4>
      <p className="tab-section-description">Copy the markdown below:</p>
      {copyError && <p role="alert">{copyError}</p>}


      <div style={{ position: 'relative', marginBottom: 15 }}>
        <button
          onClick={(event) => handleCopy(scoreBadgeMarkdown, 'score', event.currentTarget)}

          className={`copy-button ${copiedScore ? 'copied' : ''}`}
        >
          {copiedScore ? 'Copied!' : 'Copy'}
        </button>
        <pre className="badge-code-block">{scoreBadgeMarkdown}</pre>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={(event) => handleCopy(rankBadgeMarkdown, 'rank', event.currentTarget)}

          className={`copy-button ${copiedRank ? 'copied' : ''}`}
        >
          {copiedRank ? 'Copied!' : 'Copy'}
        </button>
        <pre className="badge-code-block">{rankBadgeMarkdown}</pre>
      </div>
    </div>
  );
}

export default BadgesTab;
