import React, { useState } from 'react';
import { Board, Label } from '../knbn/types';
import LabelEditModal from './LabelEditModal';

interface ManageTabProps {
  board: Board;
  boardPath: string;
  onBoardUpdate: () => void;
}

const ManageTab: React.FC<ManageTabProps> = ({ board, boardPath, onBoardUpdate }) => {
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [showNewLabelModal, setShowNewLabelModal] = useState(false);

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

  return (
    <div className="manage-tab">
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
    </div>
  );
};

export default ManageTab;