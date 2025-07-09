import React, { useState, useMemo } from 'react';
import { Board, Task } from '../knbn/types';
import NewTaskForm from './NewTaskForm';
import EditTaskModal from './EditTaskModal';
import { Button } from './common/Button';

interface BacklogTabProps {
  board: Board;
  boardPath: string;
  onTaskUpdate: () => void;
}

type SortOption = 'priority' | 'created' | 'updated' | 'title';

const BacklogTab: React.FC<BacklogTabProps> = ({ board, boardPath, onTaskUpdate }) => {
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const sortedAndFilteredTasks = useMemo(() => {
    let tasks = Object.values(board.tasks)
      .filter(task => !task.column || task.column.toLowerCase() === 'backlog');

    // Apply search filter
    if (searchTerm) {
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    tasks.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const aPriority = a.priority || 0;
          const bPriority = b.priority || 0;
          return bPriority - aPriority; // Higher priority first
        case 'created':
          return new Date(b.dates.created).getTime() - new Date(a.dates.created).getTime();
        case 'updated':
          return new Date(b.dates.updated).getTime() - new Date(a.dates.updated).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    console.log('sorted/filtered tasks', tasks);

    return tasks;
  }, [board.tasks, sortBy, searchTerm]);

  const handleTaskCreated = () => {
    setShowNewTaskForm(false);
    onTaskUpdate();
  };

  const handleCancelNewTask = () => {
    setShowNewTaskForm(false);
  };

  const handleTaskSelect = (taskId: number, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === sortedAndFilteredTasks.length) {
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedTasks(new Set(sortedAndFilteredTasks.map(task => task.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkAction = async (action: string, value?: string) => {
    const taskIds = Array.from(selectedTasks);
    const updates: { [key: string]: any } = {};
    
    switch (action) {
      case 'column':
        updates.column = value;
        break;
      case 'sprint':
        updates.sprint = value || undefined;
        break;
      case 'priority':
        updates.priority = value ? parseInt(value) : undefined;
        break;
    }

    try {
      await Promise.all(taskIds.map(taskId => 
        handleTaskUpdate(taskId, updates)
      ));
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditTaskComplete = () => {
    setEditingTask(null);
    onTaskUpdate();
  };

  const handleDeleteTask = () => {
    setEditingTask(null);
    onTaskUpdate();
  };

  const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        onTaskUpdate();
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getPriorityColor = (priority?: number): string => {
    if (!priority) return '#gray';
    if (priority >= 8) return '#ff4444';
    if (priority >= 5) return '#ff8800';
    if (priority >= 3) return '#ffaa00';
    return '#00aa00';
  };

  const getPriorityLabel = (priority?: number): string => {
    if (!priority) return 'No Priority';
    if (priority >= 8) return 'Critical';
    if (priority >= 5) return 'High';
    if (priority >= 3) return 'Medium';
    return 'Low';
  };

  return (
    <div className="backlog-tab">
      <div className="backlog-header">
        <div className="backlog-title">
          <h2>Backlog</h2>
          <span className="task-count">{sortedAndFilteredTasks.length} tasks</span>
        </div>
        
        <div className="backlog-controls">
          <div className="control-group">
            <label>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="search-input"
            />
          </div>
          
          <div className="control-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <option value="priority">Priority</option>
              <option value="created">Created Date</option>
              <option value="updated">Updated Date</option>
              <option value="title">Title</option>
            </select>
          </div>

          <Button 
            color="primary"
            onClick={() => setShowNewTaskForm(true)}
          >
            + New Task
          </Button>
        </div>
      </div>

      {showBulkActions && (
        <div className="bulk-actions">
          <div className="bulk-actions-header">
            <span>{selectedTasks.size} tasks selected</span>
            <Button 
              color="default"
              onClick={() => {
                setSelectedTasks(new Set());
                setShowBulkActions(false);
              }}
            >
              Clear Selection
            </Button>
          </div>
          <div className="bulk-actions-controls">
            <div className="bulk-control-group">
              <label>Move to Column:</label>
              <select onChange={(e) => handleBulkAction('column', e.target.value)}>
                <option value="">Select Column</option>
                {board.columns.map(col => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>
            
            {board.sprints && board.sprints.length > 0 && (
              <div className="bulk-control-group">
                <label>Assign Sprint:</label>
                <select onChange={(e) => handleBulkAction('sprint', e.target.value)}>
                  <option value="">Select Sprint</option>
                  <option value="__clear__">Clear Sprint</option>
                  {board.sprints.map(sprint => (
                    <option key={sprint.name} value={sprint.name}>{sprint.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="bulk-control-group">
              <label>Set Priority:</label>
              <select onChange={(e) => handleBulkAction('priority', e.target.value)}>
                <option value="">Select Priority</option>
                <option value="__clear__">Clear Priority</option>
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="backlog-tasks">
        {sortedAndFilteredTasks.length > 0 && (
          <div className="select-all-row">
            <label className="select-all-checkbox">
              <input
                type="checkbox"
                checked={selectedTasks.size === sortedAndFilteredTasks.length}
                onChange={handleSelectAll}
              />
              Select All ({sortedAndFilteredTasks.length} tasks)
            </label>
          </div>
        )}
        
        {sortedAndFilteredTasks.length === 0 ? (
          <div className="empty-backlog">
            <p>No tasks found matching the current filters.</p>
          </div>
        ) : (
          sortedAndFilteredTasks.map(task => (
            <div key={task.id} className="backlog-task-card">
              <div className="task-main-info">
                <div className="task-header">
                  <div className="task-title-section">
                    <label className="task-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={(e) => handleTaskSelect(task.id, e.target.checked)}
                      />
                    </label>
                    <h4 className="task-title">{task.title}</h4>
                    <span className="task-id">#{task.id}</span>
                    {task.column === 'backlog' && (
                      <span className="backlog-flag" title="Task in backlog column">📝</span>
                    )}
                    {task.sprint && (
                      <span className="sprint-warning" title="Task has sprint assignment">⚠️</span>
                    )}
                  </div>
                  <div className="task-priority">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>
                </div>
                
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                
                <div className="task-metadata">
                  <div className="task-info">
                    <span className="task-column">Column: {task.column || 'Unassigned'}</span>
                    {task.sprint && (
                      <span className="task-sprint">Sprint: {task.sprint}</span>
                    )}
                    {task.storyPoints && (
                      <span className="task-story-points">Story Points: {task.storyPoints}</span>
                    )}
                  </div>
                  
                  <div className="task-dates">
                    <span className="created-date">
                      Created: {formatDate(task.dates.created)}
                    </span>
                    {task.dates.updated !== task.dates.created && (
                      <span className="updated-date">
                        Updated: {formatDate(task.dates.updated)}
                      </span>
                    )}
                  </div>
                </div>
                
                {task.labels && task.labels.length > 0 && (
                  <div className="task-labels">
                    {task.labels.map(label => (
                      <span key={label} className="task-label">{label}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="task-actions">
                <Button 
                  color="secondary"
                  onClick={() => handleEditTask(task)}
                >
                  Edit
                </Button>
                
                <select 
                  value={task.column} 
                  onChange={(e) => handleTaskUpdate(task.id, { column: e.target.value })}
                  className="column-selector"
                >
                  <option value="">Select Column</option>
                  {board.columns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
                
                <input
                  type="number"
                  value={task.priority || ''}
                  onChange={(e) => handleTaskUpdate(task.id, { priority: parseInt(e.target.value) || undefined })}
                  placeholder="Priority"
                  className="priority-input"
                  min="1"
                  max="10"
                />
                
                {board.sprints && board.sprints.length > 0 && (
                  <select 
                    value={task.sprint || ''} 
                    onChange={(e) => handleTaskUpdate(task.id, { sprint: e.target.value || undefined })}
                    className="sprint-selector-backlog"
                  >
                    <option value="">No Sprint</option>
                    {board.sprints.map(sprint => (
                      <option key={sprint.name} value={sprint.name}>{sprint.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showNewTaskForm && (
        <NewTaskForm
          board={board}
          boardPath={boardPath}
          onTaskCreated={handleTaskCreated}
          onCancel={handleCancelNewTask}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          board={board}
          boardPath={boardPath}
          onTaskUpdated={handleEditTaskComplete}
          onCancel={() => setEditingTask(null)}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default BacklogTab;