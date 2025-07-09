import React, { useState } from 'react';
import { Board, Label, Column, Sprint } from '../knbn/types';
import LabelEditModal from './LabelEditModal';
import ColumnEditModal from './ColumnEditModal';
import SprintEditModal from './SprintEditModal';
import { Button } from './common/Button';

interface ManageTabProps {
  board: Board;
  boardPath: string;
  onBoardUpdate: () => void;
}

const ManageTab: React.FC<ManageTabProps> = ({ board, boardPath, onBoardUpdate }) => {
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [showNewLabelModal, setShowNewLabelModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [showNewSprintModal, setShowNewSprintModal] = useState(false);

  const handleLabelSaved = () => {
    setEditingLabel(null);
    setShowNewLabelModal(false);
    onBoardUpdate();
  };

  const handleCancelLabelEdit = () => {
    setEditingLabel(null);
    setShowNewLabelModal(false);
  };

  const handleLabelClick = (label: Label) => {
    setEditingLabel(label);
  };

  const handleCreateNewLabel = () => {
    setShowNewLabelModal(true);
  };

  const handleColumnSaved = () => {
    setEditingColumn(null);
    setShowNewColumnModal(false);
    onBoardUpdate();
  };

  const handleCancelColumnEdit = () => {
    setEditingColumn(null);
    setShowNewColumnModal(false);
  };

  const handleColumnClick = (column: Column) => {
    setEditingColumn(column);
  };

  const handleCreateNewColumn = () => {
    setShowNewColumnModal(true);
  };

  const handleMoveColumn = async (columnName: string, direction: 'up' | 'down') => {
    const currentIndex = board.columns.findIndex(c => c.name === columnName);
    if (currentIndex === -1) return;
    
    const newPosition = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newPosition < 0 || newPosition >= board.columns.length) return;
    
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/columns/${encodeURIComponent(columnName)}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: newPosition }),
      });

      if (response.ok) {
        onBoardUpdate();
      } else {
        const error = await response.json();
        alert(`Failed to move column: ${error.error}`);
      }
    } catch (error) {
      console.error('Error moving column:', error);
      alert('Failed to move column');
    }
  };

  const handleSprintSaved = () => {
    setEditingSprint(null);
    setShowNewSprintModal(false);
    onBoardUpdate();
  };

  const handleCancelSprintEdit = () => {
    setEditingSprint(null);
    setShowNewSprintModal(false);
  };

  const handleSprintClick = (sprint: Sprint) => {
    setEditingSprint(sprint);
  };

  const handleCreateNewSprint = () => {
    setShowNewSprintModal(true);
  };

  const formatSprintDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getSprintStatus = (sprint: Sprint): 'active' | 'upcoming' | 'completed' => {
    const now = new Date();
    const startDate = sprint.dates?.starts ? new Date(sprint.dates.starts) : null;
    const endDate = sprint.dates?.ends ? new Date(sprint.dates.ends) : null;
    
    if (startDate && endDate) {
      if (now >= startDate && now <= endDate) {
        return 'active';
      } else if (now < startDate) {
        return 'upcoming';
      } else {
        return 'completed';
      }
    } else if (startDate && now >= startDate) {
      return 'active';
    } else if (startDate && now < startDate) {
      return 'upcoming';
    }
    
    return 'upcoming';
  };

  return (
    <div className="manage-tab">
      <div className="manage-section">
        <h3>Columns</h3>
        <div className="columns-section">
          <div className="columns-header">
            <Button
              className="create-column-button"
              onClick={handleCreateNewColumn}
            >
              + Create New Column
            </Button>
          </div>
          
          {board.columns && board.columns.length > 0 ? (
            <div className="columns-list">
              {board.columns.map((column, index) => (
                <div 
                  key={column.name} 
                  className="column-item"
                >
                  <div className="column-info">
                    <span className="column-name">{column.name}</span>
                    <span className="column-position">Position {index + 1}</span>
                  </div>
                  <div className="column-actions">
                    <Button 
                      onClick={() => handleMoveColumn(column.name, 'up')}
                      disabled={index === 0}
                      className="btn-move"
                      title="Move up"
                    >
                      ↑
                    </Button>
                    <Button 
                      onClick={() => handleMoveColumn(column.name, 'down')}
                      disabled={index === board.columns.length - 1}
                      className="btn-move"
                      title="Move down"
                    >
                      ↓
                    </Button>
                    <Button 
                      onClick={() => handleColumnClick(column)}
                      className="btn-edit"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-columns-message">
              <p>No columns created yet. Click "Create New Column" to get started.</p>
            </div>
          )}
        </div>
      </div>

      <div className="manage-section">
        <h3>Labels</h3>
        <div className="labels-section">
          <div className="labels-header">
            <Button
              className="create-label-button"
              onClick={handleCreateNewLabel}
            >
              + Create New Label
            </Button>
          </div>
          
          {board.labels && board.labels.length > 0 ? (
            <div className="labels-grid">
              {board.labels.map((label) => (
                <div 
                  key={label.name} 
                  className="label-card"
                  onClick={() => handleLabelClick(label)}
                >
                  <span 
                    className="label-preview"
                    style={{ backgroundColor: label.color || '#6c757d' }}
                  >
                    {label.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-labels-message">
              <p>No labels created yet. Click "Create New Label" to get started.</p>
            </div>
          )}
        </div>
      </div>

      <div className="manage-section">
        <h3>Sprints</h3>
        <div className="sprints-section">
          <div className="sprints-header">
            <Button
              className="create-sprint-button"
              onClick={handleCreateNewSprint}
            >
              + Create New Sprint
            </Button>
          </div>
          
          {board.sprints && board.sprints.length > 0 ? (
            <div className="sprints-list">
              {board.sprints.map((sprint) => {
                const status = getSprintStatus(sprint);
                return (
                  <div 
                    key={sprint.name} 
                    className={`sprint-item sprint-${status}`}
                    onClick={() => handleSprintClick(sprint)}
                  >
                    <div className="sprint-info">
                      <div className="sprint-header">
                        <span className="sprint-name">{sprint.name}</span>
                        <span className={`sprint-status sprint-status-${status}`}>
                          {status}
                        </span>
                      </div>
                      {sprint.description && (
                        <div className="sprint-description">{sprint.description}</div>
                      )}
                      <div className="sprint-details">
                        {sprint.dates?.starts && (
                          <span className="sprint-date">
                            Start: {formatSprintDate(sprint.dates.starts)}
                          </span>
                        )}
                        {sprint.dates?.ends && (
                          <span className="sprint-date">
                            End: {formatSprintDate(sprint.dates.ends)}
                          </span>
                        )}
                        {sprint.capacity && (
                          <span className="sprint-capacity">
                            Capacity: {sprint.capacity} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-sprints-message">
              <p>No sprints created yet. Click "Create New Sprint" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {(editingLabel || showNewLabelModal) && (
        <LabelEditModal
          label={editingLabel || undefined}
          boardPath={boardPath}
          onLabelSaved={handleLabelSaved}
          onCancel={handleCancelLabelEdit}
        />
      )}

      {(editingColumn || showNewColumnModal) && (
        <ColumnEditModal
          column={editingColumn || undefined}
          boardPath={boardPath}
          onColumnSaved={handleColumnSaved}
          onCancel={handleCancelColumnEdit}
        />
      )}

      {(editingSprint || showNewSprintModal) && (
        <SprintEditModal
          sprint={editingSprint || undefined}
          boardPath={boardPath}
          onSprintSaved={handleSprintSaved}
          onCancel={handleCancelSprintEdit}
        />
      )}
    </div>
  );
};

export default ManageTab;