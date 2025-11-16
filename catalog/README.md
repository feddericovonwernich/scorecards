# Scorecards Catalog UI

This directory contains the catalog web UI for viewing scorecard results across all repositories.

## Structure

- `index.html` - Main catalog page
- `api-explorer.html` - API exploration interface
- `app.js` - Catalog application logic (will be modularized in Phase 4)
- `styles.css` - Catalog styling

## Development

The catalog is a static web application served via GitHub Pages.

### Local Development

```bash
# Serve locally
python3 -m http.server 8000
# Open http://localhost:8000
```

### Deployment

The catalog is automatically deployed to GitHub Pages from the `catalog` branch.

The workflow `.github/workflows/sync-docs.yml` handles synchronization.

## Architecture

See `docs/architecture/catalog-ui.md` for detailed architecture documentation.

## Future Plans

Phase 4 will modularize `app.js` into separate ES6 modules for better maintainability.
