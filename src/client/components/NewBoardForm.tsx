import React, { useState } from 'react';
import { Button } from './common/Button';

interface NewBoardFormProps {
  onBoardCreated: () => void;
  onCancel: () => void;
}

const NewBoardForm: React.FC<NewBoardFormProps> = ({ onBoardCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      if (response.ok) {
        onBoardCreated();
        setName('');
        setDescription('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create board');
      }
    } catch (error) {
      console.error('Error creating board:', error);
      setError('Failed to create board');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-task-overlay">
      <div className="new-task-form">
        <h3>{'Create New Board'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="board-name">Board Name (optional)</label>
            <input
              id="board-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leave empty to create .knbn"
              autoFocus
            />
            <small className="form-help">
              If left empty, will create ".knbn". Otherwise creates "[name].knbn"
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="board-description">Description (optional)</label>
            <textarea
              id="board-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your board's purpose"
              rows={3}
            />
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <Button
              type="button"
              onClick={onCancel}
              color="default"
              className="btn-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              className="btn-create"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Board'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBoardForm;