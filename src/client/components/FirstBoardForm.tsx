import React, { useState } from 'react';
import { Button } from './common/Button';

interface NewBoardFormProps {
  onBoardCreated: () => void;
}

const FirstBoardForm: React.FC<NewBoardFormProps> = ({ onBoardCreated }) => {
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
    <div className="first-board-form">
      <h3>'Create Your First Board'</h3>

      <p className="auto-show-message">
        No board files found. Create your first kanban board to get started!
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="board-name">Board Name (optional)</label>
          <input
            id="board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leave empty to create .knbn"
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
  );
};

export default FirstBoardForm;