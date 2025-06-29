import express from 'express';
import path from 'path';
import fs from 'fs';
import { findBoardFile, loadBoard } from 'knbn/boardUtils';

export function startServer(port: number = 9000): void {
  const app = express();

  app.use(express.json());
  
  // Serve static files from dist/client
  app.use('/static', express.static(path.join(__dirname, '../client')));

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

  // Serve the React app
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>KnBn Board Viewer</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
          <div id="root"></div>
          <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="/static/bundle.js"></script>
      </body>
      </html>
    `);
  });

  app.listen(port, () => {
    console.log(`KnBn server running at http://localhost:${port}`);
  });
}