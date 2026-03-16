# Claude-Code-Style Terminal Workflow (Local Backstop)

This document describes a reliable fallback workflow for working with local coding models using:

Ollama  
Aider  
Git  

This is not the most agentic system available, but it is stable, fully local, and terminal-first.

Use this workflow if experimental agents break or behave unpredictably.

---

# Architecture

The stack looks like this:

Terminal  
↓  
Aider (agent interface)  
↓  
Ollama (model runtime)  
↓  
Local coding model  

All computation stays local to your machine.

---

# Requirements

Installed tools:

ollama  
aider  
git  

Recommended models:

qwen2.5-coder:32b  
deepseek-coder:33b  

Check models:

```bash
ollama list
```

Install if needed:

```bash
ollama pull qwen2.5-coder:32b
ollama pull deepseek-coder:33b
```

---

# Step 1 — Start the local model server

Start Ollama:

```bash
ollama serve
```

Confirm it is working:

```bash
ollama list
```

---

# Step 2 — Open your project

Navigate to the repository:

```bash
cd "/Users/marclevinson/Documents/👾Software Dev/Local AI/sg-master-tool"
```

Verify git state:

```bash
git status
```

---

# Step 3 — Start the coding agent

Launch Aider with repository context:

```bash
aider --model ollama/qwen2.5-coder:32b .
```

This loads the entire repo into the agent context.

---

# Step 4 — Use the structured agent loop

Instead of vague prompts, use structured instructions.

The workflow mirrors Claude Code's loop:

inspect  
plan  
edit  
verify  
commit  

---

# Inspect the repository

Prompt:

List the files in this repository and summarize what each one does.

---

# Plan improvements

Prompt:

Based on the current repo, propose the next 3 improvements.  
Do not modify files yet.

---

# Implement a change

Prompt:

Implement improvement #1.  
Explain your plan before editing any files.

Aider will generate a patch diff.

Approve the patch if correct.

---

# Verify the changes

Prompt:

Verify the changes and confirm they did not break anything.

Or run tests manually:

```bash
npm test
python script.py
```

---

# Commit the result

When satisfied:

```bash
git add .
git commit -m "Implement improvement"
git push
```

---

# Daily commands

Start AI runtime:

```bash
ollama serve
```

Open agent:

```bash
aider --model ollama/qwen2.5-coder:32b .
```

Check installed models:

```bash
ollama list
```

Update models:

```bash
ollama pull qwen2.5-coder:32b
```

---

# Optional alias for faster startup

Add to ~/.zshrc:

```bash
alias ai="aider --model ollama/qwen2.5-coder:32b ."
```

Then launch with:

```bash
ai
```

---

# Model strategy

Use different models for different tasks.

Planning:

deepseek-coder:33b  

Editing:

qwen2.5-coder:32b  

Example:

```bash
aider --model ollama/deepseek-coder:33b .
```

---

# Limitations

Compared with Claude Code:

Local models may struggle with:

large repository reasoning  
multi-file architecture changes  
complex refactoring  

However they perform well for:

incremental coding  
debugging  
small refactors  
automation scripts  

---

# When to use this workflow

Use this backstop when:

agent tools fail  
new experimental tools break  
internet access is unavailable  

It is the simplest stable local coding loop.

---

# Next step

The primary agent interface will be:

OpenCode

which adds:

autonomous planning  
tool execution loops  
better repo exploration  
Claude-Code-like CLI behavior  

while still using Ollama models locally.