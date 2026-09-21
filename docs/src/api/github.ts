/**
 * GitHub API Client
 * Functions for interacting with GitHub's REST API
 */
import { getToken, clearToken } from '../services/auth.js';
import { getRepoOwner, getRepoName } from './registry.js';
import { API_CONFIG, REMEDIATION_DISCOVERY } from '../config/constants.js';
import { DEPLOYMENT } from '../config/deployment.js';
import { WORKFLOWS, getWorkflowDispatchUrl } from '../config/workflows.js';
import type {
  DispatchReceipt,
  GitHubUser,
  RemediationPullRequest,
  RemediationRequest,
  WorkflowRun,
  RateLimitInfo,
} from '../types/index.js';

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

interface RepositoryResponse {
  default_branch?: string;
}

interface DispatchResponse {
  workflow_run_id?: number | string;
  html_url?: string;
  run_url?: string;
}

interface PullRequestResponse {
  number?: number;
  html_url?: string;
  body?: string;
  base?: { ref?: string };
  head?: { ref?: string; repo?: { full_name?: string } | null };
  user?: { login?: string };
}

export interface FetchWorkflowRunsOptions {
  per_page?: number;
}

export interface RemediationDispatchOptions {
  signal?: AbortSignal;
  onProgress?: (message: string) => void;
}

interface WorkflowMetadata {
  id: number;
  path: string;
}

interface PolicyResponse {
  content?: string;
  encoding?: string;
}

interface RemediationPolicy {
  targets?: Record<string, { publisher_login?: string }>;
}

function isGitHubUrl(value: unknown, path: string, origin = 'https://github.com'): value is string {
  if (typeof value !== 'string') {return false;}
  try {
    const url = new URL(value);
    const segments = url.pathname.split('/');
    const expected = path.split('/');
    const repositoryIndex = origin === 'https://api.github.com' ? 2 : 1;
    return url.origin === origin
      && !url.search && !url.hash && !url.username && !url.password
      && segments.length === expected.length
      && segments.every((segment, index) =>
        index === repositoryIndex || index === repositoryIndex + 1
          ? segment.toLowerCase() === expected[index].toLowerCase()
          : segment === expected[index]
      );
  } catch {
    return false;
  }
}

async function responseMessage(response: Response): Promise<string | undefined> {
  const body = await response.json().catch(() => null) as { message?: unknown } | null;
  return typeof body?.message === 'string' ? body.message : undefined;
}

function errorReceipt(response: Response, message?: string): DispatchReceipt {
  return {
    accepted: false,
    status: response.status,
    reason: message || response.statusText || `GitHub request failed (${response.status})`,
  };
}

function receiptFromDispatchBody(data: unknown, org: string, repo: string): DispatchReceipt {
  if (!data || typeof data !== 'object') {
    return { accepted: false, status: 200, reason: 'GitHub returned an invalid workflow dispatch receipt' };
  }
  const receipt = data as DispatchResponse;
  const runId = receipt.workflow_run_id;
  if ((typeof runId !== 'number' && typeof runId !== 'string') || !/^[1-9]\d*$/.test(String(runId))) {
    return { accepted: false, status: 200, reason: 'GitHub returned an invalid workflow dispatch receipt' };
  }
  const id = String(runId);
  const apiPath = `/repos/${org}/${repo}/actions/runs/${id}`;
  const htmlPath = `/${org}/${repo}/actions/runs/${id}`;
  if (!isGitHubUrl(receipt.run_url, apiPath, 'https://api.github.com') || !isGitHubUrl(receipt.html_url, htmlPath)) {
    return { accepted: false, status: 200, reason: 'GitHub returned an invalid workflow dispatch receipt' };
  }
  return { accepted: true, runId: id, runUrl: receipt.html_url };
}

async function defaultBranch(org: string, repo: string): Promise<string | null> {
  const response = await githubApiRequest(`/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo)}`);
  if (!response.ok) {
    if (response.status === 401) {clearToken();}
    return null;
  }
  const data = await response.json() as RepositoryResponse;
  return typeof data.default_branch === 'string' && data.default_branch ? data.default_branch : null;
}

async function getRemediationWorkflow(): Promise<WorkflowMetadata | null> {
  const response = await githubApiRequest(
    `/repos/${encodeURIComponent(getRepoOwner())}/${encodeURIComponent(getRepoName())}/actions/workflows/${encodeURIComponent(WORKFLOWS.files.remediateCheck)}`
  );
  if (!response.ok) {
    if (response.status === 401) {clearToken();}
    return null;
  }
  const workflow = await response.json() as WorkflowMetadata;
  return typeof workflow.id === 'number'
    && workflow.path === `.github/workflows/${WORKFLOWS.files.remediateCheck}`
    ? workflow
    : null;
}

