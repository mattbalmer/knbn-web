import React, { useState } from 'react';
import { Board, Task } from '../knbn/types';

interface KanbanBoardProps {
  board: Board;
  boardPath?: string;
  onTaskUpdate?: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, boardPath, onTaskUpdate }) => {
  const { configuration, tasks } = board;
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

  const getTasksForColumn = (columnName: string): Task[] => {
    return Object.values(tasks).filter(task => task.column === columnName);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedTask(null);
    setDraggedOver(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, columnName: string) => {
    e.preventDefault();
    setDraggedOver(columnName);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggedOver(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    setDraggedOver(null);

    if (!draggedTask || !boardPath || draggedTask.column === targetColumn) {
      return;
    }

    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          column: targetColumn,
        }),
      });

      if (response.ok) {
        onTaskUpdate?.();
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }

    setDraggedTask(null);
  };

  return (
    <div className="kanban-board">
      <div className="board-columns">
        {configuration.columns.map(column => (
          <div 
            key={column.name} 
            className={`column ${draggedOver === column.name ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, column.name)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.name)}
          >
            <div className="column-header">
              <h3>{column.name}</h3>
              <span className="task-count">
                {getTasksForColumn(column.name).length}
              </span>
            </div>
            
            <div className={`column-tasks ${draggedOver === column.name ? 'drag-over' : ''}`}>
              {getTasksForColumn(column.name).map(task => (
                <div 
                  key={task.id} 
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                >
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