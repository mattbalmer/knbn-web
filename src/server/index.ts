import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { loadBoard, saveBoard, updateTask, createTask, KNBN_CORE_VERSION, KNBN_BOARD_VERSION } from './knbn';
import { createBoard } from 'knbn-core/actions/board';
import { version as KNBN_WEB_VERSION } from '../../package.json';

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

  // API endpoint to list all .knbn files in current directory
  app.get('/api/boards', (req, res) => {
    try {
      const cwd = process.cwd();
      const files = fs.readdirSync(cwd);
      const knbnFiles = files
        .filter(file => file.endsWith('.knbn'))
        .map(file => ({
          name: file,
          path: path.join(cwd, file)
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

  // API endpoint to create a new board file
  app.post('/api/boards', (req, res) => {
    try {
      const { name, description } = req.body;

      // Create the board using knbn core function
      const filePath = path.join(process.cwd(), `${name}.knbn`);
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