async function waitForDiscovery(signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) {return false;}
  return new Promise<boolean>((resolve) => {
    const onAbort = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(true);
    }, REMEDIATION_DISCOVERY.interval);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function correlateRemediationRun(
  request: RemediationRequest,
  workflow: WorkflowMetadata,
  requestedAt: number,
  options: RemediationDispatchOptions
): Promise<{ runId?: string; runUrl?: string; reason?: string }> {
  const scorecardOrg = getRepoOwner();
  const scorecardRepo = getRepoName();
  const title = `remediation:${request.request_id}`;
  const cutoff = new Date(requestedAt - REMEDIATION_DISCOVERY.interval).toISOString();
  const deadline = requestedAt + REMEDIATION_DISCOVERY.timeout;

  do {
    if (options.signal?.aborted) {return { reason: 'Remediation discovery cancelled' };}
    const matches: WorkflowRun[] = [];
    for (let page = 1; page <= REMEDIATION_DISCOVERY.maxPages; page += 1) {
      const query = new URLSearchParams({
        event: 'workflow_dispatch',
        per_page: String(REMEDIATION_DISCOVERY.perPage),
        page: String(page),
      });
      const response = await githubApiRequest(
        `/repos/${encodeURIComponent(scorecardOrg)}/${encodeURIComponent(scorecardRepo)}/actions/workflows/${encodeURIComponent(WORKFLOWS.files.remediateCheck)}/runs?${query}`,
        { signal: options.signal }
      );
      if (!response.ok) {
        if (response.status === 401) {clearToken();}
        return { reason: 'Dispatch accepted; unable to locate its workflow run' };
      }
      const data = await response.json() as WorkflowRunsResponse;
      matches.push(...data.workflow_runs.filter((run) =>
        Number.isSafeInteger(run.id)
        && run.id > 0
        && run.workflow_id === workflow.id
        && run.event === 'workflow_dispatch'
        && run.display_title === title
        && run.created_at >= cutoff
      ));
      if (data.workflow_runs.length < REMEDIATION_DISCOVERY.perPage) {break;}
    }
    if (matches.length === 1) {
      const [run] = matches;
      const path = `/${scorecardOrg}/${scorecardRepo}/actions/runs/${run.id}`;
      return {
        runId: String(run.id),
        runUrl: isGitHubUrl(run.html_url, path) ? run.html_url : undefined,
      };
    }
    if (matches.length > 1) {
      return { reason: 'Dispatch accepted; more than one matching remediation run was found' };
    }
    options.onProgress?.('Dispatch accepted; waiting for the remediation run to appear.');
  } while (Date.now() < deadline && await waitForDiscovery(options.signal));

  return { reason: options.signal?.aborted
    ? 'Remediation discovery cancelled'
    : 'Dispatch accepted; the remediation run is still being located' };
}

async function verifyRemediationRun(
  request: RemediationRequest,
  receipt: DispatchReceipt,
  workflow: WorkflowMetadata,
  signal?: AbortSignal
): Promise<DispatchReceipt> {
  if (!receipt.accepted || !receipt.runId) {return receipt;}
  const scorecardOrg = getRepoOwner();
  const scorecardRepo = getRepoName();
  const response = await githubApiRequest(
    `/repos/${encodeURIComponent(scorecardOrg)}/${encodeURIComponent(scorecardRepo)}/actions/runs/${receipt.runId}`,
    { signal }
  );
  if (!response.ok) {
    if (response.status === 401) {clearToken();}
    return { accepted: true, reason: 'Dispatch accepted; the remediation run is still being located' };
  }
  const run = await response.json() as WorkflowRun;
  const expectedPath = `/${scorecardOrg}/${scorecardRepo}/actions/runs/${receipt.runId}`;
  if (
    String(run.id) !== receipt.runId
    || run.workflow_id !== workflow.id
    || run.event !== 'workflow_dispatch'
    || run.display_title !== `remediation:${request.request_id}`
    || !isGitHubUrl(run.html_url, expectedPath)
  ) {
    return { accepted: true, reason: 'Dispatch accepted; its workflow run could not be safely attributed' };
  }
  return { accepted: true, runId: receipt.runId, runUrl: run.html_url };
}

