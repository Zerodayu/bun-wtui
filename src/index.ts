#!/usr/bin/env bun

import { runLint } from "./scripts/lint";
import { runFix } from "./scripts/fix";
import { showHelp } from "./scripts/help";
import { startTUI } from "./scripts/start-tui";

const args = process.argv.slice(2);
const command = args[0];

// Command map
const commands: Record<string, () => void | Promise<void>> = {
  lint: runLint,
  fix: runFix,
  help: showHelp,
  "--help": showHelp,
  "-h": showHelp,
  tui: startTUI,
};

// Execute command
const handler = command ? commands[command] : undefined;

if (handler) {
  await handler();
} else if (command) {
  console.error(`Unknown command: ${command}`);
  console.error('Run "bun-wtui help" for usage information.');
  process.exit(1);
} else {
  // Default: Start TUI
  startTUI();
}
