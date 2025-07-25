import React, { useState } from 'react';
import { Board, Task } from '../knbn/types';
import NewTaskForm from './NewTaskForm';

interface KanbanBoardProps {
  board: Board;
  boardPath?: string;
  showBacklog?: boolean;
  onTaskUpdate?: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, boardPath, onTaskUpdate, showBacklog }) => {
  const { tasks } = board;
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  const getTasksForColumn = (columnName: string): Task[] => {
    if (columnName === 'Backlog') {
      return Object.values(tasks).filter(task => !task.column || task.column.toLowerCase() === 'backlog');
    }
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

  const handleNewTaskClick = () => {
    setShowNewTaskForm(true);
  };

  const handleTaskCreated = () => {
    setShowNewTaskForm(false);
    onTaskUpdate?.();
  };

  const handleCancelNewTask = () => {
    setShowNewTaskForm(false);
  };

  const columns = showBacklog ? [{ name: 'Backlog' }, ...(board.columns || [])] : (board.columns || []);

  return (
    <div className="kanban-board">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div></div>
        <button 
          className="new-task-button"
          onClick={handleNewTaskClick}
        >
          + New Task
        </button>
      </div>

      <div className="board-columns">
        {columns.map(column => (
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
                    
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showNewTaskForm && boardPath && (
        <NewTaskForm
          board={board}
          boardPath={boardPath}
          onTaskCreated={handleTaskCreated}
          onCancel={handleCancelNewTask}
        />
      )}
    </div>
  );
};

export default KanbanBoard;