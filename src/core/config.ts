import fs from "fs";
import path from "path";

export interface Config {
  ui: {
    theme: string;
    minWidthForLandscape: number;
    sidebarWidth: number;
    showTimestamps: boolean;
  };
  workspace: {
    excludeWorkspaces: string[];
    autoDetectWorkspaces: boolean;
    treeViewEnabled: boolean;
  };
  syncpack: {
    dependencyTypes: string[];
    autoLintOnStart: boolean;
  };
  behavior: {
    logLevel: "verbose" | "normal" | "quiet";
    rememberLastWorkspace: boolean;
  };
}

const DEFAULT_CONFIG: Config = {
  ui: {
    theme: "dark",
    minWidthForLandscape: 80,
    sidebarWidth: 25,
    showTimestamps: false,
  },
  workspace: {
    excludeWorkspaces: [],
    autoDetectWorkspaces: true,
    treeViewEnabled: false,
  },
  syncpack: {
    dependencyTypes: ["prod", "dev"],
    autoLintOnStart: false,
  },
  behavior: {
    logLevel: "normal",
    rememberLastWorkspace: false,
  },
};

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const root = process.cwd();
  const configPaths = [
    path.join(root, "bun-wtui.json"),
    path.join(root, ".bun-wtui.json"),
    path.join(root, "config/bun-wtui.json"),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, "utf-8");
        const userConfig = JSON.parse(fileContent);
        cachedConfig = mergeConfig(DEFAULT_CONFIG, userConfig);
        return cachedConfig;
      } catch (err: any) {
        console.warn(`Failed to load config from ${configPath}:`, err.message);
      }
    }
  }

  // No config found, use defaults
  cachedConfig = DEFAULT_CONFIG;
  return cachedConfig;
}

function mergeConfig(defaults: Config, user: Partial<Config>): Config {
  return {
    ui: { ...defaults.ui, ...(user.ui || {}) },
    workspace: { ...defaults.workspace, ...(user.workspace || {}) },
    syncpack: { ...defaults.syncpack, ...(user.syncpack || {}) },
    behavior: { ...defaults.behavior, ...(user.behavior || {}) },
  };
}

export function getConfig(): Config {
  return cachedConfig || loadConfig();
}
