# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnBn-Web is a web viewer for the KnBn CLI tool - a TypeScript-based kanban board management system that provides a web interface to visualize `.knbn` board files (YAML-formatted kanban boards).

## Architecture

The project follows a three-layer architecture:

- **CLI Layer** (`src/cli/`): Command-line interface and server startup
- **Server Layer** (`src/server/`): Express.js REST API and static file serving  
- **Client Layer** (`src/client/`): React frontend application

**Important**: Server files are NOT compiled - they run directly with ts-node even in production. Only CLI and client files are built to `dist/`.

## Commands

```bash
# Build CLI and client (excludes server files)
npm run build

# Build client bundle only
npm run build:client        # Production mode
npm run build:dev          # Development mode

# Start the application (uses ts-node for server)
npm start

# Start with custom port
npm start -- -p 8080
```

## Key Dependencies

- **knbn package**: Locally linked dependency at `/Users/matt/Workspace/knbn`
  - Uses `loadBoard` from `knbn/src/core/boardUtils` 
  - Import path needs improvement (see TODO in server/index.ts)
- **Webpack alias**: In dev mode, `knbn` resolves to `./node_modules/knbn`

## Build Configuration

### TypeScript (tsconfig.json)
- Server files excluded from compilation: `"exclude": ["src/server/**/*"]`
- Output: `./dist` (CLI only)
- Target: ES2020, CommonJS modules

### Webpack (client bundling)
- Entry: `src/client/index.tsx`
- Output: `dist/client/bundle.js`
- React/ReactDOM loaded from CDN (externals)
- Development alias for knbn dependency

## API Structure

Server provides REST endpoints:
- `GET /api/boards` - List all `.knbn` files in current directory
- `GET /api/boards/:boardPath(*)` - Get specific board content
- `GET /` - Serve React application
- `/static/*` - Client bundle and assets

## Board File Format

`.knbn` files are YAML with structure:
```yaml
configuration:
  name: "Board Name"
  columns: [...]
tasks:
  [id]: { title, description, status, timestamps }
metadata:
  nextId: number
```

## Development Notes

- Server runs on port 9000 by default
- Static files served from `dist/client` (note the path change in server/index.ts:12)
- Client uses file system scanning for board discovery
- No tests currently exist (Jest configured but unused)
- TypeScript strict mode enabled throughout

## Developer Notes
- Use `yarn` over `npm` where possible
- If in a feature branch (`feature/*`), git commit after every prompt. The commit message should follow the format below. Do not modify the user prompt.
  ```
  Prompt:
  <user_prompt>
  
  Summary:
  <summary_of_changes>
  ```
- Use `claude-test.knbn` by default when testing. This is okay to modify without asking permission.
- Never modify the file `.knbn` in this directory directly or without being prompted to. When prompter asks to modify ".knbn", use the CLI (npx knbn)