# KnBn Web

A web-based viewer for the KnBn CLI tool - providing a modern, interactive interface to visualize and manage `.knbn` kanban board files.

## Overview

KnBn Web is a TypeScript-based web application that serves as a visual frontend for KnBn kanban boards. It allows you to view, interact with, and manage your kanban boards through a clean web interface with drag-and-drop functionality.

### Features

- **Visual Kanban Board**: Interactive board display with columns and task cards
- **Drag & Drop**: Move tasks between columns with real-time updates
- **Board Management**: Select and switch between multiple `.knbn` files
- **Tab Navigation**: Organized views for Backlog, Sprint, All Tasks, and Manage
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Changes are automatically saved to your `.knbn` files

## Installation

Install KnBn Web globally via npm:

```bash
npm i -g knbn-web
```

## Usage

Navigate to a directory containing `.knbn` files and start the web server:

```bash
knbn-web
```

The application will start on `http://localhost:9000` by default. You can specify a custom port:

```bash
knbn-web -p 8080
```

## Architecture

KnBn Web follows a three-layer architecture:

- **CLI Layer**: Command-line interface and server startup
- **Server Layer**: Express.js REST API for board management
- **Client Layer**: React frontend with interactive kanban board

## Development

For development setup, see the build commands in `package.json`:

```bash
# Build the application
npm run build

# Build client only (production)
npm run build:client

# Start development server
npm start
```

## License

MIT