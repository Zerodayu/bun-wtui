

# Bun-Wtui

Neovim-style TUI dashboard for Bun workspaces.

BunTUI is a lightweight terminal UI that lets you navigate your monorepo workspaces from a sidebar and view live logs in a split panel layout. It’s designed for developers who want something simpler than heavy task runners — just clean navigation and logs.

---

## ✨ Features

* Sidebar workspace navigation (↑/↓)
* Live log viewer for selected workspace
* Restart selected workspace (`r`)
* Stop selected workspace (`s`)
* Quit instantly (`q` or `Ctrl+C`)
* Auto-detects Bun workspaces from `package.json`
* Running status indicators (● running / — stopped)
* ▌ Active workspace indicator
* Works with any Bun monorepo

---

## Installation

### Option 1 — Install Globally

```bash
bun install -g bun-wtui
```

Then run:

```bash
bun-wtui
```

---

### Option 2 — Install Per Project

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

## 🏗 How It Works

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

---

## 📜 License

MIT

---
