import React from 'react';
import { Board, Task } from '../knbn/types';

interface KanbanBoardProps {
  board: Board;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ board }) => {
  const { configuration, tasks } = board;

  const getTasksForColumn = (columnName: string): Task[] => {
    return Object.values(tasks).filter(task => task.column === columnName);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="kanban-board">
      <div className="board-columns">
        {configuration.columns.map(column => (
          <div key={column.name} className="column">
            <div className="column-header">
              <h3>{column.name}</h3>
              <span className="task-count">
                {getTasksForColumn(column.name).length}
              </span>
            </div>
            
            <div className="column-tasks">
              {getTasksForColumn(column.name).map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h4 className="task-title">{task.title}</h4>
                    <span className="task-id">#{task.id}</span>
                  </div>
                  
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  
                  <div className="task-meta">
                    <div className="task-dates">
                      <span className="created-date">
                        Created: {formatDate(task.dates.created)}
                      </span>
                      {task.dates.updated !== task.dates.created && (
                        <span className="updated-date">
                          Updated: {formatDate(task.dates.updated)}
                        </span>
                      )}
                      {task.dates.moved && (
                        <span className="moved-date">
                          Moved: {formatDate(task.dates.moved)}
                        </span>
                      )}
                    </div>
                    
                    {task.assignee && (
                      <div className="task-assignee">
                        Assigned to: {task.assignee}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;