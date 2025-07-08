import React, { useState, useEffect } from 'react';
import { Board, Task } from '../knbn/types';

interface EditTaskModalProps {
  task: Task;
  board: Board;
  boardPath: string;
  onTaskUpdated: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ 
  task, 
  board, 
  boardPath, 
  onTaskUpdated, 
  onCancel, 
  onDelete 
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [column, setColumn] = useState(task.column);
  const [priority, setPriority] = useState(task.priority?.toString() || '');
  const [sprint, setSprint] = useState(task.sprint || '');
  const [storyPoints, setStoryPoints] = useState(task.storyPoints?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setColumn(task.column);
    setPriority(task.priority?.toString() || '');
    setSprint(task.sprint || '');
    setStoryPoints(task.storyPoints?.toString() || '');
  }, [task]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updates: Partial<Task> = {
        title: title.trim(),
        description: description.trim() || undefined,
        column,
        priority: priority ? parseInt(priority) : undefined,
        sprint: sprint || undefined,
        storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
      };

      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        onTaskUpdated();
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete();
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close modal if clicking on the overlay background
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="edit-task-overlay" onClick={handleOverlayClick}>
      <div className="edit-task-modal">
        <div className="modal-header">
          <h3>#{task.id} - {task.title}</h3>
          <button 
            className="close-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-title">Title *</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-column">Column</label>
              <select
                id="edit-column"
                value={column}
                onChange={(e) => setColumn(e.target.value)}
              >
                {board.columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">No Priority</option>
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            {board.sprints && board.sprints.length > 0 && (
              <div className="form-group">
                <label htmlFor="edit-sprint">Sprint</label>
                <select
                  id="edit-sprint"
                  value={sprint}
                  onChange={(e) => setSprint(e.target.value)}
                >
                  <option value="">No Sprint</option>
                  {board.sprints.map((sprintItem) => (
                    <option key={sprintItem.name} value={sprintItem.name}>
                      {sprintItem.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="edit-story-points">Story Points</label>
              <input
                id="edit-story-points"
                type="number"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="Story points"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="task-meta-info">
            <p>Created: {new Date(task.dates.created).toLocaleString()}</p>
            {task.dates.updated !== task.dates.created && (
              <p>Updated: {new Date(task.dates.updated).toLocaleString()}</p>
            )}
          </div>

          <div className="form-actions">
            <div className="form-actions-left">
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-delete"
                >
                  Delete Task
                </button>
              )}
            </div>
            <div className="form-actions-right">
              <button
                type="button"
                onClick={onCancel}
                className="btn-cancel"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={isSubmitting || !title.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;