import React, { useState, useEffect } from 'react';
import { Column } from '../knbn/types';
import { Button } from './common/Button';

interface ColumnEditModalProps {
  column?: Column; // undefined for new column
  boardPath: string;
  onColumnSaved: () => void;
  onCancel: () => void;
}

const ColumnEditModal: React.FC<ColumnEditModalProps> = ({ 
  column, 
  boardPath, 
  onColumnSaved, 
  onCancel 
}) => {
  const [name, setName] = useState(column?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNewColumn = !column;

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
    
    // Prevent creating or renaming to "backlog"
    if (name.toLowerCase() === 'backlog') {
      alert('Cannot use "backlog" as column name - it is reserved for the virtual backlog column.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isNewColumn) {
        // Create new column
        const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/columns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
          }),
        });

        if (response.ok) {
          onColumnSaved();
        } else {
          const error = await response.json();
          alert(`Failed to create column: ${error.error}`);
        }
      } else {
        // Update existing column
        const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/columns/${encodeURIComponent(column.name)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
          }),
        });

        if (response.ok) {
          onColumnSaved();
        } else {
          const error = await response.json();
          alert(`Failed to update column: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving column:', error);
      alert('Failed to save column');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isNewColumn) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete the column "${column.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/columns/${encodeURIComponent(column.name)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onColumnSaved();
      } else {
        const error = await response.json();
        alert(`Failed to delete column: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting column:', error);
      alert('Failed to delete column');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-task-overlay" onClick={handleOverlayClick}>
      <div className="edit-task-modal">
        <div className="modal-header">
          <h3>{isNewColumn ? 'Create New Column' : `Edit Column: ${column.name}`}</h3>
          <Button 
            color="default"
            className="close-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="column-name">Column Name *</label>
            <input
              id="column-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter column name"
              required
              autoFocus
            />
            <small className="form-help">
              Note: "backlog" is reserved for the virtual backlog column
            </small>
          </div>

          <div className="form-actions">
            <div className="form-actions-left">
              {!isNewColumn && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  color="danger"
                  className="btn-delete"
                  disabled={isSubmitting}
                >
                  Delete Column
                </Button>
              )}
            </div>
            <div className="form-actions-right">
              <Button
                type="button"
                onClick={onCancel}
                color="default"
                className="btn-cancel"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                className="btn-save"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Saving...' : (isNewColumn ? 'Create Column' : 'Save Changes')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ColumnEditModal;