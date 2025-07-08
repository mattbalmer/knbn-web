import React, { useState } from 'react';
import { Board, Label, Column } from '../knbn/types';
import LabelEditModal from './LabelEditModal';
import ColumnEditModal from './ColumnEditModal';

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

  return (
    <div className="manage-tab">
      <div className="manage-section">
        <h3>Columns</h3>
        <div className="columns-section">
          <div className="columns-header">
            <button
              className="create-column-button"
              onClick={handleCreateNewColumn}
            >
              + Create New Column
            </button>
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
                    <button 
                      onClick={() => handleMoveColumn(column.name, 'up')}
                      disabled={index === 0}
                      className="btn-move"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => handleMoveColumn(column.name, 'down')}
                      disabled={index === board.columns.length - 1}
                      className="btn-move"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => handleColumnClick(column)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
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
            <button
              className="create-label-button"
              onClick={handleCreateNewLabel}
            >
              + Create New Label
            </button>
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
        <h3>Other Settings</h3>
        <div className="tab-placeholder">
          TODO: Additional management features - columns, sprints, board settings
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
    </div>
  );
};

export default ManageTab;