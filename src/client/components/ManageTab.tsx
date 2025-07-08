import React, { useState } from 'react';
import { Board } from '../knbn/types';
import LabelManagerModal from './LabelManagerModal';

interface ManageTabProps {
  board: Board;
  boardPath: string;
  onBoardUpdate: () => void;
}

const ManageTab: React.FC<ManageTabProps> = ({ board, boardPath, onBoardUpdate }) => {
  const [showLabelManager, setShowLabelManager] = useState(false);

  const handleLabelsUpdated = () => {
    onBoardUpdate();
  };

  const handleCloseLabelManager = () => {
    setShowLabelManager(false);
  };

  return (
    <div className="manage-tab">
      <div className="manage-section">
        <h3>Board Management</h3>
        <div className="manage-actions">
          <button
            className="manage-labels-button"
            onClick={() => setShowLabelManager(true)}
          >
            🏷️ Manage Labels
          </button>
        </div>
      </div>

      <div className="manage-section">
        <h3>Other Settings</h3>
        <div className="tab-placeholder">
          TODO: Additional management features - columns, sprints, board settings
        </div>
      </div>

      {showLabelManager && (
        <LabelManagerModal
          board={board}
          boardPath={boardPath}
          onLabelsUpdated={handleLabelsUpdated}
          onCancel={handleCloseLabelManager}
        />
      )}
    </div>
  );
};

export default ManageTab;