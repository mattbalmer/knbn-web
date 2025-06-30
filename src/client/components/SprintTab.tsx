import React, { useState } from 'react';
import { Board, Task, Sprint } from '../knbn/types';
import KanbanBoard from './KanbanBoard';

interface SprintTabProps {
  board: Board;
  boardPath?: string;
  onTaskUpdate?: () => void;
}

const SprintTab: React.FC<SprintTabProps> = ({ board, boardPath, onTaskUpdate }) => {
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  const sprints = board.sprints || [];
  const tasks = Object.values(board.tasks);

  const getTasksForSprint = (sprintName: string): Record<number, Task> => {
    if (!sprintName) return {};
    
    const filteredTasks = tasks.filter(task => task.sprint === sprintName);
    const taskRecord: Record<number, Task> = {};
    
    filteredTasks.forEach(task => {
      taskRecord[task.id] = task;
    });
    
    return taskRecord;
  };

  const createSprintBoard = (sprintName: string): Board => {
    return {
      ...board,
      tasks: getTasksForSprint(sprintName)
    };
  };

  const handleSprintChange = (sprintName: string) => {
    setSelectedSprint(sprintName);
  };

  if (sprints.length === 0) {
    return (
      <div className="tab-placeholder">
        No sprints found. Create sprints to organize your tasks.
      </div>
    );
  }

  return (
    <div className="sprint-tab">
      <div className="sprint-selector">
        <label htmlFor="sprint-select">Sprint:</label>
        <select 
          id="sprint-select"
          value={selectedSprint} 
          onChange={(e) => handleSprintChange(e.target.value)}
        >
          <option value="">-- Select a sprint --</option>
          {sprints.map((sprint) => (
            <option key={sprint.name} value={sprint.name}>
              {sprint.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSprint ? (
        <div className="sprint-content">
          <div className="sprint-info">
            <h3>{selectedSprint}</h3>
            {sprints.find(s => s.name === selectedSprint)?.description && (
              <p className="sprint-description">
                {sprints.find(s => s.name === selectedSprint)?.description}
              </p>
            )}
          </div>
          
          <KanbanBoard 
            board={createSprintBoard(selectedSprint)}
            boardPath={boardPath}
            onTaskUpdate={onTaskUpdate}
          />
        </div>
      ) : (
        <div className="tab-placeholder">
          Select a sprint to view its tasks
        </div>
      )}
    </div>
  );
};

export default SprintTab;