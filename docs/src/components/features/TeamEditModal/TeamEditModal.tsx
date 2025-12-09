/**
 * TeamEditModal Component
 * Modal for creating and editing team metadata
 * Replaces vanilla JS ui/team-edit-modal.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../ui/Modal.js';
import { Toast } from '../../ui/Toast.js';
import { useAppStore, selectPAT } from '../../../stores/appStore.js';
import { loadTeamById, getRepoOwner, getRepoName } from '../../../api/registry.js';
import { API_CONFIG } from '../../../config/constants.js';
import { cn } from '../../../utils/css.js';

interface TeamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  teamId?: string;
  onSave?: (teamId: string, isCreate: boolean) => void;
}

interface TeamFormData {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  slack_channel: string;
  oncall_rotation: string;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const generateTeamId = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export function TeamEditModal({
  isOpen,
  onClose,
  mode,
  teamId,
  onSave,
}: TeamEditModalProps) {
  const pat = useAppStore(selectPAT);

  const [formData, setFormData] = useState<TeamFormData>({
    id: '',
    name: '',
    description: '',
    aliases: [],
    slack_channel: '',
    oncall_rotation: '',
  });
  const [aliasInput, setAliasInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load team data when editing
  useEffect(() => {
    if (isOpen && mode === 'edit' && teamId && pat) {
      setLoading(true);
      loadTeamById(teamId)
        .then((team) => {
          if (team) {
            setFormData({
              id: (team.id as string) || teamId,
              name: (team.name as string) || '',
              description: (team.description as string) || '',
              aliases: (team.aliases as string[]) || [],
              slack_channel: ((team.metadata as Record<string, unknown>)?.slack_channel as string) || '',
              oncall_rotation: ((team.metadata as Record<string, unknown>)?.oncall_rotation as string) || '',
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load team:', err);
          setToast({ message: 'Failed to load team data', type: 'error' });
        })
        .finally(() => setLoading(false));
    } else if (isOpen && mode === 'create') {
      setFormData({
        id: '',
        name: '',
        description: '',
        aliases: [],
        slack_channel: '',
        oncall_rotation: '',
      });
    }
  }, [isOpen, mode, teamId, pat]);

  const showToast = (message: string, type: ToastMessage['type']) => {
    setToast({ message, type });
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      id: mode === 'create' ? generateTeamId(name) : prev.id,
    }));
  };

  const handleAddAlias = () => {
    const alias = aliasInput.trim();
    if (alias && !formData.aliases.includes(alias)) {
      setFormData((prev) => ({
        ...prev,
        aliases: [...prev.aliases, alias],
      }));
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      aliases: prev.aliases.filter((a) => a !== aliasToRemove),
    }));
  };

  const handleAliasKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAlias();
    }
  };

  const handleSave = useCallback(async () => {
    if (!pat) {
      showToast('GitHub PAT required. Please configure in Settings.', 'error');
      return;
    }

    if (!formData.name.trim()) {
      showToast('Team name is required', 'error');
      return;
    }

    setSaving(true);
    showToast('Triggering workflow...', 'info');

    try {
      // Trigger GitHub workflow dispatch
      const workflowInputs = {
        team_id: formData.id,
        action: mode === 'create' ? 'create' : 'update',
        name: formData.name,
        description: formData.description || '',
        aliases: formData.aliases.join(','),
        slack_channel: formData.slack_channel || '',
        oncall_rotation: formData.oncall_rotation || '',
      };

      const response = await fetch(
        `${API_CONFIG.GITHUB_BASE_URL}/repos/${getRepoOwner()}/${getRepoName()}/actions/workflows/update-team-registry.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `token ${pat}`,
            Accept: API_CONFIG.ACCEPT_HEADER,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main',
            inputs: workflowInputs,
          }),
        }
      );

      if (response.ok || response.status === 204) {
        showToast(
          mode === 'create'
            ? 'Team creation workflow triggered! Changes will appear shortly.'
            : 'Team update workflow triggered! Changes will appear shortly.',
          'success'
        );
        onSave?.(formData.id, mode === 'create');
        setTimeout(() => onClose(), 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message ||
            `Failed with status ${response.status}`
        );
      }
    } catch (error) {
      console.error('Failed to save team:', error);
      showToast(
        `Failed to save: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  }, [pat, formData, mode, onSave, onClose]);

  if (!pat && isOpen) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} contentClassName="max-w-md">
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-text mb-4">PAT Required</h2>
          <p className="text-text-muted mb-4">
            A GitHub Personal Access Token is required to {mode === 'create' ? 'create' : 'edit'} teams.
          </p>
          <button
            onClick={() => {
              onClose();
              useAppStore.getState().openModal('settings');
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
          >
            Configure Token
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        contentClassName="team-edit-modal max-w-lg"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-text mb-6">
            {mode === 'create' ? 'Create Team' : 'Edit Team'}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-text-muted">Loading team data...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Team Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg',
                    'bg-surface border border-border',
                    'text-text placeholder:text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-accent'
                  )}
                  placeholder="e.g., Platform Team"
                />
              </div>

              {/* ID (auto-generated or editable in edit mode) */}
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Team ID
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
                  disabled={mode === 'edit'}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg font-mono text-sm',
                    'bg-surface border border-border',
                    'text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-accent',
                    mode === 'edit' && 'opacity-50 cursor-not-allowed'
                  )}
                  placeholder="auto-generated-from-name"
                />
                {mode === 'create' && (
                  <p className="text-xs text-text-muted mt-1">Auto-generated from name</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg resize-none',
                    'bg-surface border border-border',
                    'text-text placeholder:text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-accent'
                  )}
                  placeholder="Brief description of the team"
                />
              </div>

              {/* Aliases */}
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Aliases
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyDown={handleAliasKeyDown}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg',
                      'bg-surface border border-border',
                      'text-text placeholder:text-text-muted',
                      'focus:outline-none focus:ring-2 focus:ring-accent'
                    )}
                    placeholder="Add alias and press Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddAlias}
                    className="px-3 py-2 bg-surface-secondary border border-border rounded-lg hover:bg-surface text-text"
                  >
                    Add
                  </button>
                </div>
                {formData.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-surface-secondary rounded text-sm text-text"
                      >
                        {alias}
                        <button
                          type="button"
                          onClick={() => handleRemoveAlias(alias)}
                          className="text-text-muted hover:text-error"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Slack Channel */}
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Slack Channel
                </label>
                <input
                  type="text"
                  value={formData.slack_channel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slack_channel: e.target.value }))}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg',
                    'bg-surface border border-border',
                    'text-text placeholder:text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-accent'
                  )}
                  placeholder="#team-channel"
                />
              </div>

              {/* Oncall Rotation */}
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Oncall Rotation URL
                </label>
                <input
                  type="text"
                  value={formData.oncall_rotation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, oncall_rotation: e.target.value }))}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg',
                    'bg-surface border border-border',
                    'text-text placeholder:text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-accent'
                  )}
                  placeholder="https://pagerduty.com/..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={onClose}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg',
                    'border border-border',
                    'text-text font-medium',
                    'hover:bg-surface-secondary transition-colors'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.name.trim()}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg',
                    'bg-accent text-white font-medium',
                    'hover:opacity-90 transition-opacity',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Team' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}

export default TeamEditModal;
