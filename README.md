# Bun-Wtui

Neovim-style TUI dashboard for Bun workspaces.

Bun-Wtui is a lightweight terminal UI that lets you navigate your monorepo workspaces from a sidebar and view live logs in a split panel layout. It’s designed for developers who want something simpler than heavy task runners — just clean navigation and logs.

inspired by: [Turborepo](https://turborepo.dev/)

---

## Features

* Sidebar workspace navigation (↑/↓)
* Live log viewer for selected workspace
* Restart selected workspace (`r`)
* Stop selected workspace (`s`)
* Quit instantly (`q` or `Ctrl+C`)
* Auto-detects Bun workspaces from `package.json`
* Running status indicators (● running / — stopped)
* ▌ Active workspace indicator
* Works with any Bun monorepo
* Dependency linting and auto-fixing via syncpack integration

---

## Examples

![BunTUI Dashboard](./examples/example-img.png)
<video src="./examples/example-vid.mp4" controls></video>

## Installation

```bash
bun add -d bun-wtui
```

Add this to your root `package.json`:

```json
{
  "scripts": {
    "dev": "bun-wtui"
  }
}
```

Then run:

```bash
bun run dev
```

---

## CLI Commands

### Start TUI Dashboard (default)

```bash
bun-wtui
# or
bun-wtui tui
```

### Lint Dependencies

Scans all dependencies and devDependencies for version mismatches and issues:

```bash
bun-wtui lint
```

This runs `syncpack lint --dependency-types prod,dev` to check for:
- Version mismatches across workspaces
- Semver violations
- Dependency inconsistencies

### Fix Dependencies

Automatically fixes dependency version mismatches across workspaces:

```bash
bun-wtui fix
```

This runs `syncpack fix-mismatches --dependency-types prod,dev` to:
- Align dependency versions across all workspaces
- Fix semver range inconsistencies
- Update package.json files automatically

### Help

```bash
bun-wtui help
```

---

## How It Works?

BunTUI:

1. Reads your root `package.json`
2. Detects `"workspaces"`
3. Lists them in a sidebar
4. Runs `bun run dev` inside the selected workspace
5. Streams logs to the right panel

No extra config required.

---

## Controls

| Key    | Action                     |
| ------ | -------------------------- |
| ↑ / ↓  | Navigate workspaces        |
| Enter  | Select workspace           |
| r      | Restart selected workspace |
| s      | Stop selected workspace    |
| q      | Quit                       |
| Ctrl+C | Quit                       |

---

## Supported Workspace Format

Example:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

Each workspace must have a `dev` script:

```json
{
  "scripts": {
    "dev": "next dev"
  }
}
```

---

## Philosophy

BunTUI is not a task graph engine.

It does not cache builds.
It does not optimize pipelines.
It does not manage dependencies.

It simply:

> Shows your workspaces
> Lets you navigate
> Streams logs cleanly

Minimal. Focused. Fast.

---

## Roadmap

* [ ] Memory usage display
* [ ] Config file support
* [ ] Custom script flag (`--script build`)
* [ ] Tree-style workspace explorer

---

## 🛠 Development

Build locally:

```bash
bun run build
```

Test globally:

```bash
bun install -g .
```

Run:

```bash
bun-wtui
```
