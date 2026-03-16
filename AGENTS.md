# AGENTS.md — Local AI and Scripts

This is a personal monorepo of local AI tools and scripts running on a Mac. No cloud, no deployment, no CI/CD. Everything runs locally via Ollama.

---

## Repo map

```
Local AI and Scripts/
├── sg-master-tool/       ← primary entry point — web UI control panel
├── python-sort/          ← image sorting scripts (dependency of sg-master-tool)
├── code-editor-basic/    ← fallback terminal workflow using Aider + Ollama
└── start-your-ai.md      ← quick-reference cheat sheet for local AI tools
```

---

## How the pieces relate

- **sg-master-tool** is the control panel for everything else. It runs at `localhost:3000` and provides a UI to start/stop Ollama, launch AI tools in Terminal, and run the python-sort scripts.
- **python-sort** is a standalone image sorter. It can be run directly (`python3 sort_by_*.py`) or triggered from the sg-master-tool Sort tab. It expects images in `python-sort/_inbox/` and outputs to `python-sort/_sorted/`.
- **code-editor-basic** is a fallback workflow — terminal-only Aider + Ollama loop for when the UI tools aren't working.
- `sg-master-tool/server.js` references `../python-sort` via relative path — keep this sibling relationship intact.

---

## Starting the master tool

**Double-click** `sg-master-tool/start.command` in Finder.

Or from terminal:
```bash
cd sg-master-tool
npm start
```

Opens at `http://localhost:3000`.

---

## Local AI tools

All tools route through **Ollama** (local model server on port 11434). Start it first via the dashboard or:
```bash
ollama serve
```

| Tool | How to start | Best for |
|---|---|---|
| **OpenCode** | Dashboard button or `~/.opencode/bin/opencode` in terminal | Whole-repo agent tasks |
| **Aider 32b** | Dashboard button or `aider --model ollama/qwen2.5-coder:32b` | High-quality edits |
| **Aider 14b** | Dashboard button or `aider --model ollama/qwen2.5-coder:14b` | Fast targeted edits |
| **Claude** | claude.ai | Architecture, debugging, reviewing local AI output |

Installed models: `qwen2.5-coder:32b`, `qwen2.5-coder:14b`, `deepseek-coder:33b`, `moondream`, `llava`

---

## Division of labor

- **OpenCode** — add features, refactor, anything where the AI should find its own way around the codebase
- **Aider 14b** — quick targeted fix to a known file
- **Claude** — architecture decisions, debugging things local models can't solve after 2–3 tries

---

## Module-level docs

Each module has its own AGENTS.md with full detail:
- `sg-master-tool/AGENTS.md` — stack, API endpoints, component library, editing rules
- `python-sort/AGENTS.md` — script descriptions, folder conventions, dependencies, auto-learning behavior

Read the relevant module AGENTS.md before making changes in that folder.

---

## Core rules

1. **Don't invent structure.** Only reference files and tools that actually exist in the repo.
2. **Prefer editing existing files** over creating new ones.
3. **Keep it local.** No cloud services, no deployment config, no CI/CD assumptions.
4. **Verify git state** before suggesting commits or pushes.
