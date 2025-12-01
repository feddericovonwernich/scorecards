/**
 * @file JSDoc type definitions for the scorecards application
 * These types enable IDE support and type checking via jsconfig.json
 */

// ============= Configuration Types =============

/**
 * @typedef {Object} DeploymentConfig
 * @property {string} repoOwner - GitHub repository owner
 * @property {string} repoName - GitHub repository name
 * @property {string} catalogBranch - Branch containing catalog data
 * @property {{devServer: number, testServer: number}} ports - Server ports
 * @property {{githubBase: string, version: string, acceptHeader: string}} api - API settings
 * @property {{botName: string, botEmail: string}} git - Git bot settings
 */

/**
 * @typedef {Object} RankConfig
 * @property {number} threshold - Minimum score for this rank
 * @property {string} color - Badge color
 * @property {string} label - Display label
 */

/**
 * @typedef {Object} ScoringConfig
 * @property {{platinum: RankConfig, gold: RankConfig, silver: RankConfig, bronze: RankConfig}} ranks
 * @property {{score: Object<string, {threshold: number, color: string}>}} colors
 * @property {{checkWeight: number, qualityThreshold: number}} defaults
 */

/**
 * @typedef {Object} WorkflowConfig
 * @property {{triggerService: string, createInstallPR: string, scorecard: string}} files
 * @property {{default: number, min: number, max: number}} polling
 */

// ============= Data Types =============

/**
 * @typedef {Object} TeamInfo
 * @property {string} primary - Primary team name
 * @property {string[]} all - All team names
 * @property {string} source - Source of team info (CODEOWNERS, config, etc.)
 */

/**
 * @typedef {Object} CheckResult
 * @property {string} id - Check identifier (e.g., "01-readme")
 * @property {string} name - Human-readable check name
 * @property {boolean} passed - Whether the check passed
 * @property {string} status - Status string (passed, failed, skipped, error)
 * @property {string} message - Result message
 * @property {number} weight - Check weight for scoring
 * @property {string} [details] - Additional details (JSON string or text)
 * @property {string} [category] - Check category
 */

/**
 * @typedef {Object} InstallationPR
 * @property {number} number - PR number
 * @property {string} url - PR URL
 * @property {string} status - PR status (open, merged, closed)
 */

/**
 * @typedef {Object} ServiceData
 * @property {string} org - Organization name
 * @property {string} repo - Repository name
 * @property {string} name - Service display name
 * @property {number} score - Overall score (0-100)
 * @property {string} rank - Rank (platinum, gold, silver, bronze)
 * @property {string} rank_color - Badge color for rank
 * @property {string} score_color - Badge color for score
 * @property {TeamInfo|null} team - Team information
 * @property {CheckResult[]} checks - Check results
 * @property {string} last_updated - ISO timestamp
 * @property {string} default_branch - Default git branch
 * @property {InstallationPR} [installation_pr] - Installation PR info
 */

/**
 * @typedef {Object} RegistryEntry
 * @property {string} org
 * @property {string} repo
 * @property {string} name
 * @property {number} score
 * @property {string} rank
 * @property {TeamInfo|null} team
 * @property {string} last_updated
 */

// ============= UI State Types =============

/**
 * @typedef {Object} FilterState
 * @property {Map<string, Set<string>>} active - Active filters by category
 * @property {string} search - Search query
 * @property {string} sort - Sort order
 */

/**
 * @typedef {Object} AuthState
 * @property {string|null} pat - GitHub Personal Access Token
 * @property {boolean} validated - Whether token is validated
 */

/**
 * @typedef {Object} UIState
 * @property {string|null} currentModal - Currently open modal ID
 * @property {string|null} checksHash - Hash of current checks data
 */

/**
 * @typedef {Object} ServicesState
 * @property {ServiceData[]} all - All services
 * @property {ServiceData[]} filtered - Filtered services
 * @property {boolean} loading - Loading state
 */

/**
 * @typedef {Object} AppState
 * @property {ServicesState} services
 * @property {FilterState} filters
 * @property {AuthState} auth
 * @property {UIState} ui
 */

// ============= API Types =============

/**
 * @typedef {Object} FetchResult
 * @property {Response} response - Fetch response
 * @property {boolean} usedAPI - Whether API was used (vs raw URL)
 */

/**
 * @typedef {Object} WorkflowRun
 * @property {number} id - Run ID
 * @property {string} name - Workflow name
 * @property {string} status - Run status
 * @property {string} conclusion - Run conclusion
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Update timestamp
 * @property {string} html_url - URL to view run
 */

export {};
