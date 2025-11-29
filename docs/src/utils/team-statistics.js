/**
 * Team Statistics Utilities
 * Functions for calculating and managing team statistics from services
 */

import { RANKS } from '../config/constants.js';
import { countByRank, calculateAverageScore } from './statistics.js';

/**
 * Get team name from service (handles both string and object formats)
 * @param {Object} service - Service object
 * @returns {string|null} Primary team name or null
 */
export function getTeamName(service) {
    if (!service.team) return null;
    if (typeof service.team === 'string') return service.team;
    return service.team.primary || service.team.all?.[0] || null;
}

/**
 * Get all team names from service
 * @param {Object} service - Service object
 * @returns {Array<string>} Array of team names
 */
export function getAllTeams(service) {
    if (!service.team) return [];
    if (typeof service.team === 'string') return [service.team];
    return service.team.all || (service.team.primary ? [service.team.primary] : []);
}

/**
 * Get unique teams from services array
 * @param {Array<Object>} services - Array of service objects
 * @returns {Array<string>} Sorted array of unique team names
 */
export function getUniqueTeams(services) {
    const teams = new Set();
    services.forEach(service => {
        const team = getTeamName(service);
        if (team) teams.add(team);
    });
    return Array.from(teams).sort((a, b) => a.localeCompare(b));
}

/**
 * Get team count from services
 * @param {Array<Object>} services - Array of service objects
 * @returns {number} Number of unique teams
 */
export function getTeamCount(services) {
    return getUniqueTeams(services).length;
}

/**
 * Calculate statistics for a single team
 * @param {Array<Object>} services - Services belonging to this team
 * @param {Function} isStaleCheck - Function to check staleness
 * @param {string} checksHash - Current checks hash
 * @returns {Object} Team statistics
 */
export function calculateSingleTeamStats(services, isStaleCheck, checksHash) {
    return {
        serviceCount: services.length,
        averageScore: calculateAverageScore(services),
        rankDistribution: countByRank(services),
        staleCount: isStaleCheck ? services.filter(s => isStaleCheck(s, checksHash)).length : 0,
        installedCount: services.filter(s => s.installed).length,
    };
}

/**
 * Calculate statistics for all teams
 * @param {Array<Object>} services - All services
 * @param {Function} isStaleCheck - Function to check staleness
 * @param {string} checksHash - Current checks hash
 * @returns {Object} Map of team name to statistics
 */
export function calculateTeamStats(services, isStaleCheck, checksHash) {
    const teamServices = {};
    const teamGitHubInfo = {};

    // Group services by primary team
    services.forEach(service => {
        const team = getTeamName(service);
        if (!team) return;

        if (!teamServices[team]) {
            teamServices[team] = [];
            // Extract GitHub info from first service with this team
            if (service.team && typeof service.team === 'object') {
                teamGitHubInfo[team] = {
                    github_org: service.team.github_org || null,
                    github_slug: service.team.github_slug || null,
                };
            }
        }
        teamServices[team].push(service);
    });

    // Calculate stats for each team
    const teamStats = {};
    Object.entries(teamServices).forEach(([team, services]) => {
        teamStats[team] = {
            name: team,
            ...calculateSingleTeamStats(services, isStaleCheck, checksHash),
            // Include GitHub linking info
            github_org: teamGitHubInfo[team]?.github_org || null,
            github_slug: teamGitHubInfo[team]?.github_slug || null,
        };
    });

    return teamStats;
}

/**
 * Sort team statistics by various criteria
 * @param {Object} teamStats - Map of team name to statistics
 * @param {string} sortBy - Sort criteria: 'name', 'serviceCount', 'averageScore'
 * @param {string} direction - Sort direction: 'asc' or 'desc'
 * @returns {Array<Object>} Sorted array of team statistics
 */
export function sortTeamStats(teamStats, sortBy = 'serviceCount', direction = 'desc') {
    const teams = Object.values(teamStats);

    const sortFunctions = {
        name: (a, b) => a.name.localeCompare(b.name),
        serviceCount: (a, b) => a.serviceCount - b.serviceCount,
        averageScore: (a, b) => a.averageScore - b.averageScore,
        staleCount: (a, b) => a.staleCount - b.staleCount,
    };

    const sortFn = sortFunctions[sortBy] || sortFunctions.serviceCount;
    const multiplier = direction === 'asc' ? 1 : -1;

    return teams.sort((a, b) => sortFn(a, b) * multiplier);
}

/**
 * Get services for a specific team
 * @param {Array<Object>} services - All services
 * @param {string} teamName - Team name to filter by
 * @returns {Array<Object>} Services belonging to the team
 */
export function getServicesForTeam(services, teamName) {
    return services.filter(service => {
        const teams = getAllTeams(service);
        return teams.includes(teamName);
    });
}

/**
 * Get services without a team assigned
 * @param {Array<Object>} services - All services
 * @returns {Array<Object>} Services without a team
 */
export function getServicesWithoutTeam(services) {
    return services.filter(service => !getTeamName(service));
}

/**
 * Merge team data from all-teams.json with calculated statistics
 * @param {Object} teamsData - Data from all-teams.json
 * @param {Object} calculatedStats - Statistics calculated from services
 * @returns {Object} Merged team data with fresh statistics
 */
export function mergeTeamDataWithStats(teamsData, calculatedStats) {
    const merged = {};

    // Start with teams from the teams.json file
    if (teamsData && teamsData.teams) {
        Object.entries(teamsData.teams).forEach(([teamId, teamData]) => {
            const teamName = teamData.name || teamId;
            const stats = calculatedStats[teamName] || {
                serviceCount: 0,
                averageScore: 0,
                rankDistribution: {},
                staleCount: 0,
                installedCount: 0,
            };

            merged[teamId] = {
                id: teamId,
                name: teamName,
                description: teamData.description,
                aliases: teamData.aliases || [],
                metadata: teamData.metadata || {},
                statistics: stats,
            };
        });
    }

    // Add any teams found in services but not in teams.json
    Object.entries(calculatedStats).forEach(([teamName, stats]) => {
        const teamId = teamName.toLowerCase().replace(/\s+/g, '-');
        if (!merged[teamId]) {
            merged[teamId] = {
                id: teamId,
                name: teamName,
                description: null,
                aliases: [],
                metadata: {},
                statistics: stats,
            };
        }
    });

    return merged;
}

/**
 * Build rank distribution summary string
 * @param {Object} rankDistribution - { platinum: n, gold: n, silver: n, bronze: n }
 * @returns {string} Summary like "2 Platinum, 5 Gold, 3 Silver"
 */
export function buildRankSummary(rankDistribution) {
    if (!rankDistribution) return '';

    const parts = [];
    RANKS.forEach(rank => {
        const count = rankDistribution[rank] || 0;
        if (count > 0) {
            parts.push(`${count} ${rank.charAt(0).toUpperCase() + rank.slice(1)}`);
        }
    });

    return parts.join(', ');
}

/**
 * Get dominant rank for a team based on majority of services
 * @param {Object} team - Team object with rankDistribution
 * @returns {string} Dominant rank ('platinum', 'gold', 'silver', or 'bronze')
 */
export function getDominantRank(team) {
    if (!team.rankDistribution) return 'bronze';
    const dist = team.rankDistribution;
    const max = Math.max(dist.platinum || 0, dist.gold || 0, dist.silver || 0, dist.bronze || 0);
    if (max === 0) return 'bronze';
    if ((dist.platinum || 0) === max) return 'platinum';
    if ((dist.gold || 0) === max) return 'gold';
    if ((dist.silver || 0) === max) return 'silver';
    return 'bronze';
}
