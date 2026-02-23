export async function runLint() {
  try {
    console.info("🔍 Scanning dependencies for issues...\n");
    
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
