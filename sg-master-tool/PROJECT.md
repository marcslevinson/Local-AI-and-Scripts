# SG Master Tool — Project Plan

_Last updated: 2026-03-16_

---

## What we're building

A local Mac control panel (web app at `localhost:3000`) with three areas:
1. **Home/Dashboard** — start/stop Ollama, launch AI coding tools, live log view
2. **Sort** — drag-and-drop image sorting via Python scripts + Ollama vision
3. **Docs** — component library reference

The server (`server.js`) is a local Express app that bridges the browser to shell commands. No cloud, no auth.

---

## Current state

| Area | Status | Notes |
|---|---|---|
| Dashboard — AI launcher | ✅ Working | Start/Stop Ollama, 4 launch buttons, live log box |
| Dashboard — folder picker | ✅ Working | Native macOS folder dialog, persists for session |
| Sort tab — drag & drop | ✅ Working | Files upload to `../python-sort/_inbox/` |
| Sort tab — script runner | ✅ Working | SSE streams stdout/stderr live |
| Docs tab | ✅ Working | sg-* component showcase |
| Ollama log streaming | ✅ Working | Tails `/tmp/ollama.log` via SSE |
| Folder picker persists across restarts | ❌ Not yet | Resets to `sg-master-tool/` on server restart |

---

## Active tasks

### 🔴 High priority

- [ ] **Persist selected project folder** across server restarts
  - Save `currentProjectDir` to a local JSON config file (e.g. `~/.sg-master-tool.json`) on change, load on startup
  - _Delegate to: OpenCode or Aider 14b_
  - Prompt: *"In server.js, persist `currentProjectDir` to `~/.sg-master-tool.json` on every folder change, and load it on startup with `__dirname` as fallback."*

- [ ] **Show current project folder name in launch button area**
  - Display just the last path segment (folder name) so it's obvious which project tools will open in
  - _Delegate to: Aider 14b_
  - Prompt: *"In index.html, below the folder picker input, show just the folder name (last path segment) as a small badge or label so it's always visible."*

### 🟡 Medium priority

- [ ] **Sort tab: show result summary after run completes**
  - After a sort script finishes, list the folders created and file counts
  - _Delegate to: OpenCode_
  - Prompt: *"After a sort script run completes in the Sort tab, call a new server endpoint `GET /api/sort/results` that lists the contents of `_sorted/` and display a summary table in the output area."*

- [ ] **Sort tab: show inbox file count on page load**
  - On Sort tab mount, call `GET /api/sort/inbox` and show any files already there
  - _Delegate to: Aider 14b_
  - Prompt: *"In index.html Sort tab JS, on page load call `/api/sort/inbox` and populate the file list if any files are already in `_inbox/`."*

- [ ] **Dashboard: OpenCode status indicator**
  - Show whether OpenCode is currently running in a Terminal window (best-effort via `pgrep`)
  - _Delegate to: Aider 14b_

### 🟢 Nice to have

- [ ] **Dark mode toggle** using daisyUI's `data-theme` attribute
- [ ] **Multiple project bookmarks** — save/name a list of project folders instead of one at a time
- [ ] **Sort tab: open output folder in Finder** after run completes
- [ ] **Mobile-friendly nav** — collapse tabs to hamburger on small screens

---

## How to delegate tasks to local AI

### Start Ollama first
Click **Start Ollama** on the dashboard (or `ai-start` in terminal).

### For OpenCode (whole-repo agent tasks)
1. Click **OpenCode** button — Terminal opens in the current project folder
2. Paste the prompt from the task above
3. OpenCode reads the files, makes changes, shows a diff

### For Aider (targeted file edits)
1. Click **Aider 14b** — Terminal opens in the current project folder
2. Type `/add index.html server.js` to add the relevant files
3. Paste the task prompt

### When to come back to Claude
- Architecture decisions
- Debugging something the local models can't figure out after 2–3 tries
- Reviewing OpenCode's output before committing

---

## File map

```
sg-master-tool/
├── index.html        — full SPA (3 tabs, all UI logic inline)
├── server.js         — Express server, all API endpoints
├── package.json      — dependencies: express, multer
├── AGENTS.md         — instructions for AI agents working in this repo
├── PROJECT.md        — this file
├── tokens/
│   └── tokens.css    — CSS custom properties (colors, spacing, type)
└── components/       — sg-* Web Components
    ├── button/
    ├── field/
    ├── controls/
    └── row/

../python-sort/
├── AGENTS.md         — sort script documentation
├── sort_by_vision.py
├── sort_by_ocr.py
├── sort_by_ocr_vision.py
└── sort_by_burst.py
```

---

## Known issues / watch out for

- **daisyUI version**: using v4.12.10 from CDN. v5 has breaking changes — don't upgrade without testing.
- **Tailwind CDN**: classes not in `tailwind.config.js` content paths still work because we use the CDN play script. If we ever move to a build step, the config needs updating.
- **Multer v1 vulnerability warning**: upgrade to multer v2 when it stabilizes. Low risk for local-only use.
- **SSE reconnect**: the log and sort output both auto-reconnect on disconnect, but accumulated output is lost on reconnect (by design).
