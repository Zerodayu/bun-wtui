export function showHelp() {
  console.log(`
bun-wtui - Neovim-style TUI dashboard for Bun workspaces

Usage:
  bun-wtui           Start the interactive TUI dashboard
  bun-wtui lint      Scan dependencies for issues using syncpack
  bun-wtui fix       Fix dependency mismatches across workspaces
  bun-wtui help      Show this help message

Examples:
  bun-wtui           # Start TUI
  bun-wtui lint      # Check dependency consistency
  bun-wtui fix       # Auto-fix dependency mismatches
`);
  process.exit(0);
}
