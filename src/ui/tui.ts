import * as blessed from "blessed";
import { ProcessManager } from "../core/proc-manager";
import type { WorkspaceList } from "../core/types";

export function createTUI(workspaces: WorkspaceList): void {
  const screen = blessed.screen({
    smartCSR: true,
    title: "BunTUI"
  });

  const sidebar = blessed.list({
    label: " Workspaces ",
    width: "25%",
    height: "100%",
    keys: true,
    vi: true,
    border: "line",
    style: {
      selected: { bg: "blue" }
    }
  });

  const logs = blessed.box({
    label: " Logs ",
    left: "25%",
    width: "75%",
    height: "100%",
    border: "line",
    scrollable: true,
    alwaysScroll: true
  });

  screen.append(sidebar);
  screen.append(logs);

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