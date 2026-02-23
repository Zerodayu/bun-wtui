import fs from "fs";
import path from "path";
import { getConfig } from "./config";

export function getWorkspaces(): string[] {
  const root = process.cwd();
  const pkgPath = path.join(root, "package.json");

  if (!fs.existsSync(pkgPath)) {
    throw new Error("No package.json found in root.");
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const workspaces = pkg.workspaces || [];
  const config = getConfig();

  const expanded: string[] = [];

  for (const pattern of workspaces) {
    const matches = expandGlob(root, pattern);
    for (const match of matches) {
      if (isValidWorkspace(root, match) && !config.workspace.excludeWorkspaces.includes(match)) {
        expanded.push(match);
      }
    }
  }

  return expanded;
}

function expandGlob(root: string, pattern: string): string[] {
  const results: string[] = [];
  
  // Handle /*  pattern (shallow glob)
  if (pattern.endsWith("/*")) {
    const baseDir = pattern.replace("/*", "");
    const fullPath = path.join(root, baseDir);

    if (!fs.existsSync(fullPath)) return [];

    const dirs = fs.readdirSync(fullPath);
    dirs.forEach((dir) => {
      results.push(path.join(baseDir, dir));
    });
  }
  // Handle /**/* pattern (deep glob)
  else if (pattern.includes("**")) {
    const parts = pattern.split("**");
    const baseDir = (parts[0] || "").replace(/\/$/, "");
    const fullPath = path.join(root, baseDir);
    
    if (fs.existsSync(fullPath)) {
      walkDirectory(fullPath, baseDir, results);
    }
  }
  // Handle exact path (no wildcards)
  else {
    results.push(pattern);
  }
  
  return results;
}

function walkDirectory(fullPath: string, relativePath: string, results: string[]): void {
  try {
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entryRelPath = relativePath 
          ? path.join(relativePath, entry.name)
          : entry.name;
        
        results.push(entryRelPath);
        
        // Recursively walk subdirectories
        walkDirectory(
          path.join(fullPath, entry.name),
          entryRelPath,
          results
        );
      }
    }
  } catch {
    // Ignore errors (e.g., permission denied)
  }
}

function isValidWorkspace(root: string, workspacePath: string): boolean {
  const fullPath = path.join(root, workspacePath);
  
  // Check if directory exists
  if (!fs.existsSync(fullPath)) return false;
  
  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory()) return false;
  
  // Check if package.json exists
  const pkgPath = path.join(fullPath, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    
    // Check if dev script exists
    return pkg.scripts && pkg.scripts.dev !== undefined;
  } catch {
    return false;
  }
}