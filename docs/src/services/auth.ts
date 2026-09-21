/**
 * Authentication and Token Management
 * Handles GitHub Personal Access Token (PAT) storage and validation
 */
import { useAppStore } from '../stores/appStore.js';


// In-memory PAT storage (not persisted to localStorage for security)
let githubPAT: string | null = null;

/**
 * Get the currently stored GitHub token
 */
export function getToken(): string | null {
  return githubPAT;
}

/**
 * Check if a GitHub token is currently set
 */
export function hasToken(): boolean {
  return !!githubPAT;
}

/**
 * Set the GitHub token
 */
export function setToken(token: string | null): void {
  githubPAT = token ? token.trim() : null;
}

/**
 * Clear the stored GitHub token
 */
export function clearToken(): void {
  githubPAT = null;
  const store = useAppStore.getState();
  store.setAuth(null, false);
  store.setAuthUser(null);
}

/**
 * Test if a PAT is valid by making a request to GitHub API
 */
export async function validateToken(pat: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error validating PAT:', error);
    return false;
  }
}

/**
 * Validate and save a GitHub token
 */
export async function validateAndSaveToken(token: string): Promise<boolean> {
  if (!token || !token.trim()) {
    return false;
  }

  const isValid = await validateToken(token.trim());

  if (isValid) {
    setToken(token.trim());
    return true;
  }

  return false;
}

/**
 * Get token for authorization headers
 */
export function getTokenForAuth(): string | null {
  return getToken();
}
