# KnBn Web

A web-based viewer for the KnBn CLI tool - providing a simple local interface to visualize and manage `.knbn` kanban board files.

_This is an early, work-in-progress version of the project. Use accepting risk of breaking changes._

## Installation

Install KnBn Web globally via npm, or use npx:

```bash
npx knbn-web
# or
npm i -g knbn-web
knbn-web 
```

## Usage

Navigate to a directory containing `.knbn` files and start the web server:

```bash
npx knbn-web
# or
knbn-web
```

You can suppress the browser auto-launch with the `--no-open` option:

```bash
npx knbn-web --no-open
```

The application will start on `http://localhost:9000` by default. You can specify a custom port:

```bash
knbn-web -p 8080
```
