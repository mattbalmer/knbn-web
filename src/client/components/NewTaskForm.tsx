import React, { useState } from 'react';
import { Board } from '../knbn/types';

interface NewTaskFormProps {
  board: Board;
  boardPath: string;
  onTaskCreated: () => void;
  onCancel: () => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ board, boardPath, onTaskCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [column, setColumn] = useState(board.configuration.columns[0]?.name || '');
  const [assignee, setAssignee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          column,
          assignee: assignee.trim() || undefined,
        }),
      });

      if (response.ok) {
        onTaskCreated();
        setTitle('');
        setDescription('');
        setAssignee('');
      } else {
        console.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-task-overlay">
      <div className="new-task-form">
        <h3>Create New Task</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="column">Column</label>
            <select
              id="column"
              value={column}
              onChange={(e) => setColumn(e.target.value)}
            >
              {board.configuration.columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="assignee">Assignee</label>
            <input
              id="assignee"
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Enter assignee (optional)"
            />
          </div>

          <div className="form-actions">
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
              className="btn-create"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskForm;