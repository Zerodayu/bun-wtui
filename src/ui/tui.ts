import * as blessed from "blessed";
import { ProcessManager } from "../core/proc-manager";
import type { WorkspaceList } from "../core/types";
import { spawnLintProcess } from "../scripts/lint";
import { spawnFixProcess } from "../scripts/dep-fix";
import { getConfig } from "../core/config";

// Build hierarchical tree structure from workspace paths
interface TreeNode {
  name: string;
  workspace?: string;
  children: Map<string, TreeNode>;
  isExpanded: boolean;
}

function buildTreeStructure(workspaces: WorkspaceList): TreeNode {
  const root: TreeNode = {
    name: "",
    children: new Map(),
    isExpanded: true
  };

  for (const ws of workspaces) {
    const parts = ws.split("/").filter(p => p.length > 0);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      
      const isLeaf = i === parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          workspace: isLeaf ? ws : undefined,
          children: new Map(),
          isExpanded: true
        });
      }
      
      current = current.children.get(part)!;
    }
  }

  return root;
}

// Flatten tree to list with indentation
function flattenTree(
  node: TreeNode,
  manager: ProcessManager,
  currentWorkspace: string | null,
  depth: number = 0,
  items: Array<{ text: string; workspace?: string }> = []
): Array<{ text: string; workspace?: string }> {
  const sorted = Array.from(node.children.values()).sort((a, b) => {
    // Directories first, then files
    if (a.workspace && !b.workspace) return 1;
    if (!a.workspace && b.workspace) return -1;
    return a.name.localeCompare(b.name);
  });

  for (const child of sorted) {
    const indent = "  ".repeat(depth);
    const hasChildren = child.children.size > 0;
    const expandIndicator = hasChildren ? (child.isExpanded ? "▼ " : "▶ ") : "";
    
    if (child.workspace) {
      // Leaf node (actual workspace)
      const proc = manager.get(child.workspace);
      const isRunning = proc?.running || false;
      const statusIndicator = isRunning ? "●" : "—";
      const activeIndicator = child.workspace === currentWorkspace ? "▌" : " ";
      
      items.push({
        text: `${indent}${activeIndicator} ${statusIndicator} ${child.name}`,
        workspace: child.workspace
      });
    } else {
      // Directory node
      items.push({
        text: `${indent}${expandIndicator}${child.name}/`
      });
      
      if (child.isExpanded) {
        flattenTree(child, manager, currentWorkspace, depth + 1, items);
      }
    }
  }

  return items;
}

export function createTUI(workspaces: WorkspaceList): void {
  const config = getConfig();
  const screen = blessed.screen({
    smartCSR: true,
    title: "BunWtui"
  });

  const MIN_WIDTH_FOR_LANDSCAPE = config.ui.minWidthForLandscape;
  const manager = new ProcessManager("dev");
  let currentWorkspace: string | null = null;
  let treeStructure: TreeNode | null = null;
  let flatItems: Array<{ text: string; workspace?: string }> = [];

  // Initialize tree structure if tree view is enabled
  if (config.workspace.treeViewEnabled) {
    treeStructure = buildTreeStructure(workspaces);
  }

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
    content: config.workspace.treeViewEnabled
      ? "↑/↓: Navigate | ←/→: Collapse/Expand | Enter: Select | r: Restart | s: Stop | l: Lint | f: Fix | q: Quit"
      : "↑/↓: Navigate | Enter: Select | r: Restart | s: Stop | l: Lint | f: Fix | ESC: Close | q: Quit",
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
      sidebar.width = `${config.ui.sidebarWidth}%`;
      sidebar.height = "100%-1";
      sidebar.left = 0;
      sidebar.top = 0;
      
      logs.left = `${config.ui.sidebarWidth}%`;
      logs.top = 0;
      logs.width = `${100 - config.ui.sidebarWidth}%`;
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

  // Function to update sidebar with status indicators
  function updateSidebar() {
    if (config.workspace.treeViewEnabled && treeStructure) {
      // Update tree view with hierarchical structure
      flatItems = flattenTree(treeStructure, manager, currentWorkspace);
      const displayItems = flatItems.map(item => item.text);
      sidebar.setItems(displayItems);
    } else {
      // Update list view
      const items = workspaces.map((ws) => {
        const proc = manager.get(ws);
        const isRunning = proc?.running || false;
        const statusIndicator = isRunning ? "●" : "—";
        const activeIndicator = ws === currentWorkspace ? "▌" : " ";
        return `${activeIndicator} ${statusIndicator} ${ws}`;
      });
      sidebar.setItems(items);
    }
    screen.render();
  }

  // Initial sidebar setup
  updateSidebar();

  // Handle selection
  sidebar.on("select", (_item: blessed.Widgets.BlessedElement, index: number) => {
    if (config.workspace.treeViewEnabled && treeStructure) {
      // Tree view mode
      const selectedItem = flatItems[index];
      if (!selectedItem) return;

      if (selectedItem.workspace) {
        // Workspace selected
        const ws = selectedItem.workspace;
        currentWorkspace = ws;
        manager.start(ws, ws);
        updateSidebar();
        logs.setContent(manager.getBuffer(ws));
        screen.render();
      } else {
        // Directory node selected - toggle expansion
        // Find and toggle the node
        const itemText = selectedItem.text.trim();
        const depth = (selectedItem.text.match(/^  /g) || []).length;
        const dirName = itemText.replace(/^[▼▶]\s*/, "").replace(/\/$/, "");
        
        // Toggle node in tree structure
        function toggleNode(node: TreeNode, path: string[], currentDepth: number): boolean {
          if (currentDepth === depth) {
            const child = node.children.get(dirName);
            if (child) {
              child.isExpanded = !child.isExpanded;
              return true;
            }
          }
          
          for (const [_, child] of node.children) {
            if (toggleNode(child, path, currentDepth + 1)) {
              return true;
            }
          }
          
          return false;
        }
        
        toggleNode(treeStructure, [], 0);
        updateSidebar();
        sidebar.select(index); // Keep selection on the same item
      }
    } else {
      // List view mode
      const ws = workspaces[index];
      if (!ws) return;

      currentWorkspace = ws;
      manager.start(ws, ws);
      updateSidebar();
      logs.setContent(manager.getBuffer(ws));
      screen.render();
    }
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