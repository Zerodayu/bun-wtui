import { getConfig } from "../core/config";

// Spawn syncpack lint process with piped output for TUI
export function spawnLintProcess() {
  const config = getConfig();
  const depTypes = config.syncpack.dependencyTypes.join(",");
  return Bun.spawn(["bunx", "syncpack", "lint", "--dependency-types", depTypes], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: process.cwd(),
  });
}

// Run syncpack lint for CLI
export async function runLint() {
  try {
    console.info("🔍 Scanning dependencies for issues...\n");
    const config = getConfig();
    const depTypes = config.syncpack.dependencyTypes.join(",");
    
    const proc = Bun.spawn(["bunx", "syncpack", "lint", "--dependency-types", depTypes], {
      stdout: "inherit",
      stderr: "inherit",
      cwd: process.cwd(),
    });
    
    const exitCode = await proc.exited;
    process.exit(exitCode);
  } catch (err: any) {
    console.error("Error running syncpack:", err.message);
    process.exit(1);
  }
}
