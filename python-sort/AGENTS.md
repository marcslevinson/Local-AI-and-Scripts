# AGENTS.md — python-sort

Scripts for organizing images from `_inbox/` into categorized folders under `_sorted/`.

---

## Folder Convention

```
python-sort/
├── _inbox/          ← drop images here before running
├── _sorted/
│   ├── by-vision/   ← output from sort_by_vision.py
│   ├── by-ocr/      ← output from sort_by_ocr.py
│   ├── by-ocr-vision/ ← output from sort_by_ocr_vision.py
│   └── by-burst/    ← output from sort_by_burst.py
└── *.py             ← scripts
```

All scripts are run from inside `python-sort/`. They resolve `_inbox/` relative to their own file path, so you can call them from any directory.

---

## Scripts

### `sort_by_vision.py`
**How it works:** Sends each image to Ollama (moondream by default) and asks the model which predefined category it belongs to. Falls back to auto-learned categories for unknown content.

**Dependencies:** Ollama running locally on port 11434 with `moondream` pulled
```sh
ollama pull moondream
```

**Run:**
```sh
python3 sort_by_vision.py
```

**Output:** `_sorted/by-vision/<category>/`

**Auto-learning:** When the model invents a new category for unrecognized images, it appends a new entry to the `CATEGORIES` list inside the script itself. Review and clean these periodically.

**Config (top of file):**
- `MODEL` — swap to `llava` or `llama3.2-vision` for higher accuracy (slower)
- `MIN_CLUSTER_SIZE` — auto-categories with fewer files collapse into `auto/_misc`
- `CATEGORIES` — list of `(folder_name, description)` tuples; add project-specific ones here

---

### `sort_by_ocr.py`
**How it works:** Runs Tesseract OCR on each image, extracts text, then checks it against a keyword dictionary. First matching category wins.

**Dependencies:** Tesseract + Pillow
```sh
brew install tesseract
pip install pillow pytesseract
```

**Run:**
```sh
python3 sort_by_ocr.py
```

**Output:** `_sorted/by-ocr/<category>/`

**No AI required** — fully offline, very fast.

**Config:**
- `CATEGORIES` — list of `(folder_name, [keywords])` tuples; order matters, first match wins
- Add domain-specific keywords for new projects at the top of the list

---

### `sort_by_ocr_vision.py`
**How it works:** Runs OCR first. If the text matches a known category keyword, sorts into that folder. For unmatched images, extracts meaningful keywords (strips stop words, short words) and auto-learns a new category — appending it to the script for future runs.

**Dependencies:** Tesseract + Pillow (same as OCR)
```sh
brew install tesseract
pip install pillow pytesseract
```

**Run:**
```sh
python3 sort_by_ocr_vision.py
```

**Output:** `_sorted/by-ocr-vision/<category>/`

**Auto-learning:** New keyword categories are appended to the `CATEGORIES` list inside the script. Small clusters (< 3 files) collapse into `auto/_misc`.

---

### `sort_by_burst.py`
**How it works:** Groups images by file modification time. A gap of more than 20 minutes starts a new session. Sessions are named by date + time-of-day. Sessions with fewer than 2 files go to `_singles/`.

**Dependencies:** None (stdlib only)

**Run:**
```sh
python3 sort_by_burst.py
```

**Output:** `_sorted/by-burst/<YYYY-MM-DD morning|afternoon|evening|night (N files)>/`

**Labeling sessions:** After the first run, detected session timestamps are printed. Add labels to the `SESSION_LABELS` dict at the top of the script:
```python
SESSION_LABELS = {
    "2025-06-19 14:32": "Eko App Design Review",
}
```
Re-run and the folder names will use your labels.

**Config:**
- `BURST_GAP` — minutes of silence before starting a new session (default: 20)
- `MIN_SESSION_SIZE` — sessions below this count go to `_singles` (default: 2)

---

## Recommended Workflow

1. Drop images into `_inbox/`
2. Choose the right script:
   - Fast + offline → `sort_by_ocr.py`
   - Best accuracy → `sort_by_vision.py` (requires Ollama running)
   - Balanced → `sort_by_ocr_vision.py`
   - Screenshot bursts → `sort_by_burst.py`
3. Run the script
4. Review `_sorted/` and clean up `auto/_misc` manually
5. For vision/ocr-vision: check newly learned categories added to the script and rename/merge as needed

## Notes for AI Agents

- Do not modify the `CATEGORIES` list unless explicitly asked — the scripts auto-append learned entries there
- `_inbox/` may not exist on a fresh clone; create it with `mkdir -p _inbox`
- Scripts are safe to re-run on already-sorted files (source is always `_inbox/`)
- The Master Tool UI (at `../sg-master-tool/`) provides a drag-and-drop front-end for these scripts
