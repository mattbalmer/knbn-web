import React from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created: string;
  updated: string;
  assignee?: string;
  completed?: string;
}

interface Column {
  name: string;
}

interface Board {
  configuration: {
    name: string;
    description?: string;
    columns: Column[];
  };
  tasks: Record<string, Task>;
  metadata: {
    nextId: number;
    createdAt: string;
    lastModified: string;
    version: string;
  };
}

interface KanbanBoardProps {
  board: Board;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ board }) => {
  const { configuration, tasks } = board;

  const getTasksForColumn = (columnName: string): Task[] => {
    return Object.values(tasks).filter(task => task.status === columnName);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="kanban-board">
      <div className="board-header">
        <h2>{configuration.name}</h2>
        {configuration.description && (
          <p className="board-description">{configuration.description}</p>
        )}
      </div>
      
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
                        Created: {formatDate(task.created)}
                      </span>
                      {task.updated !== task.created && (
                        <span className="updated-date">
                          Updated: {formatDate(task.updated)}
                        </span>
                      )}
                      {task.completed && (
                        <span className="completed-date">
                          Completed: {formatDate(task.completed)}
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