import * as blessed from "blessed";
import { ProcessManager } from "../core/proc-manager";
import type { WorkspaceList } from "../core/types";
import { spawnLintProcess } from "../scripts/lint";
import { spawnFixProcess } from "../scripts/dep-fix";

export function createTUI(workspaces: WorkspaceList): void {
  const screen = blessed.screen({
    smartCSR: true,
    title: "BunWtui"
  });

  const MIN_WIDTH_FOR_LANDSCAPE = 80;

  const sidebar = blessed.list({
    label: " Workspaces ",
    keys: true,
    vi: true,
    border: "line",
    style: {
      selected: { 
        inverse: true
      }
    }
  });

  const logs = blessed.box({
    label: " Logs ",
    border: "line",
    scrollable: true,
    alwaysScroll: true
  });

  const footer = blessed.box({
    bottom: 0,
    left: 0,
    width: "100%",
    height: 1,
    content: "↑/↓: Navigate | Enter: Select | r: Restart | s: Stop | l: Lint | f: Fix | ESC: Close | q: Quit",
    align: "center"
  });

  screen.append(sidebar);
  screen.append(logs);
  screen.append(footer);

  // Create overlay for syncpack commands
  const overlay = blessed.box({
    top: "center",
    left: "center",
    width: "80%",
    height: "80%",
    label: " Syncpack ",
    border: "line",
    scrollable: true,
    alwaysScroll: true,
    hidden: true,
    style: {
      border: {
        fg: "cyan"
      }
    },
    keys: true,
    vi: true
  });

  screen.append(overlay);

  // Function to update layout based on screen width
  function updateLayout() {
    const width = typeof screen.width === 'number' ? screen.width : parseInt(screen.width as string, 10);
    
    if (width >= MIN_WIDTH_FOR_LANDSCAPE) {
      // Landscape mode: side by side
      sidebar.width = "25%";
      sidebar.height = "100%-1";
      sidebar.left = 0;
      sidebar.top = 0;
      
      logs.left = "25%";
      logs.top = 0;
      logs.width = "75%";
      logs.height = "100%-1";
    } else {
      // Portrait mode: stacked vertically
      sidebar.width = "100%";
      sidebar.height = "30%";
      sidebar.left = 0;
      sidebar.top = 0;
      
      logs.left = 0;
      logs.top = "30%";
      logs.width = "100%";
      logs.height = "70%-1";
    }
    
    screen.render();
  }

  // Initial layout
  updateLayout();

  // Handle terminal resize
  screen.on("resize", () => {
    updateLayout();
  });

  const manager = new ProcessManager("dev");
  let currentWorkspace: string | null = null;

  // Function to update sidebar with status indicators
  function updateSidebar() {
    const items = workspaces.map((ws) => {
      const proc = manager.get(ws);
      const isRunning = proc?.running || false;
      const statusIndicator = isRunning ? "●" : "—";
      const activeIndicator = ws === currentWorkspace ? "▌" : " ";
      return `${activeIndicator} ${statusIndicator} ${ws}`;
    });
    sidebar.setItems(items);
    screen.render();
  }

  // Initial sidebar setup
  updateSidebar();

  sidebar.on("select", (_item: blessed.Widgets.BlessedElement, index: number) => {
    const ws = workspaces[index];
    if (!ws) return;

    currentWorkspace = ws;
    manager.start(ws, ws);
    updateSidebar();

    logs.setContent(manager.getBuffer(ws));
    screen.render();
  });

  // Live log updates
  const logInterval = setInterval(() => {
    updateSidebar();
    
    if (currentWorkspace) {
      const buffer = manager.getBuffer(currentWorkspace);
      logs.setContent(buffer);
      logs.setScrollPerc(100); // Auto-scroll to bottom
      screen.render();
    }
  }, 100); // Update every 100ms

  // Helper function to run syncpack commands in overlay
  async function runSyncpackCommand(command: "lint" | "fix", label: string) {
    const emoji = command === "lint" ? "🔍" : "🔧";
    const action = command === "lint" ? "Scanning" : "Fixing";
    
    overlay.setLabel(` ${label} (ESC to close) `);
    overlay.setContent(`${emoji} ${action} dependencies...\n\n`);
    overlay.show();
    overlay.focus();
    screen.render();

    let output = `${emoji} ${action} dependencies...\n\n`;

    try {
      // Use helper functions from scripts folder
      const proc = command === "lint" ? spawnLintProcess() : spawnFixProcess();

      const decoder = new TextDecoder();
      
      // Stream stdout
      if (proc.stdout) {
        for await (const chunk of proc.stdout) {
          const text = decoder.decode(chunk);
          output += text;
          overlay.setContent(output);
          overlay.setScrollPerc(100);
          screen.render();
        }
      }

      // Stream stderr
      if (proc.stderr) {
        for await (const chunk of proc.stderr) {
          const text = decoder.decode(chunk);
          output += text;
          overlay.setContent(output);
          overlay.setScrollPerc(100);
          screen.render();
        }
      }

      await proc.exited;
      
      output += `\n\n✓ Done! Press ESC to close.`;
      overlay.setContent(output);
      overlay.setScrollPerc(100);
      screen.render();
    } catch (err: any) {
      output += `\n\n✗ Error: ${err.message}\n\nPress ESC to close.`;
      overlay.setContent(output);
      screen.render();
    }
  }

  // Close overlay and return focus to sidebar
  function closeOverlay() {
    overlay.hide();
    sidebar.focus();
    screen.render();
  }

  overlay.key(["escape", "q"], closeOverlay);

  screen.key(["l"], () => {
    runSyncpackCommand("lint", "Dependency Lint");
  });

  screen.key(["f"], () => {
    runSyncpackCommand("fix", "Fix Dependencies");
  });

  screen.key(["r"], () => {
    if (!currentWorkspace) return;
    manager.restart(currentWorkspace);
    updateSidebar();
  });

  screen.key(["s"], () => {
    if (!currentWorkspace) return;
    manager.stop(currentWorkspace);
    updateSidebar();
  });

  screen.key(["q", "C-c"], () => {
    clearInterval(logInterval);
    manager.stopAll();
    process.exit(0);
  });

  sidebar.focus();
  screen.render();
}