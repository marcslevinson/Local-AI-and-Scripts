import os, shutil
from PIL import Image
import pytesseract

# ── CONFIG ───────────────────────────────────────────────────────────────────
SOURCE   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_inbox")  # folder to sort
STAGING  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_sorted", "by-ocr")  # output

# Keywords → folder name. First match wins — put specific ones first.
CATEGORIES = [
    ("eko-app-design",      ["eko health", "eko app", "stethoscope", "cardiac", "ekohealth"]),
    ("first-intelligence",  ["first intelligence", "capi", "capiai", "kelly peng", "julie yang"]),
    ("AI-Conversations",    ["claude", "chatgpt", "gpt-4", "openai", "anthropic", "gemini", "copilot", "perplexity"]),
    ("AI-Generated-Art",    ["midjourney", "dall-e", "stable diffusion", "runway", "sora"]),
    ("Finance-Tax",         ["stripe", "irs", "tax", "invoice", "paypal", "venmo", "chase", "bank", "transaction", "receipt", "expense"]),
    ("Captain-Compliance",  ["captain compliance", "captaincompliance"]),
    ("SpaceGarage",         ["space garage", "spacegarage"]),
    ("Gmail-Settings",      ["gmail", "google mail", "inbox", "unsubscribe"]),
    ("Workspace-Snapshots", ["figma", "notion", "slack", "github", "linear", "jira", "vscode", "terminal", "xcode"]),
    ("OS-Software",         ["system preferences", "system settings", "activity monitor", "finder", "app store"]),
    ("School-Records",      ["transcript", "gpa", "semester", "university", "college", "grade"]),
    ("Salary-Info",         ["salary", "compensation", "offer letter", "base pay", "equity"]),
    ("Notes",               ["bear", "obsidian", "apple notes", "reminders"]),
]
# ─────────────────────────────────────────────────────────────────────────────

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.tiff'}

def ocr(path):
    try:
        img = Image.open(path)
        img.thumbnail((1600, 1600))
        return pytesseract.image_to_string(img).lower()
    except Exception as e:
        print(f"  OCR failed: {e}")
        return ""

def categorize(text):
    for folder, keywords in CATEGORIES:
        if any(kw in text for kw in keywords):
            return folder
    return "_unsorted"

def run():
    os.makedirs(STAGING, exist_ok=True)
    files = [f for f in os.listdir(SOURCE)
             if os.path.isfile(os.path.join(SOURCE, f))
             and os.path.splitext(f)[1].lower() in IMAGE_EXTS]

    print(f"Found {len(files)} images — starting OCR...\n")
    counts = {}

    for i, fname in enumerate(files):
        src = os.path.join(SOURCE, fname)
        print(f"[{i+1}/{len(files)}] {fname[:60]}", end=" → ", flush=True)

        folder = categorize(ocr(src))
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
        counts[folder] = counts.get(folder, 0) + 1
        print(folder)

    print("\n── Summary ──────────────────────────")
    for folder, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {folder:<30} {n} files")
    print(f"\nDone. Review results in: {STAGING}")

if __name__ == "__main__":
    run()
