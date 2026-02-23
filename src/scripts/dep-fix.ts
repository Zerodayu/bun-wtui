// Spawn syncpack fix process with piped output for TUI
export function spawnFixProcess() {
  return Bun.spawn(["bunx", "syncpack", "lint", "--dependency-types", "prod,dev"], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: process.cwd(),
  });
}

// Run syncpack fix for CLI
export async function runFix() {
  try {
    console.log("🔧 Fixing dependency mismatches...\n");
    
    const proc = Bun.spawn(["bunx", "syncpack", "lint", "--dependency-types", "prod,dev"], {
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
