import React, { useState } from 'react';
import { Board, Task, Sprint } from '../knbn/types';
import KanbanBoard from './KanbanBoard';

interface SprintTabProps {
  board: Board;
  boardPath?: string;
  onTaskUpdate?: () => void;
}

const SprintTab: React.FC<SprintTabProps> = ({ board, boardPath, onTaskUpdate }) => {
  const [selectedSprint, setSelectedSprint] = useState<string>('no-sprint');

  const sprints = board.sprints || [];
  const tasks = Object.values(board.tasks);

  const getTasksForSprint = (sprintName: string): Record<number, Task> => {
    if (!sprintName) return {};
    
    let filteredTasks: Task[];
    if (sprintName === 'no-sprint') {
      filteredTasks = tasks.filter(task => !task.sprint || task.sprint === '');
    } else {
      filteredTasks = tasks.filter(task => task.sprint === sprintName);
    }
    
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

  // Always show the sprint tab even if no sprints exist, so users can see unassigned tasks

  return (
    <div className="sprint-tab">
      <div className="sprint-header">
        <div className="sprint-selector">
          <label htmlFor="sprint-select">Sprint:</label>
          <select 
            id="sprint-select"
            value={selectedSprint} 
            onChange={(e) => handleSprintChange(e.target.value)}
          >
            <option value="no-sprint">No Sprint</option>
            {sprints.map((sprint) => (
              <option key={sprint.name} value={sprint.name}>
                {sprint.name}
              </option>
            ))}
          </select>
        </div>

        <p className="sprint-description">
          {selectedSprint !== 'no-sprint'
            ? <>{sprints.find(s => s.name === selectedSprint)?.description}</>
            : <>Tasks that are not assigned to any sprint</>
          }
        </p>
      </div>

      {selectedSprint && (
        <div className="sprint-content">
          <KanbanBoard 
            board={createSprintBoard(selectedSprint)}
            boardPath={boardPath}
            onTaskUpdate={onTaskUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default SprintTab;