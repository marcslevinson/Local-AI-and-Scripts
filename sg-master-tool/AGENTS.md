# AGENTS.md

This file gives instructions to AI coding agents working in this repository.

## What this repo is

**SG Master Tool** — a local web-based control panel that the user runs on their Mac. It has three tabs:

1. **Home/Dashboard** — start/stop Ollama, launch local AI tools (OpenCode, Aider) in a Terminal window, view live Ollama logs
2. **Sort** — drag-and-drop image files, select a Python sort script, stream output live
3. **Docs** — component showcase for the custom `sg-*` Web Components

### Stack (current, as of 2026-03)
- **Frontend:** Vanilla HTML/JS SPA in `index.html`, styled with daisyUI (CDN) + Tailwind CDN + custom design tokens in `tokens/tokens.css`
- **Backend:** Node.js Express server in `server.js` — serves static files and provides local-only API endpoints
- **Component library:** Custom Web Components with `sg-` prefix in `components/` (button, field, controls, row)
- **Run:** `npm start` → `node server.js` → http://localhost:3000
- **Related:** Python sort scripts at `../python-sort/` (see that folder's `AGENTS.md`)

---

## AI tool workflow (how this project uses local AI)

### Tools available
| Tool | How to start | Best for |
|---|---|---|
| **OpenCode** | `opencode` button in Master Tool UI, or `ai-opencode` in terminal | Whole-repo agent tasks — describe the goal, it finds the files |
| **Aider 32b** | `ai-code32` button or alias | High quality edits, complex reasoning |
| **Aider 14b** | `ai-code14` button or alias | Fast targeted edits to specific files |
| **Claude (web)** | claude.ai | Architecture decisions, debugging hard problems |

### All local AI tools require Ollama
OpenCode and Aider both route through Ollama. Start it first via the "Start Ollama" button on the dashboard, or `ai-start` in terminal. The live log box on the dashboard shows Ollama output.

### Division of labor
- Use **OpenCode** for: adding new features, refactoring, anything where you want the AI to find its own way around the codebase
- Use **Aider 14b** for: quick targeted fixes to a known file
- Use **Claude** for: architectural questions, reviewing plans, debugging things the local models can't figure out
- Come back to **Claude** when: local models produce wrong output after 2–3 tries

### OpenCode prompting tips for this repo
- Always describe what tab/area you're working in: *"In the Sort tab in index.html..."*
- Reference the API endpoints in server.js when asking for backend changes
- Mention daisyUI for styling: *"use daisyUI card and badge components"*
- Keep a clean git state before running OpenCode so you can easily diff or revert

## Core operating rules

### 1. Inspect before acting
Before making suggestions or edits:

1. list the files in the current repository
2. inspect the relevant files
3. summarize what the project appears to be
4. identify what is known vs unknown

Base all conclusions on the files that actually exist.

### 2. Do not invent structure
Do not hallucinate files, architecture, workflows, or technologies.

Specifically, do not assume the existence of things like:

- `main.py`
- `app.js`
- `package.json`
- `src/`
- `backend/`
- tests
- deployment config
- CI/CD
- GitHub setup
- frameworks such as React, Node, Flask, etc.

Only reference tools, files, or systems that are explicitly present.

### 3. Prefer existing files
Default to editing or improving files that already exist.

Only create new files when one of these is true:

- the user explicitly asks for a new file
- a new file is clearly necessary to satisfy the request
- you explain why the new file is needed before creating it

Do not create placeholder files.

### 4. Be grounded and specific
Keep all recommendations tied to the real repository state.

If something is unclear, say so plainly.

Good example:
- "I only see `index.html`, `README.md`, and `AGENTS.md`, so I cannot yet infer a build system."

Bad example:
- "I will update `main.py` and push your backend changes."

### 5. Do not pretend tools or setup already exist
Before suggesting workflows involving Git, GitHub, deployment, package managers, or automation, first verify that they are actually available in this repo.

If they are not present, say that directly and suggest the next step.

---

## Default first action

If the user gives a broad request such as:

- "review this project"
- "familiarize yourself"
- "look around"
- "understand this repo"

then do this exact sequence:

1. list the files in the current repo
2. inspect the most relevant files
3. summarize:
   - what the project currently is
   - what files exist
   - what stack is visible
   - what is missing or still unclear
   - what the next sensible improvements are

Do not ask the user to manually paste file contents until you have first inspected what is already available in the repo.

---

## How to handle edits

When asked to make changes:

1. briefly state what you plan to change
2. edit only the relevant files
3. avoid unrelated rewrites
4. summarize exactly what changed afterward

Keep edits minimal, practical, and consistent with the current project.

If a request is ambiguous, prefer the smallest reasonable change that matches the existing repo.

---

## How to handle Git and GitHub

Before suggesting any of the following:

- `git add`
- `git commit`
- `git push`
- creating branches
- opening pull requests
- pushing to GitHub

first verify whether the current folder is actually a Git repository.

### If `.git` is present
You may proceed with Git-related guidance.

### If `.git` is missing
State clearly that:

- this folder is not currently a Git repository
- pushing is not possible from this folder yet

Then suggest the correct next step, such as:

- initialize Git here
- clone the real repo
- connect a remote
- move into the correct project folder

Do not imply that Git push will work when the repo is not initialized.

---

## File and path handling

Be careful with file paths.

### Important rule
In chat-style coding agents, raw paths beginning with `/` may be interpreted as commands rather than file paths.

Because of that:

- prefer relative paths when possible
- prefer filenames when the file is already in context
- avoid telling the user to paste raw absolute paths into the agent prompt unless necessary

If referring to a file already in the repo, use names like:

- `index.html`
- `README.md`
- `AGENTS.md`

instead of long absolute system paths.

---

## Behavior for repo review requests

When reviewing the repo, answer in this structure:

### 1. Current files
List the important files currently visible.

### 2. What the project appears to be
Describe the project based only on those files.

### 3. What is missing or unclear
State what cannot yet be determined.

### 4. Recommended next steps
Suggest the most sensible next improvements.

This keeps the agent from drifting into generic or invented advice.

---

## Behavior for implementation requests

If the user asks for a feature or change:

- first identify which existing file(s) should be updated
- explain whether the change belongs in an existing file or a new one
- avoid creating speculative scaffolding
- keep changes aligned with the apparent simplicity of the repo

For example, if the repo only contains a single `index.html`, prefer implementing small features directly there unless the user explicitly wants a larger restructure.

---

## Tone and style

Use this style by default:

- concise
- practical
- grounded
- direct
- low-assumption

Do not over-explain.
Do not invent missing context.
Do not behave like a generic tutorial bot.
Do not act like the repo is larger or more mature than it is.

---

## Anti-hallucination rule

If you have not directly seen a file, system, framework, or config in this repository, do not talk about it as though it exists.

When in doubt, say:

- what you can see
- what you cannot verify
- what should be checked next

---

## Success criteria

A good agent response in this repo should:

- reflect the actual files present
- avoid invented project structure
- avoid fake implementation details
- verify Git/GitHub status before suggesting pushes
- make minimal, relevant changes
- summarize work clearly after edits

If no other instruction is given, start by inspecting the current repository contents and summarizing what is actually there.
