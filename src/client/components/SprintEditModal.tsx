import React, { useState, useEffect } from 'react';
import { Sprint } from '../knbn/types';

interface SprintEditModalProps {
  sprint?: Sprint; // undefined for new sprint
  boardPath: string;
  onSprintSaved: () => void;
  onCancel: () => void;
}

const SprintEditModal: React.FC<SprintEditModalProps> = ({ 
  sprint, 
  boardPath, 
  onSprintSaved, 
  onCancel 
}) => {
  const [name, setName] = useState(sprint?.name || '');
  const [description, setDescription] = useState(sprint?.description || '');
  const [capacity, setCapacity] = useState(sprint?.capacity?.toString() || '');
  const [starts, setStarts] = useState(sprint?.dates?.starts ? sprint.dates.starts.split('T')[0] : '');
  const [ends, setEnds] = useState(sprint?.dates?.ends ? sprint.dates.ends.split('T')[0] : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNewSprint = !sprint;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const sprintData = {
        name: name.trim(),
        description: description.trim() || undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        starts: starts ? new Date(starts).toISOString() : undefined,
        ends: ends ? new Date(ends).toISOString() : undefined,
      };

      if (isNewSprint) {
        // Create new sprint
        const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/sprints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sprintData),
        });

        if (response.ok) {
          onSprintSaved();
        } else {
          const error = await response.json();
          alert(`Failed to create sprint: ${error.error}`);
        }
      } else {
        // Update existing sprint
        const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/sprints/${encodeURIComponent(sprint.name)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sprintData),
        });

        if (response.ok) {
          onSprintSaved();
        } else {
          const error = await response.json();
          alert(`Failed to update sprint: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving sprint:', error);
      alert('Failed to save sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isNewSprint) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete the sprint "${sprint.name}"? This will remove the sprint assignment from all tasks.`);
    if (!confirmed) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/sprints/${encodeURIComponent(sprint.name)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSprintSaved();
      } else {
        const error = await response.json();
        alert(`Failed to delete sprint: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting sprint:', error);
      alert('Failed to delete sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="edit-task-overlay" onClick={handleOverlayClick}>
      <div className="edit-task-modal">
        <div className="modal-header">
          <h3>{isNewSprint ? 'Create New Sprint' : `Edit Sprint: ${sprint.name}`}</h3>
          <button 
            className="close-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sprint-name">Sprint Name *</label>
            <input
              id="sprint-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sprint name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="sprint-description">Description</label>
            <textarea
              id="sprint-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter sprint description (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sprint-capacity">Capacity</label>
              <input
                id="sprint-capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Story points capacity"
                min="0"
                max="1000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sprint-starts">Start Date</label>
              <input
                id="sprint-starts"
                type="date"
                value={starts}
                onChange={(e) => setStarts(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sprint-ends">End Date</label>
              <input
                id="sprint-ends"
                type="date"
                value={ends}
                onChange={(e) => setEnds(e.target.value)}
                min={starts} // End date can't be before start date
              />
            </div>
          </div>

          {!isNewSprint && sprint.dates?.created && (
            <div className="task-meta-info">
              <p>Created: {formatDate(sprint.dates.created)}</p>
            </div>
          )}

          <div className="form-actions">
            <div className="form-actions-left">
              {!isNewSprint && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-delete"
                  disabled={isSubmitting}
                >
                  Delete Sprint
                </button>
              )}
            </div>
            <div className="form-actions-right">
              <button
                type="button"
                onClick={onCancel}
                className="btn-cancel"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Saving...' : (isNewSprint ? 'Create Sprint' : 'Save Changes')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SprintEditModal;