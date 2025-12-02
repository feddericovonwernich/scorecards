/**
 * GitHub Teams API
 * Functions for fetching GitHub team information
 */

import { githubApiRequest } from './github.js';
import { getToken } from '../services/auth.js';

export interface TeamMember {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

interface GitHubMemberResponse {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

// In-memory cache for team members (cleared on page refresh)
const membersCache = new Map<string, TeamMember[]>();

/**
 * Fetch GitHub team members
 */
export async function fetchTeamMembers(
  org: string,
  teamSlug: string
): Promise<TeamMember[] | null> {
  const token = getToken();

  if (!token) {
    return null; // Not authenticated
  }

  // Check cache first
  const cacheKey = `${org}/${teamSlug}`;
  if (membersCache.has(cacheKey)) {
    return membersCache.get(cacheKey)!;
  }

  try {
    const response = await githubApiRequest(
      `/orgs/${org}/teams/${teamSlug}/members`
    );

    if (!response.ok) {
      // Team not found or no access
      console.warn(
        `Failed to fetch team members for ${org}/${teamSlug}: ${response.status}`
      );
      return [];
    }

    const members: GitHubMemberResponse[] = await response.json();
    const result: TeamMember[] = members.map((m) => ({
      login: m.login,
      id: m.id,
      avatar_url: m.avatar_url,
      html_url: m.html_url,
    }));

    // Cache the result
    membersCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error(
      `Error fetching team members for ${org}/${teamSlug}:`,
      error
    );
    return [];
  }
}

/**
 * Get GitHub team URL
 */
export function getTeamUrl(org: string, teamSlug: string): string {
  return `https://github.com/orgs/${org}/teams/${teamSlug}`;
}

/**
 * Clear the members cache (useful for testing or force refresh)
 */
export function clearMembersCache(): void {
  membersCache.clear();
}
