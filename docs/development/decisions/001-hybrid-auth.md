# ADR 001: Hybrid Authentication for Catalog Data Fetching

**Status**: Proposed
**Date**: 2025-01-15
**Deciders**: Engineering Team

## Context

The catalog UI needs to fetch scorecard data from the GitHub repository. We encountered rate limiting issues when using the GitHub API directly:

- GitHub API has a 60 requests/hour limit for unauthenticated requests
- With 8+ services, each page load required 9+ API calls
- Users encountered 403 Forbidden errors after 6-7 page loads per hour
- This severely impacted usability for teams monitoring multiple services

## Decision

Implement a hybrid approach for data fetching that:

1. **Uses `raw.githubusercontent.com` by default** (CDN-based, no rate limits)
2. **Allows optional GitHub PAT** for users who want faster updates (bypasses CDN cache)
3. **Automatically falls back** to CDN mode if API rate limits are exceeded

### Architecture

- **Default Mode (CDN)**: Fetch from raw.githubusercontent.com
  - Pros: No rate limits, works for all users
  - Cons: 3-5 minute CDN cache delay

- **Optional Mode (API)**: Fetch via GitHub API with Personal Access Token
  - Pros: Faster updates (30-60 seconds), 5000 requests/hour
  - Cons: Requires user setup, more complex

### Implementation Components

1. **Settings UI**: Allow users to configure API mode and store PAT in localStorage
2. **Hybrid Fetch Logic**: Choose fetch method based on user preferences
3. **Rate Limit Handling**: Automatic fallback to CDN on rate limit errors
4. **Mode Indicators**: Show current mode in UI

## Consequences

### Positive

- **No rate limits for default users**: Works reliably without configuration
- **Faster updates for power users**: Optional enhancement for teams that need it
- **Graceful degradation**: System remains functional even if API fails
- **User choice**: Users can choose speed vs simplicity trade-off
- **Backwards compatible**: No breaking changes

### Negative

- **More complex codebase**: Two code paths to maintain
- **User education needed**: Advanced users must understand PAT creation
- **Security considerations**: Need to handle PAT storage properly
- **Testing complexity**: Must test both modes and fallback scenarios

## Implementation Details

See the complete implementation plan in this file for:
- Phase 1: Revert to raw.githubusercontent.com (immediate fix)
- Phase 2: Add optional GitHub PAT support with settings UI
- Phase 3: Add UI indicators for current mode
- Phase 4: Styling and polish

## Security

- PAT stored in browser localStorage (client-side only)
- PAT never sent to any server except GitHub
- No scopes required for read-only public repo access
- Users can clear PAT anytime
- Invalid PATs trigger automatic fallback

## Testing

Both modes must be tested:
1. CDN mode (default, no configuration)
2. API mode (with valid PAT)
3. Rate limit scenarios
4. Fallback behavior
5. PAT validation

## Future Optimizations

Consider consolidating registry into a single file (`registry/all-services.json`) to reduce API calls from N+1 to 1, making GitHub API viable even without PAT for small teams.

---

## Original Implementation Plan

[See HYBRID_AUTH_PLAN.md in git history for complete implementation details including code samples, UI mockups, and detailed testing procedures]