/**
 * Make a GitHub API request.
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
    headers.Authorization = `token ${token}`;
  }
  return fetch(`${API_CONFIG.GITHUB_BASE_URL}${endpoint}`, { ...options, headers });
}

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

export async function fetchWorkflowRuns(
  org: string,
  repo: string,
  options: FetchWorkflowRunsOptions = {}
): Promise<WorkflowRun[]> {
  const perPage = options.per_page || API_CONFIG.PER_PAGE;
  const endpoint = `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo)}/actions/runs?per_page=${perPage}&_t=${Date.now()}`;
  const response = await githubApiRequest(endpoint, { cache: 'no-cache' });
  if (!response.ok) {
    if (response.status === 401) {clearToken();}
    throw new Error(`Failed to fetch workflow runs: ${response.status}`);
  }
  const data: WorkflowRunsResponse = await response.json();
  return data.workflow_runs.map((run) => ({ ...run, org, repo }));
}

/**
 * Trigger a workflow dispatch event. GitHub accepts either a validated 200
 * receipt or a 204 response without a receipt.
 */
export async function triggerWorkflowDispatch(
  org: string,
  repo: string,
  workflow: string,
  inputs: Record<string, string> = {},
  ref = 'main'
): Promise<DispatchReceipt> {
  const token = getToken();
  if (!token) {
    return { accepted: false, reason: 'GitHub token required to trigger workflows' };
  }
  try {
    const response = await fetch(getWorkflowDispatchUrl(org, repo, workflow), {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': DEPLOYMENT.api.version,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref, inputs }),
    });
    if (response.status === 204) {
      return { accepted: true };
    }
    if (response.status === 200) {
      return receiptFromDispatchBody(await response.json().catch(() => null), org, repo);
    }
    if (response.status === 401) {clearToken();}
    return errorReceipt(response, await responseMessage(response));
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return {
      accepted: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function triggerCheckRemediation(
  request: RemediationRequest,
  options: RemediationDispatchOptions = {}
): Promise<DispatchReceipt> {
  if (!getToken()) {
    return { accepted: false, reason: 'GitHub token required to trigger workflows' };
  }
  if (
    !/^[a-f\d]{40}$/i.test(request.service_sha)
    || !/^[a-f\d]{40}$/i.test(request.suite_sha)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.request_id)
  ) {
    return { accepted: false, reason: 'Invalid remediation request' };
  }
  const scorecardOrg = getRepoOwner();
  const scorecardRepo = getRepoName();
  const [ref, workflow] = await Promise.all([
    defaultBranch(scorecardOrg, scorecardRepo),
    getRemediationWorkflow(),
  ]);
  if (!ref || !workflow) {
    return { accepted: false, reason: 'Unable to resolve the trusted Scorecards workflow' };
  }
  const requestedAt = Date.now();
  const receipt = await triggerWorkflowDispatch(
    scorecardOrg,
    scorecardRepo,
    WORKFLOWS.files.remediateCheck,
    {
      org: request.org,
      repo: request.repo,
      check_id: request.check_id,
      service_sha: request.service_sha,
      suite_sha: request.suite_sha,
      request_id: request.request_id,
    },
    ref
  );
  if (!receipt.accepted) {
    return receipt.status === undefined
      ? { accepted: true, reason: 'Dispatch outcome is uncertain; no retry was sent. Check Actions before requesting again.' }
      : receipt;
  }
  try {
    return receipt.runId
      ? await verifyRemediationRun(request, receipt, workflow, options.signal)
      : { accepted: true, ...await correlateRemediationRun(request, workflow, requestedAt, options) };
  } catch {
    return { accepted: true, reason: 'Dispatch accepted; unable to locate its workflow run' };
  }
}

async function remediationPublisher(
  request: RemediationRequest,
  runId: string,
  signal?: AbortSignal
): Promise<string | null> {
  const workflow = await getRemediationWorkflow();
  if (!workflow) {return null;}
  const scorecardOrg = getRepoOwner();
  const scorecardRepo = getRepoName();
  const runResponse = await githubApiRequest(
    `/repos/${encodeURIComponent(scorecardOrg)}/${encodeURIComponent(scorecardRepo)}/actions/runs/${runId}`,
    { signal }
  );
  if (!runResponse.ok) {
    if (runResponse.status === 401) {clearToken();}
    return null;
  }
  const run = await runResponse.json() as WorkflowRun;
  const expectedPath = `/${scorecardOrg}/${scorecardRepo}/actions/runs/${runId}`;
  if (
    String(run.id) !== runId
    || run.workflow_id !== workflow.id
    || run.event !== 'workflow_dispatch'
    || run.display_title !== `remediation:${request.request_id}`
    || !run.head_sha
    || !/^[a-f\d]{40}$/i.test(run.head_sha)
    || !isGitHubUrl(run.html_url, expectedPath)
  ) {
    return null;
  }
  const path = 'action/config/remediation.json';
  const policyResponse = await githubApiRequest(
    `/repos/${encodeURIComponent(scorecardOrg)}/${encodeURIComponent(scorecardRepo)}/contents/${path}?ref=${run.head_sha}`,
    { signal }
  );
  if (!policyResponse.ok) {
    if (policyResponse.status === 401) {clearToken();}
    return null;
  }
  const content = await policyResponse.json() as PolicyResponse;
  if (content.encoding !== 'base64' || typeof content.content !== 'string') {return null;}
  try {
    const policy = JSON.parse(atob(content.content.replace(/\s/g, ''))) as RemediationPolicy;
    const publisher = policy.targets?.[`${request.org}/${request.repo}`.toLowerCase()]?.publisher_login;
    return typeof publisher === 'string' && publisher ? publisher : null;
  } catch {
    return null;
  }
}

export async function findRemediationPullRequest(
  request: RemediationRequest,
  runId: string,
  signal?: AbortSignal
): Promise<RemediationPullRequest | null> {
  const [branch, publisher] = await Promise.all([
    defaultBranch(request.org, request.repo),
    remediationPublisher(request, runId, signal),
  ]);
  if (!branch || !publisher) {return null;}
  const marker = `<!-- scorecards-remediation:v1 check_id=${request.check_id} -->`;
  const prefix = `scorecards-remediation/${request.check_id}/`;
  const repository = `${request.org}/${request.repo}`.toLowerCase();
  const candidates: PullRequestResponse[] = [];
  for (let page = 1; page <= REMEDIATION_DISCOVERY.maxPages; page += 1) {
    const response = await githubApiRequest(
      `/repos/${encodeURIComponent(request.org)}/${encodeURIComponent(request.repo)}/pulls?${new URLSearchParams({
        state: 'open',
        base: branch,
        per_page: String(REMEDIATION_DISCOVERY.perPage),
        page: String(page),
      })}`,
      { signal }
    );
    if (!response.ok) {
      if (response.status === 401) {clearToken();}
      return null;
    }
    const pulls = await response.json() as PullRequestResponse[];
    candidates.push(...pulls.filter((candidate) =>
      candidate.body?.includes(marker)
      && candidate.base?.ref === branch
      && candidate.head?.ref?.startsWith(prefix)
      && candidate.head.repo?.full_name?.toLowerCase() === repository
      && candidate.user?.login?.toLowerCase() === publisher.toLowerCase()
      && typeof candidate.number === 'number'
      && isGitHubUrl(candidate.html_url, `/${request.org}/${request.repo}/pull/${candidate.number}`)
    ));
    if (pulls.length < REMEDIATION_DISCOVERY.perPage) {break;}
    if (page === REMEDIATION_DISCOVERY.maxPages) {return null;}
  }
  return candidates.length === 1 && candidates[0].number && candidates[0].html_url
    ? { number: candidates[0].number, url: candidates[0].html_url }
    : null;
}

export async function triggerScorecardWorkflow(org: string, repo: string): Promise<boolean> {
  const receipt = await triggerWorkflowDispatch(
    getRepoOwner(), getRepoName(), WORKFLOWS.files.triggerService, { org, repo }
  );
  return receipt.accepted;
}

export interface ServiceIdentifier {
  org: string;
  repo: string;
}

export async function triggerBulkScorecardWorkflows(
  services: ServiceIdentifier[]
): Promise<boolean> {
  const receipt = await triggerWorkflowDispatch(
    getRepoOwner(),
    getRepoName(),
    WORKFLOWS.files.triggerService,
    { services: JSON.stringify(services.map((service) => ({ org: service.org, repo: service.repo }))) }
  );
  return receipt.accepted;
}

export async function createInstallationPR(org: string, repo: string): Promise<boolean> {
  const receipt = await triggerWorkflowDispatch(
    getRepoOwner(), getRepoName(), WORKFLOWS.files.createInstallPR, { org, repo }
  );
  return receipt.accepted;
}

export async function getUserInfo(): Promise<GitHubUser> {
  const response = await githubApiRequest('/user');
  if (!response.ok) {
    if (response.status === 401) {clearToken();}
    throw new Error('Failed to fetch user info');
  }
  return response.json();
}
