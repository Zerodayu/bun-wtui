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
* Lint dependencies in overlay (`l`)
* Fix dependency mismatches in overlay (`f`)
* Quit instantly (`q` or `Ctrl+C`)
* Auto-detects Bun workspaces from `package.json`
* Running status indicators (● running / — stopped)
* ▌ Active workspace indicator
* Works with any Bun monorepo
* Powered by syncpack for dependency management

---

## Examples

![BunTUI Dashboard](./examples/example-img.png)
<video src="./examples/example-vid.mp4" controls></video>

## Installation

```bash
bun add -d bun-wtui
```
> recommended to add -d flag as *devDependencies*

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

```bash
bun-wtui {commands}
```

`help`: Show command flags <br>
`tui`: Show deafult tui <br>
`lint`: List workspaces dependencies issues <br>
`fix`: Fix workspaces dependencies issues <br>



---

## How It Works?

BunTUI:

1. Reads your root `package.json`
2. Detects `"workspaces"`
3. Lists them in a sidebar
4. Runs `bun run dev` inside the selected workspace
5. Streams logs to the right panel
6. Lint and Fix dependencies issue comes from `syncpack`

No extra config required.

---

## Controls

| Key    | Action                      |
| ------ | --------------------------- |
| ↑ / ↓  | Navigate workspaces         |
| Enter  | Select workspace            |
| r      | Restart selected workspace  |
| s      | Stop selected workspace     |
| l      | Lint dependencies (overlay) |
| f      | Fix mismatches (overlay)    |
| ESC    | Close overlay               |
| q      | Quit                        |
| Ctrl+C | Quit                        |

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
bun run build && bun link
```

Test:

```bash
bun link bun-wtui
```

Run:

```bash
bun bun-wtui
```
