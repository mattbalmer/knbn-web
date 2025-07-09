import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { loadBoard, saveBoard, updateTask, createTask, KNBN_CORE_VERSION, KNBN_BOARD_VERSION } from './knbn';
import { createBoard } from 'knbn-core/actions/board';
import { addLabel, updateLabel, removeLabel, listLabels } from 'knbn-core/actions/label';
import { createColumn, updateColumn, removeColumn, moveColumn, listColumns } from 'knbn-core/actions/column';
import { addSprint, updateSprint, removeSprint, listSprints } from 'knbn-core/actions/sprint';
import { version as KNBN_WEB_VERSION } from '../../package.json';
import { getCWD } from './utils';

function openBrowser(url: string): void {
  const start = (process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open');
  exec(`${start} ${url}`, (error) => {
    if (error) {
      console.log(`Note: Could not automatically open browser. Please visit ${url} manually.`);
    }
  });
}

export function startServer(port: number = 9000, shouldOpenBrowser: boolean = true): void {
  const app = express();

  app.use(express.json());
  
  // Serve static files from dist/client
  app.use('/static', express.static(path.join(__dirname, '../../dist/client')));

  // API endpoint to get version information
  app.get('/api/version', (req, res) => {
    res.json({
      knbnWeb: KNBN_WEB_VERSION,
      knbnCore: KNBN_CORE_VERSION,
      knbnBoard: KNBN_BOARD_VERSION,
    });
  });

  // API endpoint to get current working directory
  app.get('/api/cwd', (req, res) => {
    res.json({
      cwd: getCWD()
    });
  });

  // API endpoint to list directories at a given path
  app.get('/api/directories', (req, res) => {
    try {
      const cwd = getCWD();
      const requestedPath = req.query.path as string || '';
      
      // Validate and sanitize the path
      const sanitizedPath = requestedPath.replace(/\.\./g, '').replace(/^\/+/, '');
      const targetDir = path.join(cwd, sanitizedPath);
      
      // Security check: ensure the target directory is within the CWD
      const resolvedTarget = path.resolve(targetDir);
      const resolvedCwd = path.resolve(cwd);
      
      if (!resolvedTarget.startsWith(resolvedCwd)) {
        return res.status(403).json({ error: 'Access denied: Path outside working directory' });
      }
      
      // Check if the directory exists
      if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        return res.json({ directories: [] });
      }
      
      const items = fs.readdirSync(targetDir);
      const directories = items
        .filter(item => {
          const itemPath = path.join(targetDir, item);
          return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
        })
        .sort();
      
      res.json({ directories });
    } catch (error) {
      res.status(500).json({ error: 'Failed to list directories' });
    }
  });

  // API endpoint to list all .knbn files in current directory or specified path
  app.get('/api/boards', (req, res) => {
    try {
      const cwd = getCWD();
      const requestedPath = req.query.path as string || '';
      
      // Validate and sanitize the path
      const sanitizedPath = requestedPath.replace(/\.\./g, '').replace(/^\/+/, '');
      const targetDir = path.join(cwd, sanitizedPath);
      
      // Security check: ensure the target directory is within the CWD
      const resolvedTarget = path.resolve(targetDir);
      const resolvedCwd = path.resolve(cwd);
      
      if (!resolvedTarget.startsWith(resolvedCwd)) {
        return res.status(403).json({ error: 'Access denied: Path outside working directory' });
      }
      
      // Check if the directory exists
      if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        return res.status(404).json({ error: 'Directory not found' });
      }
      
      const files = fs.readdirSync(targetDir);
      const knbnFiles = files
        .filter(file => file.endsWith('.knbn'))
        .map(file => ({
          name: file,
          path: path.join(targetDir, file)
        }));
      res.json(knbnFiles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list board files' });
    }
  });

  // API endpoint to get content of a specific board file
  app.get('/api/boards/:boardPath(*)', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }
      const board = loadBoard(boardPath);
      res.json(board);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load board content' });
    }
  });

  // API endpoint to update a task in a board file
  app.put('/api/boards/:boardPath(*)/tasks/:taskId', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const taskId = parseInt(req.params.taskId);
      const updates = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }

      const board = updateTask(boardPath, taskId, updates);
      const updatedTask = board.tasks[taskId];

      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // API endpoint to create a new task in a board file
  app.post('/api/boards/:boardPath(*)/tasks', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const taskData = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      if (!taskData.title) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      const result = createTask(boardPath, taskData);
      res.status(201).json(result.task);
    } catch (error) {
      console.error('Failed to create task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // API endpoint to delete a task from a board file
  app.delete('/api/boards/:boardPath(*)/tasks/:taskId', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const taskId = parseInt(req.params.taskId);

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }

      const board = loadBoard(boardPath);
      
      if (!board.tasks[taskId]) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      delete board.tasks[taskId];
      saveBoard(boardPath, board);
      
      res.json({ success: true, taskId });
    } catch (error) {
      console.error('Failed to delete task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // API endpoint to list labels in a board
  app.get('/api/boards/:boardPath(*)/labels', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }
      
      const labels = listLabels(boardPath);
      res.json(labels);
    } catch (error) {
      console.error('Failed to list labels:', error);
      res.status(500).json({ error: 'Failed to list labels' });
    }
  });

  // API endpoint to add a label to a board
  app.post('/api/boards/:boardPath(*)/labels', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const labelData = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      if (!labelData.name) {
        return res.status(400).json({ error: 'Label name is required' });
      }

      const board = addLabel(boardPath, labelData);
      const newLabel = board.labels?.find(l => l.name === labelData.name);
      res.status(201).json(newLabel);
    } catch (error) {
      console.error('Failed to add label:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to add label' });
      }
    }
  });

  // API endpoint to update a label in a board
  app.put('/api/boards/:boardPath(*)/labels/:labelName', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const labelName = decodeURIComponent(req.params.labelName);
      const updates = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      // Check if label name is being changed
      const isRenaming = updates.name && updates.name !== labelName;
      
      // Update the label in the board
      const board = updateLabel(boardPath, labelName, updates);
      const updatedLabel = board.labels?.find(l => l.name === (updates.name || labelName));
      
      if (!updatedLabel) {
        return res.status(404).json({ error: 'Label not found' });
      }

      // If label was renamed, update all tasks that reference the old label name
      if (isRenaming) {
        const boardAfterTaskUpdates = { ...board };
        let tasksUpdated = false;
        
        // Update tasks that have the old label name
        Object.values(boardAfterTaskUpdates.tasks).forEach((task) => {
          if (task.labels && task.labels.includes(labelName)) {
            // Replace old label name with new label name
            task.labels = task.labels.map(label => 
              label === labelName ? updates.name : label
            );
            // Update task's updated timestamp
            task.dates.updated = new Date().toISOString();
            tasksUpdated = true;
          }
        });
        
        // Save the board with updated tasks if any were modified
        if (tasksUpdated) {
          boardAfterTaskUpdates.dates.updated = new Date().toISOString();
          saveBoard(boardPath, boardAfterTaskUpdates);
        }
      }

      res.json(updatedLabel);
    } catch (error) {
      console.error('Failed to update label:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update label' });
      }
    }
  });

  // API endpoint to remove a label from a board
  app.delete('/api/boards/:boardPath(*)/labels/:labelName', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const labelName = decodeURIComponent(req.params.labelName);

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      // Remove the label from the board
      const board = removeLabel(boardPath, labelName);
      
      // Remove the label from all tasks that reference it
      const boardAfterTaskUpdates = { ...board };
      let tasksUpdated = false;
      
      Object.keys(boardAfterTaskUpdates.tasks).forEach(taskId => {
        const task = boardAfterTaskUpdates.tasks[parseInt(taskId)];
        if (task.labels && task.labels.includes(labelName)) {
          // Remove the label from the task
          task.labels = task.labels.filter(label => label !== labelName);
          // Update task's updated timestamp
          task.dates.updated = new Date().toISOString();
          tasksUpdated = true;
        }
      });
      
      // Save the board with updated tasks if any were modified
      if (tasksUpdated) {
        boardAfterTaskUpdates.dates.updated = new Date().toISOString();
        saveBoard(boardPath, boardAfterTaskUpdates);
      }
      
      res.json({ success: true, labelName });
    } catch (error) {
      console.error('Failed to remove label:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to remove label' });
      }
    }
  });

  // API endpoint to list columns in a board
  app.get('/api/boards/:boardPath(*)/columns', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }
      
      const columns = listColumns(boardPath);
      res.json(columns);
    } catch (error) {
      console.error('Failed to list columns:', error);
      res.status(500).json({ error: 'Failed to list columns' });
    }
  });

  // API endpoint to create a column in a board
  app.post('/api/boards/:boardPath(*)/columns', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const columnData = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      if (!columnData.name) {
        return res.status(400).json({ error: 'Column name is required' });
      }

      // Prevent creating "backlog" column
      if (columnData.name.toLowerCase() === 'backlog') {
        return res.status(400).json({ error: 'Cannot create backlog column - it is virtual' });
      }

      const board = createColumn(boardPath, columnData, columnData.position);
      const newColumn = board.columns?.find(c => c.name === columnData.name);
      res.status(201).json(newColumn);
    } catch (error) {
      console.error('Failed to create column:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create column' });
      }
    }
  });

  // API endpoint to update a column in a board
  app.put('/api/boards/:boardPath(*)/columns/:columnName', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const columnName = decodeURIComponent(req.params.columnName);
      const updates = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      // Prevent updating "backlog" column
      if (columnName.toLowerCase() === 'backlog') {
        return res.status(400).json({ error: 'Cannot update backlog column - it is virtual' });
      }

      // Check if column name is being changed
      const isRenaming = updates.name && updates.name !== columnName;
      
      // Prevent renaming to "backlog"
      if (isRenaming && updates.name.toLowerCase() === 'backlog') {
        return res.status(400).json({ error: 'Cannot rename column to "backlog" - it is reserved' });
      }

      const board = updateColumn(boardPath, columnName, updates);
      const updatedColumn = board.columns?.find(c => c.name === (updates.name || columnName));
      
      if (!updatedColumn) {
        return res.status(404).json({ error: 'Column not found' });
      }

      // If column was renamed, update all tasks that reference the old column name
      if (isRenaming) {
        const boardAfterTaskUpdates = { ...board };
        let tasksUpdated = false;
        
        // Update tasks that have the old column name
        Object.values(boardAfterTaskUpdates.tasks).forEach((task) => {
          if (task.column === columnName) {
            task.column = updates.name;
            task.dates.updated = new Date().toISOString();
            tasksUpdated = true;
          }
        });
        
        // Save the board with updated tasks if any were modified
        if (tasksUpdated) {
          boardAfterTaskUpdates.dates.updated = new Date().toISOString();
          saveBoard(boardPath, boardAfterTaskUpdates);
        }
      }

      res.json(updatedColumn);
    } catch (error) {
      console.error('Failed to update column:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update column' });
      }
    }
  });

  // API endpoint to move a column in a board
  app.put('/api/boards/:boardPath(*)/columns/:columnName/move', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const columnName = decodeURIComponent(req.params.columnName);
      const { position } = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      // Prevent moving "backlog" column
      if (columnName.toLowerCase() === 'backlog') {
        return res.status(400).json({ error: 'Cannot move backlog column - it is virtual' });
      }

      if (typeof position !== 'number') {
        return res.status(400).json({ error: 'Position must be a number' });
      }

      const board = moveColumn(boardPath, columnName, position);
      const movedColumn = board.columns?.find(c => c.name === columnName);
      
      if (!movedColumn) {
        return res.status(404).json({ error: 'Column not found' });
      }

      res.json({ success: true, column: movedColumn, columns: board.columns });
    } catch (error) {
      console.error('Failed to move column:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to move column' });
      }
    }
  });

  // API endpoint to remove a column from a board
  app.delete('/api/boards/:boardPath(*)/columns/:columnName', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const columnName = decodeURIComponent(req.params.columnName);

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      // Prevent deleting "backlog" column
      if (columnName.toLowerCase() === 'backlog') {
        return res.status(400).json({ error: 'Cannot delete backlog column - it is virtual' });
      }

      // Load board to check for tasks in the column
      const initialBoard = loadBoard(boardPath);
      const tasksInColumn = Object.values(initialBoard.tasks).filter(task => task.column === columnName);
      
      if (tasksInColumn.length > 0) {
        return res.status(400).json({ 
          error: `Cannot delete column "${columnName}" - it contains ${tasksInColumn.length} task(s). Move or delete the tasks first.` 
        });
      }

      const board = removeColumn(boardPath, columnName);
      res.json({ success: true, columnName });
    } catch (error) {
      console.error('Failed to remove column:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to remove column' });
      }
    }
  });

  // API endpoint to list sprints in a board
  app.get('/api/boards/:boardPath(*)/sprints', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }
      
      const sprints = listSprints(boardPath);
      res.json(sprints);
    } catch (error) {
      console.error('Failed to list sprints:', error);
      res.status(500).json({ error: 'Failed to list sprints' });
    }
  });

  // API endpoint to create a sprint in a board
  app.post('/api/boards/:boardPath(*)/sprints', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const sprintData = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      if (!sprintData.name) {
        return res.status(400).json({ error: 'Sprint name is required' });
      }

      const sprint = addSprint(boardPath, sprintData);
      res.status(201).json(sprint);
    } catch (error) {
      console.error('Failed to create sprint:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create sprint' });
      }
    }
  });

  // API endpoint to update a sprint in a board
  app.put('/api/boards/:boardPath(*)/sprints/:sprintName', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const sprintName = decodeURIComponent(req.params.sprintName);
      const updates = req.body;

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      // Check if sprint name is being changed
      const isRenaming = updates.name && updates.name !== sprintName;
      
      const sprint = updateSprint(boardPath, sprintName, updates);

      // If sprint was renamed, update all tasks that reference the old sprint name
      if (isRenaming) {
        const board = loadBoard(boardPath);
        const boardAfterTaskUpdates = { ...board };
        let tasksUpdated = false;
        
        // Update tasks that have the old sprint name
        Object.values(boardAfterTaskUpdates.tasks).forEach((task) => {
          if (task.sprint === sprintName) {
            task.sprint = updates.name;
            task.dates.updated = new Date().toISOString();
            tasksUpdated = true;
          }
        });
        
        // Save the board with updated tasks if any were modified
        if (tasksUpdated) {
          boardAfterTaskUpdates.dates.updated = new Date().toISOString();
          saveBoard(boardPath, boardAfterTaskUpdates);
        }
      }

      res.json(sprint);
    } catch (error) {
      console.error('Failed to update sprint:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update sprint' });
      }
    }
  });

  // API endpoint to remove a sprint from a board
  app.delete('/api/boards/:boardPath(*)/sprints/:sprintName', (req, res) => {
    try {
      const boardPath = decodeURIComponent(req.params.boardPath);
      const sprintName = decodeURIComponent(req.params.sprintName);

      if (!fs.existsSync(boardPath) || !boardPath.endsWith('.knbn')) {
        return res.status(404).json({ error: 'Board file not found' });
      }

      // Remove the sprint from the board
      removeSprint(boardPath, sprintName);
      
      // Remove the sprint from all tasks that reference it
      const board = loadBoard(boardPath);
      const boardAfterTaskUpdates = { ...board };
      let tasksUpdated = false;
      
      Object.values(boardAfterTaskUpdates.tasks).forEach((task) => {
        if (task.sprint === sprintName) {
          task.sprint = undefined;
          task.dates.updated = new Date().toISOString();
          tasksUpdated = true;
        }
      });
      
      // Save the board with updated tasks if any were modified
      if (tasksUpdated) {
        boardAfterTaskUpdates.dates.updated = new Date().toISOString();
        saveBoard(boardPath, boardAfterTaskUpdates);
      }
      
      res.json({ success: true, sprintName });
    } catch (error) {
      console.error('Failed to remove sprint:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to remove sprint' });
      }
    }
  });

  // API endpoint to create a new board file
  app.post('/api/boards', (req, res) => {
    try {
      const { name, description } = req.body;

      // Create the board using knbn core function
      const filePath = path.join(getCWD(), `${name}.knbn`);
      const board = createBoard(filePath, { name, description });
      
      // Return the board info
      const fileName = path.basename(filePath);
      res.status(201).json({
        name: fileName,
        path: filePath
      });
    } catch (error) {
      console.error('Failed to create board:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create board' });
      }
    }
  });

  // Serve the React app
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>KnBn Board Viewer</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="/static/reset.css">
          <link rel="stylesheet" href="/static/style.css">
      </head>
      <body>
          <div id="root"></div>
          <script src="/static/react.production.min.js"></script>
          <script src="/static/react-dom.production.min.js"></script>
          <script src="/static/bundle.js"></script>
      </body>
      </html>
    `);
  });

  app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`KnBn server running at ${url}`);
    console.log(` - Core Version: ${KNBN_CORE_VERSION}`);
    console.log(` - Board Version: ${KNBN_BOARD_VERSION}`);
    console.log(` - Web Version: ${KNBN_WEB_VERSION}`);
    
    if (shouldOpenBrowser) {
      setTimeout(() => openBrowser(url), 1000); // Small delay to ensure server is ready
    }
  });
}