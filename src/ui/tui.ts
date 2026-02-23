import * as blessed from "blessed";
import { ProcessManager } from "../core/proc-manager";
import type { WorkspaceList } from "../core/types";

export function createTUI(workspaces: WorkspaceList): void {
  const screen = blessed.screen({
    smartCSR: true,
    title: "BunTUI"
  });

  const MIN_WIDTH_FOR_LANDSCAPE = 80;

  const sidebar = blessed.list({
    label: " Workspaces ",
    keys: true,
    vi: true,
    border: "line",
    style: {
      selected: { bg: "blue" }
    }
  });

  const logs = blessed.box({
    label: " Logs ",
    border: "line",
    scrollable: true,
    alwaysScroll: true
  });

  screen.append(sidebar);
  screen.append(logs);

  // Function to update layout based on screen width
  function updateLayout() {
    const width = typeof screen.width === 'number' ? screen.width : parseInt(screen.width as string, 10);
    
    if (width >= MIN_WIDTH_FOR_LANDSCAPE) {
      // Landscape mode: side by side
      sidebar.width = "25%";
      sidebar.height = "100%";
      sidebar.left = 0;
      sidebar.top = 0;
      
      logs.left = "25%";
      logs.top = 0;
      logs.width = "75%";
      logs.height = "100%";
    } else {
      // Portrait mode: stacked vertically
      sidebar.width = "100%";
      sidebar.height = "30%";
      sidebar.left = 0;
      sidebar.top = 0;
      
      logs.left = 0;
      logs.top = "30%";
      logs.width = "100%";
      logs.height = "70%";
    }
    
    screen.render();
  }

  // Initial layout
  updateLayout();

  // Handle terminal resize
  screen.on("resize", () => {
    updateLayout();
  });

  sidebar.setItems([...workspaces]);

  const manager = new ProcessManager("dev");
  let currentWorkspace: string | null = null;

  sidebar.on("select", (_item: blessed.Widgets.BlessedElement, index: number) => {
    const ws = workspaces[index];
    if (!ws) return;

    currentWorkspace = ws;
    manager.start(ws, ws);

    logs.setContent(manager.getBuffer(ws));
    screen.render();
  });

  // Live log updates
  const logInterval = setInterval(() => {
    if (currentWorkspace) {
      const buffer = manager.getBuffer(currentWorkspace);
      logs.setContent(buffer);
      logs.setScrollPerc(100); // Auto-scroll to bottom
      screen.render();
    }
  }, 100); // Update every 100ms

  screen.key(["r"], () => {
    if (!currentWorkspace) return;
    manager.restart(currentWorkspace);
  });

  screen.key(["q", "C-c"], () => {
    clearInterval(logInterval);
    manager.stopAll();
    process.exit(0);
  });

  sidebar.focus();
  screen.render();
}