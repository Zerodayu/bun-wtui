#!/usr/bin/env bun

import { getWorkspaces } from "./core/workspace";
import { createTUI } from "./ui/tui";

try {
  const workspaces = getWorkspaces();

  if (workspaces.length === 0) {
    console.error("No workspaces found.");
    process.exit(1);
  }

  createTUI(workspaces);
} catch (err: any) {
  console.error("Error:", err.message);
  process.exit(1);
}