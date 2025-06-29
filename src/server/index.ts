import express from 'express';
import path from 'path';
import fs from 'fs';
import { loadBoard, updateTaskInBoard, saveBoard, KNBN_CORE_VERSION, KNBN_BOARD_VERSION } from './knbn';
import { version as KNBN_WEB_VERSION } from '../../package.json';

export function startServer(port: number = 9000): void {
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

      const board = loadBoard(boardPath);
      const updatedTask = updateTaskInBoard(board, taskId, updates);

      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      saveBoard(boardPath, board);
      res.json(updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
      res.status(500).json({ error: 'Failed to update task' });
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
    console.log(`KnBn server running at http://localhost:${port}`);
    console.log(` - Core Version: ${KNBN_CORE_VERSION}`);
    console.log(` - Board Version: ${KNBN_BOARD_VERSION}`);
    console.log(` - Web Version: ${KNBN_WEB_VERSION}`);
  });
}