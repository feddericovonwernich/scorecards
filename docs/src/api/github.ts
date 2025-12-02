/**
 * GitHub API Client
 * Functions for interacting with GitHub's REST API
 */

import { getToken } from '../services/auth.js';
import { getRepoOwner, getRepoName } from './registry.js';
import { API_CONFIG } from '../config/constants.js';
import type { WorkflowRun, RateLimitInfo, GitHubUser } from '../types/index.js';

interface WorkflowRunsResponse {
  workflow_runs: WorkflowRun[];
  total_count: number;
}

interface RateLimitResponse {
  rate: {
    remaining: number;
    limit: number;
    reset: number;
  };
}

export interface FetchWorkflowRunsOptions {
  per_page?: number;
}

/**
 * Make a GitHub API request
 */
export async function githubApiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const headers: Record<string, string> = {
    Accept: API_CONFIG.ACCEPT_HEADER,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(`${API_CONFIG.GITHUB_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Check GitHub API rate limit
 */
export async function checkRateLimit(): Promise<RateLimitInfo> {
  try {
    const response = await githubApiRequest('/rate_limit');
    const data: RateLimitResponse = await response.json();

    return {
      remaining: data.rate.remaining,
      limit: data.rate.limit,
      reset: new Date(data.rate.reset * 1000),
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return {
      remaining: null,
      limit: null,
      reset: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fetch workflow runs for a repository
 */
export async function fetchWorkflowRuns(
  org: string,
  repo: string,
  options: FetchWorkflowRunsOptions = {}
): Promise<WorkflowRun[]> {
  const perPage = options.per_page || API_CONFIG.PER_PAGE;
  const endpoint = `/repos/${org}/${repo}/actions/runs?per_page=${perPage}&_t=${Date.now()}`;

  try {
    const response = await githubApiRequest(endpoint, {
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow runs: ${response.status}`);
    }

    const data: WorkflowRunsResponse = await response.json();

    // Add org/repo metadata to each run
    return data.workflow_runs.map((run) => ({
      ...run,
      org,
      repo,
    }));
  } catch (error) {
    console.error(`Error fetching workflow runs for ${org}/${repo}:`, error);
    throw error;
  }
}

/**
 * Trigger a workflow dispatch event
 */
export async function triggerWorkflowDispatch(
  org: string,
  repo: string,
  workflow: string,
  inputs: Record<string, string> = {},
  ref = 'main'
): Promise<boolean> {
  const token = getToken();

  if (!token) {
    throw new Error('GitHub token required to trigger workflows');
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${org}/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref,
          inputs,
        }),
      }
    );

    // GitHub returns 204 No Content on success
    return response.status === 204;
  } catch (error) {
    console.error('Error triggering workflow:', error);
    throw error;
  }
}

/**
 * Trigger scorecard workflow for a service
 */
export async function triggerScorecardWorkflow(
  org: string,
  repo: string
): Promise<boolean> {
  const scorecardOrg = getRepoOwner();
  const scorecardRepo = getRepoName();

  return triggerWorkflowDispatch(
    scorecardOrg,
    scorecardRepo,
    'trigger-service-workflow.yml',
    { org, repo }
  );
}

export interface ServiceIdentifier {
  org: string;
  repo: string;
}

/**
 * Trigger scorecards for multiple services (bulk operation)
 */
export async function triggerBulkScorecardWorkflows(
  services: ServiceIdentifier[]
): Promise<boolean> {
  const scorecardOrg = getRepoOwner();
  const scorecardRepo = getRepoName();

  const servicesArray = services.map((s) => ({ org: s.org, repo: s.repo }));

  return triggerWorkflowDispatch(
    scorecardOrg,
    scorecardRepo,
    'trigger-service-workflow.yml',
    { services: JSON.stringify(servicesArray) }
  );
}

/**
 * Create installation PR for a service
 */
export async function createInstallationPR(
  org: string,
  repo: string
): Promise<boolean> {
  const scorecardOrg = getRepoOwner();
  const scorecardRepo = getRepoName();

  return triggerWorkflowDispatch(
    scorecardOrg,
    scorecardRepo,
    'create-installation-pr.yml',
    { org, repo }
  );
}

/**
 * Get user information from GitHub
 */
export async function getUserInfo(): Promise<GitHubUser> {
  const response = await githubApiRequest('/user');

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return response.json();
}
