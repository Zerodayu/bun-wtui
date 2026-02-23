export interface WorkspaceProcess {
  name: string;
  cwd: string;
  process?: Bun.Subprocess;
  buffer: string[];
  running: boolean;
}

export type ProcessManagerScript = string;

export interface ProcessManagerConfig {
  script?: ProcessManagerScript;
}

export type WorkspaceName = string;
export type WorkspacePath = string;
export type WorkspaceList = readonly string[];