import React, { useState } from 'react';
import { Board, Task } from '../knbn/types';
import NewTaskForm from './NewTaskForm';
import EditTaskModal from './EditTaskModal';

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
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const getTasksForColumn = (columnName: string): Task[] => {
    if (columnName.toLowerCase() === 'backlog') {
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

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditTaskComplete = () => {
    setEditingTask(null);
    onTaskUpdate?.();
  };

  const handleEditTaskCancel = () => {
    setEditingTask(null);
  };

  const handleTaskDelete = () => {
    setEditingTask(null);
    onTaskUpdate?.();
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
                  onClick={() => handleTaskClick(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="task-header">
                    <h4 className="task-title">{task.title}</h4>
                    <span className="task-id">#{task.id}</span>
                  </div>
                  
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  
                  <div className="task-meta">
                    <div className="task-info-row">
                      {task.priority && (
                        <span className="task-priority">
                          Priority: {task.priority}
                        </span>
                      )}
                      {task.storyPoints && (
                        <span className="task-story-points">
                          {task.storyPoints} pts
                        </span>
                      )}
                    </div>
                    
                    {task.labels && task.labels.length > 0 && (
                      <div className="task-labels">
                        {task.labels.map((labelName, index) => {
                          const labelColor = board.labels?.find(l => l.name === labelName)?.color;
                          return (
                            <span 
                              key={index} 
                              className="task-label"
                              style={labelColor ? { backgroundColor: labelColor } : {}}
                            >
                              {labelName}
                            </span>
                          );
                        })}
                      </div>
                    )}
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

      {editingTask && boardPath && (
        <EditTaskModal
          task={editingTask}
          board={board}
          boardPath={boardPath}
          onTaskUpdated={handleEditTaskComplete}
          onCancel={handleEditTaskCancel}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
};

export default KanbanBoard;