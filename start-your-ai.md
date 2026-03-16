This folder holds multiple scripts and projects for different purposes.

Multiple models and programs are used across the projects.
For full instructions on using the various models and model combos, see top level folder named AI or instructions within a project if included there.

# Instruction Cheat Sheet:


## Quick Tips

Run your coding AI on a full project
aider --model ollama_chat/qwen2.5-coder:32b AGENTS.md README.md index.html


## What's installed

| Tool | What it does |
|---|---|
| **Ollama** | Runs AI models locally on your machine |
| **Aider** | AI that reads and edits your code files |
| **OpenCode** | Agentic AI — describe a goal, it navigates the whole repo |
| **Open Interpreter** | AI that can run code, scripts, and automate things |

### AI models available

| Model | Best for |
|---|---|
| `qwen2.5-coder:32b` | Best quality coding help (slower) |
| `qwen2.5-coder:14b` | Faster coding help (slightly less capable) |
| `deepseek-coder:33b` | Alternative coder, good at reasoning through problems |

--


## Ollama:

### To run it:

1. Open Terminal

2. Go to the "AI" folder (or wherever your system-wide AI setup lives)

Command:

cd ~/AI

(Only needed if you are not already in that folder.)

3. Start Ollama

Command:

ai-start

This launches the local AI engine.

Leave this terminal window **open and running**.
It acts like a background server for all the AI tools.

Expected message:

Ollama started (log: /tmp/ollama.log)

4. Use Ollama

Open a **new Terminal window or tab**.

Do NOT close the first one.

All AI tools will connect to the Ollama server that is running in the first terminal.

---

### What Ollama does

Ollama is the program that runs the AI models on your computer.

Other tools do not run models themselves.
They connect to Ollama.

Examples of tools that require Ollama running:

• Aider
• Open Interpreter
• any `ai-code` commands

If Ollama is not running, those tools will fail.

---

### Check installed models

Command:

ai-models

This shows which models are available and their sizes.

---

### Download a new model

Example:

ollama pull qwen2.5-coder:32b

Models are stored locally on your machine.

---

### If a tool says it cannot connect to a model

Start Ollama again:

ai-start

---

### Check Ollama activity

Command:

cat /tmp/ollama.log

This shows what Ollama is currently doing.

---

### Stop Ollama when finished

Command:

ai-stop

You normally only need to stop it when shutting down your computer or ending your session.

---

## OpenCode

OpenCode is an agentic coding tool — like Claude Code but running locally. You describe a goal in plain language and it navigates your codebase, reads relevant files, and makes changes across multiple files on its own.

**Use it when:** you want the AI to figure out what to change. Use Aider when you already know which file to touch.

### To run it:

1. Start Ollama first: `ai-start`

2. Navigate to your project:

```
cd ~/path/to/your/project
```

3. Launch OpenCode:

```
ai-opencode
```

Type your goal in natural language:

```
add input validation to the signup form and write a test for it
```

```
find all places where errors are handled inconsistently and fix them
```

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Enter` | Send message |
| `Ctrl+C` | Interrupt / cancel |
| `Esc` | Back / cancel |
| `/help` | Show all commands |

### Switch models for a session

```
opencode --model ollama/qwen2.5-coder:14b    # faster
opencode --model ollama/deepseek-coder:33b   # stronger reasoning
```

Default is `qwen2.5-coder:32b` (best quality, slower).

### OpenCode vs Aider

| | OpenCode | Aider |
|---|---|---|
| Best for | Whole-repo tasks | Targeted edits to specific files |
| How you guide it | Describe the goal | Step-by-step with files |
| Finds files? | Yes, automatically | You add them manually |

### Tips

- Always commit your current work before running OpenCode — makes it easy to `git diff` or revert if needed.
- Large tasks → use 32b model. Quick edits → 14b is fine.

### Troubleshooting

**Can't connect to Ollama** — make sure it's running: `ai-start`

**Tool calls not working / AI ignores file contents** — `num_ctx` must be set (already configured in your `.zshrc` via `OLLAMA_NUM_CTX=32768`)

**See what models OpenCode can use:**
```
opencode models ollama
```

For full docs see `~/AI/USE-opencode.md`

