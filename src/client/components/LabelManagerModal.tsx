import React, { useState, useEffect } from 'react';
import { Board, Label } from '../knbn/types';

interface LabelManagerModalProps {
  board: Board;
  boardPath: string;
  onLabelsUpdated: () => void;
  onCancel: () => void;
}

const LabelManagerModal: React.FC<LabelManagerModalProps> = ({ 
  board, 
  boardPath, 
  onLabelsUpdated, 
  onCancel 
}) => {
  const [labels, setLabels] = useState<Label[]>(board.labels || []);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6c757d');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLabels(board.labels || []);
  }, [board.labels]);

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

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLabelName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: newLabelColor,
        }),
      });

      if (response.ok) {
        const newLabel = await response.json();
        setLabels([...labels, newLabel]);
        setNewLabelName('');
        setNewLabelColor('#6c757d');
        onLabelsUpdated();
      } else {
        const error = await response.json();
        alert(`Failed to add label: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding label:', error);
      alert('Failed to add label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLabel = (label: Label) => {
    setEditingLabel(label);
    setEditName(label.name);
    setEditColor(label.color || '#6c757d');
  };

  const handleUpdateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingLabel || !editName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/labels/${encodeURIComponent(editingLabel.name)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          color: editColor,
        }),
      });

      if (response.ok) {
        const updatedLabel = await response.json();
        setLabels(labels.map(l => l.name === editingLabel.name ? updatedLabel : l));
        setEditingLabel(null);
        setEditName('');
        setEditColor('');
        onLabelsUpdated();
      } else {
        const error = await response.json();
        alert(`Failed to update label: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating label:', error);
      alert('Failed to update label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLabel = async (labelName: string) => {
    const confirmed = window.confirm(`Are you sure you want to remove the label "${labelName}"?`);
    if (!confirmed) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/labels/${encodeURIComponent(labelName)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLabels(labels.filter(l => l.name !== labelName));
        onLabelsUpdated();
      } else {
        const error = await response.json();
        alert(`Failed to remove label: ${error.error}`);
      }
    } catch (error) {
      console.error('Error removing label:', error);
      alert('Failed to remove label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingLabel(null);
    setEditName('');
    setEditColor('');
  };

  return (
    <div className="edit-task-overlay" onClick={handleOverlayClick}>
      <div className="edit-task-modal">
        <div className="modal-header">
          <h3>Manage Labels</h3>
          <button 
            className="close-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>
        
        <div className="label-manager-content">
          {/* Add New Label Form */}
          <form onSubmit={handleAddLabel} className="add-label-form">
            <h4>Add New Label</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="new-label-name">Name *</label>
                <input
                  id="new-label-name"
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Enter label name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-label-color">Color</label>
                <input
                  id="new-label-color"
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                />
              </div>
              <div className="form-group">
                <button
                  type="submit"
                  className="btn-create"
                  disabled={isSubmitting || !newLabelName.trim()}
                >
                  Add Label
                </button>
              </div>
            </div>
          </form>

          {/* Labels List */}
          <div className="labels-list">
            <h4>Existing Labels</h4>
            {labels.length === 0 ? (
              <p className="no-labels">No labels created yet.</p>
            ) : (
              <div className="labels-grid">
                {labels.map((label) => (
                  <div key={label.name} className="label-item">
                    {editingLabel?.name === label.name ? (
                      <form onSubmit={handleUpdateLabel} className="edit-label-form">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                        />
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit} className="btn-cancel">
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="label-display">
                        <span 
                          className="label-preview"
                          style={{ backgroundColor: label.color || '#6c757d' }}
                        >
                          {label.name}
                        </span>
                        <div className="label-actions">
                          <button 
                            onClick={() => handleEditLabel(label)}
                            className="btn-edit"
                            disabled={isSubmitting}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleRemoveLabel(label.name)}
                            className="btn-delete"
                            disabled={isSubmitting}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <div className="form-actions-right">
            <button
              type="button"
              onClick={onCancel}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelManagerModal;