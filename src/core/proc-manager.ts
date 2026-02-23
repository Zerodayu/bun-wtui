import { spawn } from "bun";
import type { WorkspaceProcess, ProcessManagerScript, WorkspaceName, WorkspacePath } from "./types";

export class ProcessManager {
  private processes: Map<WorkspaceName, WorkspaceProcess> = new Map();
  private readonly MAX_BUFFER_LINES = 1000; // Limit buffer to prevent memory leak

  constructor(private script: ProcessManagerScript = "dev") {}

  get(name: WorkspaceName): WorkspaceProcess | undefined {
    return this.processes.get(name);
  }

  start(name: WorkspaceName, cwd: WorkspacePath): void {
    const existing = this.processes.get(name);
    if (existing?.running) return;

    const wp: WorkspaceProcess = {
      name,
      cwd,
      buffer: [],
      running: true
    };

    const proc = spawn(["bun", "run", this.script], {
      cwd,
      stdout: "pipe",
      stderr: "pipe"
    });

    wp.process = proc;
    this.processes.set(name, wp);

    // Read stdout
    this.readStream(proc.stdout, wp);
    
    // Read stderr
    this.readStream(proc.stderr, wp);

    // Handle process exit
    proc.exited.then(() => {
      wp.running = false;
    });
  }

  private async readStream(
    stream: ReadableStream<Uint8Array> | null,
    wp: WorkspaceProcess
  ): Promise<void> {
    if (!stream) return;

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value, { stream: true });
        wp.buffer.push(text);
        
        // Limit buffer size to prevent memory leak
        if (wp.buffer.length > this.MAX_BUFFER_LINES) {
          wp.buffer = wp.buffer.slice(-this.MAX_BUFFER_LINES);
        }
      }
    } catch (error) {
      console.error("Error reading stream:", error);
    } finally {
      reader.releaseLock();
    }
  }

  restart(name: WorkspaceName): void {
    const existing = this.processes.get(name);
    if (!existing) return;

    existing.process?.kill();
    existing.running = false;

    this.start(name, existing.cwd);
  }

  stop(name: WorkspaceName): void {
    const existing = this.processes.get(name);
    if (!existing) return;

    existing.process?.kill();
    existing.running = false;
  }

  stopAll(): void {
    for (const [name] of this.processes) {
      this.stop(name);
    }
  }

  getBuffer(name: WorkspaceName): string {
    return this.processes.get(name)?.buffer.join("") || "";
  }
}