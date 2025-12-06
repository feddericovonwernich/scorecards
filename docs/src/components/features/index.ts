/**
 * Feature Components Index
 *
 * Export feature-specific components (service cards, team cards, etc.)
 */

export { ServiceCard, ServiceGrid } from './ServiceCard.js';
export { TeamCard, TeamGrid } from './TeamCard.js';

// Modals
export { ServiceModal } from './ServiceModal/index.js';
export type { ServiceModalProps } from './ServiceModal/index.js';

export { TeamModal } from './TeamModal/index.js';
export type { TeamModalProps } from './TeamModal/index.js';

export { CheckFilterModal } from './CheckFilterModal/index.js';
export type { CheckFilterModalProps } from './CheckFilterModal/index.js';

// New modals (Wave 2)
export { SettingsModal } from './SettingsModal/index.js';
export { ActionsWidget } from './ActionsWidget/index.js';
export { TeamDashboard } from './TeamDashboard/index.js';
export { TeamEditModal } from './TeamEditModal/index.js';
export { CheckAdoptionDashboard } from './CheckAdoptionDashboard/index.js';
export { TeamFilterDropdown, TeamFilterDropdownPortal } from './TeamFilterDropdown.js';
export { CheckFilterToggle, CheckFilterTogglePortal } from './CheckFilterToggle.js';
