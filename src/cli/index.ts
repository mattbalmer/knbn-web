#!/usr/bin/env node

import { startServer } from '../server';

function parseArgs(): { port: number; command?: string; args: string[]; boardFile?: string; openBrowser: boolean } {
  const args = process.argv.slice(2);
  let port = 9000; // default port
  let command: string | undefined;
  let boardFile: string | undefined;
  let openBrowser = true; // default to opening browser
  const remainingArgs: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' && i + 1 < args.length) {
      const portArg = parseInt(args[i + 1], 10);
      if (isNaN(portArg) || portArg < 1 || portArg > 65535) {
        console.error('Error: Port must be a number between 1 and 65535');
        process.exit(1);
      }
      port = portArg;
      i++; // skip the port value
    } else if ((args[i] === '-f' || args[i] === '--file') && i + 1 < args.length) {
      boardFile = args[i + 1];
      i++; // skip the file value
    } else if (args[i] === '--no-open') {
      openBrowser = false;
    } else if (args[i] === '--help' || args[i] === '-h') {
      command = 'help';
    } else if (!command && !args[i].startsWith('-')) {
      command = args[i];
    } else if (command) {
      remainingArgs.push(args[i]);
    }
  }
  
  return { port, command, args: remainingArgs, boardFile, openBrowser };
}

function main() {
  const { port, command, args, boardFile, openBrowser } = parseArgs();
  
  // Default action is to start the web server
  if (!command) {
    startServer(port, openBrowser);
    return;
  }
  
  // Handle other commands here in the future
  switch (command) {
    case 'server':
      startServer(port, openBrowser);
      break;
    case 'help':
      console.log(`
KnBn Web - Kanban Web CLI Interface

Usage: knbn-web [command] [options]

Commands:
  server                Start the web server (default)
  help                  Show this help message

Options:
  -p <port>             Set the server port (default: 9000)
  --no-open             Don't automatically open browser

Examples:
  knbn-web                                        # Start server on port 9000 and open browser
  knbn-web -p 8080                                # Start server on port 8080 and open browser
  knbn-web --no-open                              # Start server without opening browser
  knbn-web server -p 3000 --no-open              # Start server on port 3000 without opening browser
      `);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "knbn-web help" for usage information');
      process.exit(1);
  }
}

main();