import React, { useState, useEffect } from 'react';
import { Label } from '../knbn/types';
import { Button } from './common/Button';

interface LabelEditModalProps {
  label?: Label; // undefined for new label
  boardPath: string;
  onLabelSaved: () => void;
  onCancel: () => void;
}

const LabelEditModal: React.FC<LabelEditModalProps> = ({ 
  label, 
  boardPath, 
  onLabelSaved, 
  onCancel 
}) => {
  const [name, setName] = useState(label?.name || '');
  const [color, setColor] = useState(label?.color || '#6c757d');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNewLabel = !label;

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
      if (isNewLabel) {
        // Create new label
        const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            color: color,
          }),
        });

        if (response.ok) {
          onLabelSaved();
        } else {
          const error = await response.json();
          alert(`Failed to create label: ${error.error}`);
        }
      } else {
        // Update existing label
        const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/labels/${encodeURIComponent(label.name)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            color: color,
          }),
        });

        if (response.ok) {
          onLabelSaved();
        } else {
          const error = await response.json();
          alert(`Failed to update label: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving label:', error);
      alert('Failed to save label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isNewLabel) return;
    
    const confirmed = window.confirm(`Are you sure you want to remove the label "${label.name}"?`);
    if (!confirmed) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/labels/${encodeURIComponent(label.name)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onLabelSaved();
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

  return (
    <div className="edit-task-overlay" onClick={handleOverlayClick}>
      <div className="edit-task-modal">
        <div className="modal-header">
          <h3>{isNewLabel ? 'Create New Label' : `Edit Label: ${label.name}`}</h3>
          <Button 
            className="close-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="label-name">Name *</label>
            <input
              id="label-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter label name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="label-color">Color</label>
            <div className="color-input-container">
              <input
                id="label-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-input"
              />
              <span 
                className="color-preview"
                style={{ backgroundColor: color }}
              >
                {name || 'Label preview'}
              </span>
            </div>
          </div>

          <div className="form-actions">
            <div className="form-actions-left">
              {!isNewLabel && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  className="btn-delete"
                  disabled={isSubmitting}
                >
                  Delete Label
                </Button>
              )}
            </div>
            <div className="form-actions-right">
              <Button
                type="button"
                onClick={onCancel}
                className="btn-cancel"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-save"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Saving...' : (isNewLabel ? 'Create Label' : 'Save Changes')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabelEditModal;