import os
import shutil
import base64
import json
from urllib import request, error
from collections import Counter

# ── CONFIG ───────────────────────────────────────────────────────────────────
SOURCE  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_inbox")
STAGING = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_sorted", "by-vision")

MODEL            = "moondream"   # or "llava", "llama3.2-vision" for more accuracy
OLLAMA_URL       = "http://localhost:11434/api/generate"
OLLAMA_HEALTH_URL = "http://localhost:11434"
MIN_CLUSTER_SIZE = 3    # auto-folders smaller than this collapse into auto/_misc

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.tiff', '.bmp'}

# Predefined categories — model will try to match to one of these first.
# Add a short description to help the model understand each category.
CATEGORIES = [
    ("eko-health",          "medical app UI, stethoscope, cardiac, health monitoring screens"),
    ("llm-conversations",   "chat interface with AI assistant, Claude, ChatGPT, Gemini"),
    ("generated-images",    "AI generated artwork, Midjourney, Stable Diffusion, DALL-E images"),
    ("finance",             "bank statements, tax forms, invoices, receipts, financial data"),
    ("captain-compliance",  "Captain Compliance app or branding"),
    ("space-garage",        "Space Garage website or branding"),
    ("gmail-settings",      "Gmail inbox, email settings, Google mail interface"),
    ("workspace-snapshots", "Figma, Notion, Slack, GitHub, coding environment, design tools"),
    ("os-software",         "macOS system preferences, app installers, software settings"),
    ("school-records",      "academic transcripts, grades, university documents"),
    ("salary-info",         "salary, compensation, job offer letters, pay stubs"),
    # ── LEARNED CATEGORIES (auto-appended after each run — edit freely) ──────
]
# ─────────────────────────────────────────────────────────────────────────────


def encode_image(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def http_json(url, payload=None, timeout=30):
    data = None
    headers = {}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(url, data=data, headers=headers)

    with request.urlopen(req, timeout=timeout) as response:
        body = response.read().decode("utf-8")
        return json.loads(body) if body else {}


def http_ping(url, timeout=3):
    req = request.Request(url, method="GET")
    with request.urlopen(req, timeout=timeout) as response:
        return response.status


def ask_vision(image_path, category_names):
    """Ask Ollama to categorize the image."""
    category_list = "\n".join(f"- {name}" for name in category_names)
    prompt = (
        f"Look at this image carefully.\n\n"
        f"Choose the BEST category from this list:\n{category_list}\n\n"
        f"If none of these fit, reply with a single short category name (1-2 words, "
        f"like 'Recipe', 'Travel', 'Fitness'). "
        f"Reply with ONLY the category name. No explanation."
    )

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "images": [encode_image(image_path)],
        "stream": False,
        "options": {"temperature": 0}
    }

    try:
        result = http_json(OLLAMA_URL, payload=payload, timeout=60)
        text = result.get("response", "").strip()
        text = text.split("\n")[0].strip(" .,!?\"'")
        return text if text else None
    except error.HTTPError as e:
        try:
            details = e.read().decode("utf-8")
        except Exception:
            details = str(e)
        print(f"  Ollama HTTP error: {e.code} {details}")
        return None
    except Exception as e:
        print(f"  Ollama error: {e}")
        return None


def normalize(name):
    """Sanitize a category name for folder use."""
    if not name:
        return None

    cleaned = name.strip().lower()
    cleaned = cleaned.replace("/", "-").replace("\\", "-").replace(":", "-")
    cleaned = " ".join(cleaned.split())
    cleaned = cleaned[:60].strip(" .-_")

    return cleaned or None


def match_predefined(result):
    """Check if Ollama's answer matches a predefined category name."""
    if not result:
        return None

    result_lower = result.lower().strip()
    for name, _ in CATEGORIES:
        name_lower = name.lower()
        if name_lower == result_lower:
            return name
        if name_lower in result_lower or result_lower in name_lower:
            return name

    return None


def write_learned_categories(learned):
    """Append newly discovered categories back into this script."""
    script_path = os.path.abspath(__file__)

    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()

    marker = "    # ── LEARNED CATEGORIES (auto-appended after each run — edit freely) ──────"
    if marker not in source:
        print("\n⚠️  Could not find marker — skipping write-back.")
        return

    existing_names = [name for name, _ in CATEGORIES]
    new_lines = []

    for name, count in sorted(learned.items(), key=lambda x: (-x[1], x[0])):
        if name not in existing_names:
            padded = f"{name:<22}"
            new_lines.append(
                f'    ("{padded}", "{name.lower()} related images"),  # {count} files found'
            )

    if not new_lines:
        print("\n✓ No new categories to write back.")
        return

    insertion = marker + "\n" + "\n".join(new_lines)
    updated = source.replace(marker, insertion, 1)

    with open(script_path, "w", encoding="utf-8") as f:
        f.write(updated)

    print(f"\n✓ Wrote {len(new_lines)} learned categories back into the script.")
    print("  Open the script to review, rename, or improve descriptions.")


def run():
    if not os.path.isdir(SOURCE):
        print(f"❌ Source folder does not exist: {SOURCE}")
        return

    # Check Ollama is running
    try:
        http_ping(OLLAMA_HEALTH_URL, timeout=3)
    except Exception:
        print("❌ Ollama is not running.")
        print("   Start it with:  ollama serve")
        print(f"   Then make sure you have the model:  ollama pull {MODEL}")
        return

    os.makedirs(STAGING, exist_ok=True)

    files = [
        f for f in os.listdir(SOURCE)
        if os.path.isfile(os.path.join(SOURCE, f))
        and os.path.splitext(f)[1].lower() in IMAGE_EXTS
    ]

    if not files:
        print(f"No images found in: {SOURCE}")
        return

    print(f"Found {len(files)} images — categorizing with {MODEL}...\n")

    category_names = [name for name, _ in CATEGORIES]
    assignments = []
    auto_counts = Counter()

    for i, fname in enumerate(files, start=1):
        fpath = os.path.join(SOURCE, fname)
        print(f"[{i}/{len(files)}] {fname[:55]}", end=" → ", flush=True)

        result = ask_vision(fpath, category_names)
        matched = match_predefined(result)

        if matched:
            folder = matched
        else:
            folder_name = normalize(result) or "_misc"
            folder = f"auto/{folder_name}"
            auto_counts[folder] += 1

        assignments.append((fname, folder))
        print(folder)

    print(f"\nCollapsing auto-folders under {MIN_CLUSTER_SIZE} files into auto/_misc...\n")

    final = []
    for fname, folder in assignments:
        if folder.startswith("auto/") and folder != "auto/_misc":
            if auto_counts[folder] < MIN_CLUSTER_SIZE:
                folder = "auto/_misc"
        final.append((fname, folder))

    counts = Counter()

    for fname, folder in final:
        src = os.path.join(SOURCE, fname)
        dest_dir = os.path.join(STAGING, folder)
        os.makedirs(dest_dir, exist_ok=True)

        dest = os.path.join(dest_dir, fname)
        if os.path.exists(dest):
            base, ext = os.path.splitext(fname)
            n = 1
            while os.path.exists(dest):
                dest = os.path.join(dest_dir, f"{base}_{n}{ext}")
                n += 1

        shutil.move(src, dest)
        counts[folder] += 1

    learned = {
        folder.replace("auto/", ""): count
        for folder, count in auto_counts.items()
        if count >= MIN_CLUSTER_SIZE and folder != "auto/_misc"
    }

    if learned:
        write_learned_categories(learned)

    print("\n── Summary ──────────────────────────────────")
    for folder, n in sorted(counts.items(), key=lambda x: (-x[1], x[0])):
        print(f"  {folder:<40} {n} files")

    print(f"\nDone. Results in: {STAGING}")


if __name__ == "__main__":
    run()