/**
 * Modal Orchestrator
 * Centralized modal state management and rendering
 */

import { useState, useCallback, useEffect } from 'react';
import { ServiceModal } from './ServiceModal/index.js';
import { TeamModal } from './TeamModal/index.js';
import { CheckFilterModal } from './CheckFilterModal/index.js';
import { SettingsModal } from './SettingsModal/index.js';
import { ActionsWidget } from './ActionsWidget/index.js';
import { TeamDashboard } from './TeamDashboard/index.js';
import { TeamEditModal } from './TeamEditModal/index.js';
import { CheckAdoptionDashboard } from './CheckAdoptionDashboard/index.js';
import { useAppStore } from '../../stores/appStore.js';
import type { CheckFilter } from '../../types/index.js';

export function ModalOrchestrator() {
  const toggleActionsWidget = useAppStore((state) => state.toggleActionsWidget);

  // Modal states
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [teamDashboardOpen, setTeamDashboardOpen] = useState(false);
  const [checkAdoptionOpen, setCheckAdoptionOpen] = useState(false);
  const [teamEditModalOpen, setTeamEditModalOpen] = useState(false);
  const [teamEditMode, setTeamEditMode] = useState<'create' | 'edit'>('create');
  const [teamEditId, setTeamEditId] = useState<string | undefined>(undefined);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceModalOrg, setServiceModalOrg] = useState<string | null>(null);
  const [serviceModalRepo, setServiceModalRepo] = useState<string | null>(null);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamModalName, setTeamModalName] = useState<string | null>(null);

  const [checkFilterModalOpen, setCheckFilterModalOpen] = useState(false);
  const [checkFilters, setCheckFilters] = useState<Map<string, CheckFilter>>(
    new Map()
  );

  // Modal handlers
  const openServiceModal = useCallback((org: string, repo: string) => {
    setServiceModalOrg(org);
    setServiceModalRepo(repo);
    setServiceModalOpen(true);
  }, []);

  const closeServiceModal = useCallback(() => {
    setServiceModalOpen(false);
  }, []);

  const openTeamModal = useCallback((teamName: string) => {
    setTeamModalName(teamName);
    setTeamModalOpen(true);
  }, []);

  const closeTeamModal = useCallback(() => {
    setTeamModalOpen(false);
  }, []);

  const openCheckFilterModal = useCallback(() => {
    setCheckFilterModalOpen(true);
  }, []);

  const closeCheckFilterModal = useCallback(() => {
    setCheckFilterModalOpen(false);
  }, []);

  const handleCheckFiltersChange = useCallback(
    (filters: Map<string, CheckFilter>) => {
      setCheckFilters(filters);
      window.dispatchEvent(
        new CustomEvent('check-filters-changed', { detail: { filters } })
      );
    },
    []
  );

  const openSettingsModal = useCallback(() => {
    setSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setSettingsModalOpen(false);
  }, []);

  const openTeamDashboard = useCallback(() => {
    setTeamDashboardOpen(true);
  }, []);

  const closeTeamDashboard = useCallback(() => {
    setTeamDashboardOpen(false);
  }, []);

  const openCheckAdoptionDashboard = useCallback(() => {
    setCheckAdoptionOpen(true);
  }, []);

  const closeCheckAdoptionDashboard = useCallback(() => {
    setCheckAdoptionOpen(false);
  }, []);

  const openTeamEditModal = useCallback((mode: 'create' | 'edit', teamId?: string) => {
    setTeamEditMode(mode);
    setTeamEditId(teamId);
    setTeamEditModalOpen(true);
  }, []);

  const closeTeamEditModal = useCallback(() => {
    setTeamEditModalOpen(false);
  }, []);

  const handleTeamEditSave = useCallback((_teamId: string, _isCreate: boolean) => {
    // Refresh team data after save
  }, []);

  // Listen for check filter modal open events
  useEffect(() => {
    const handleOpenCheckFilterModal = () => {
      setCheckFilterModalOpen(true);
    };
    window.addEventListener('open-check-filter-modal', handleOpenCheckFilterModal);

    return () => {
      window.removeEventListener('open-check-filter-modal', handleOpenCheckFilterModal);
    };
  }, []);

  // Expose modal functions to window for vanilla JS bridge
  useEffect(() => {
    const originalShowServiceDetail = window.showServiceDetail;
    const originalShowTeamDetail = window.showTeamDetail;
    const originalShowTeamModal = window.showTeamModal;
    const originalOpenCheckFilterModal = window.openCheckFilterModal;
    const originalCloseModal = window.closeModal;
    const originalCloseTeamModal = window.closeTeamModal;
    const originalOpenSettings = window.openSettings;
    const originalToggleActionsWidget = window.toggleActionsWidget;
    const originalOpenTeamDashboard = window.openTeamDashboard;
    const originalOpenTeamEditModal = window.openTeamEditModal;
    const originalOpenCheckAdoptionDashboard = window.openCheckAdoptionDashboard;

    window.showServiceDetail = async (org: string, repo: string) => {
      openServiceModal(org, repo);
    };

    window.showTeamDetail = async (teamName: string) => {
      openTeamModal(teamName);
    };

    window.showTeamModal = async (teamName: string) => {
      openTeamModal(teamName);
    };

    window.openCheckFilterModal = () => {
      openCheckFilterModal();
    };

    window.closeModal = () => {
      closeServiceModal();
    };

    window.closeTeamModal = () => {
      closeTeamModal();
    };

    window.openSettings = () => {
      openSettingsModal();
    };

    window.toggleActionsWidget = () => {
      toggleActionsWidget();
    };

    window.openTeamDashboard = () => {
      openTeamDashboard();
    };

    window.openTeamEditModal = (mode?: 'create' | 'edit', teamId?: string) => {
      openTeamEditModal(mode || 'create', teamId);
    };

    window.openCheckAdoptionDashboard = () => {
      openCheckAdoptionDashboard();
    };

    return () => {
      window.showServiceDetail = originalShowServiceDetail;
      window.showTeamDetail = originalShowTeamDetail;
      window.showTeamModal = originalShowTeamModal;
      window.openCheckFilterModal = originalOpenCheckFilterModal;
      window.closeModal = originalCloseModal;
      window.closeTeamModal = originalCloseTeamModal;
      window.openSettings = originalOpenSettings;
      window.toggleActionsWidget = originalToggleActionsWidget;
      window.openTeamDashboard = originalOpenTeamDashboard;
      window.openTeamEditModal = originalOpenTeamEditModal;
      window.openCheckAdoptionDashboard = originalOpenCheckAdoptionDashboard;
    };
  }, [
    openServiceModal,
    closeServiceModal,
    openTeamModal,
    closeTeamModal,
    openCheckFilterModal,
    openSettingsModal,
    toggleActionsWidget,
    openTeamDashboard,
    openTeamEditModal,
    openCheckAdoptionDashboard,
  ]);

  const services = useAppStore.getState().services.all || [];

  return (
    <>
      {/* Service Modal */}
      <ServiceModal
        isOpen={serviceModalOpen}
        onClose={closeServiceModal}
        org={serviceModalOrg}
        repo={serviceModalRepo}
      />

      {/* Team Modal */}
      <TeamModal
        isOpen={teamModalOpen}
        onClose={closeTeamModal}
        teamName={teamModalName}
      />

      {/* Check Filter Modal */}
      <CheckFilterModal
        isOpen={checkFilterModalOpen}
        onClose={closeCheckFilterModal}
        filters={checkFilters}
        onFiltersChange={handleCheckFiltersChange}
        services={services}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={closeSettingsModal}
      />

      {/* Actions Widget (sidebar) */}
      <ActionsWidget />

      {/* Team Dashboard Modal */}
      <TeamDashboard
        isOpen={teamDashboardOpen}
        onClose={closeTeamDashboard}
        onCreateTeam={() => openTeamEditModal('create')}
        onEditTeam={(teamId) => openTeamEditModal('edit', teamId)}
      />

      {/* Team Edit Modal */}
      <TeamEditModal
        isOpen={teamEditModalOpen}
        onClose={closeTeamEditModal}
        mode={teamEditMode}
        teamId={teamEditId}
        onSave={handleTeamEditSave}
      />

      {/* Check Adoption Dashboard Modal */}
      <CheckAdoptionDashboard
        isOpen={checkAdoptionOpen}
        onClose={closeCheckAdoptionDashboard}
      />
    </>
  );
}
