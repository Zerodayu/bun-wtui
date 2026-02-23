export async function runFix() {
  try {
    console.log("🔧 Fixing dependency mismatches...\n");
    
    const proc = Bun.spawn(["bunx", "syncpack", "fix", "--dependency-types", "prod,dev"], {
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
