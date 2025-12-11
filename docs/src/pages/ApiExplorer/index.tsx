import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { ApiExplorer } from './ApiExplorer';

const container = document.getElementById('api-explorer-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ApiExplorer />
    </StrictMode>
  );
}
