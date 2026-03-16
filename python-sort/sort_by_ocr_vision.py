import os, shutil, string, re
from collections import Counter
from PIL import Image
import pytesseract

# ── CONFIG ───────────────────────────────────────────────────────────────────
SOURCE   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_inbox")
STAGING  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_sorted", "by-ocr-vision")

MIN_CLUSTER_SIZE = 3   # auto-folders with fewer files get moved to auto/_misc
MIN_WORD_LENGTH  = 4   # ignore short words when auto-categorizing
TOP_KEYWORDS     = 6   # how many keywords to save per learned category

# Predefined categories — first match wins, put specific ones first.
# After each run, newly learned categories are appended here automatically.
CATEGORIES = [
    ("eko-health",          ["eko health", "eko app", "stethoscope", "cardiac", "ekohealth", "heart", "lung", "bowel", "CORE 500", "Coral", "DUO", "CORE 300"]),
    ("llm-conversations",    ["claude", "chatgpt", "gpt-4", "openai", "anthropic", "gemini", "copilot", "perplexity"]),
    ("generated-images",          ["midjourney", "dall-e", "stable diffusion", "runway", "sora"]),
    ("finance",             ["stripe", "Net Worth", "irs", "tax", "invoice", "paypal", "venmo", "chase", "schwab", "bank", "transaction", "receipt", "expense", "trade", "market summary", "yield", "statement", "bill", "payment"]),
    ("captain-compliance",  ["captain compliance", "captaincompliance", "captain", "compliance"]),
    ("space-garage",        ["space garage", "spacegarage", "modular", "printer", "enclosure"]),
    ("Gmail-Settings",      ["gmail", "google mail", "inbox", "unsubscribe"]),
    ("OS-Software",         ["system preferences", "system settings", "activity monitor", "finder", "app store"]),
    ("school",              ["transcript", "gpa", "semester", "university", "college", "grade"]),
    ("salary",              ["salary", "compensation", "offer letter", "base pay", "equity"]),
    ("design-theory",       ["design theory", "john mauriello", "mauriello"]),
    ("first-intelligence",  ["Capi", "Capibarra", "first intelligence", "Kelly Peng", "Citywalk", "Julie Yang", "Daniel Song"]),
    ("Marclevinson",         ["marc levinson"]),
    ("Concept",              ["concept"]),
    ("design",               ["design"]),
    ("detail",               ["detail"]),
    ("crypto-conquerors",    ["crypto", "conquerors", "cryptoconquerors"]),
    ("status",               ["status", "current", "workload", "ready", "launch", "mean"]),
    ("today",                ["today"]),
    ("udon-thani",           ["udon", "thani"]),
    ("verify",               ["verify", "credentials"]),
    ("youtube",              ["youtube", "moistcritikal", "views", "channel"]),
    ("discord",              ["discord", "legion", "post", "introduction", "community", "full"]),
    ("Dosbox",               ["dosbox",]),
    ("forbes",               ["forbes"]),
    ("gcode",                ["gcode",]),
    ("google",               ["google",]),
    ("iphone",               ["iphone", "itunes",]),
     # ── LEARNED CATEGORIES (auto-appended after each run — edit freely) ──────
    ("Interaction",            ["interaction", "trigger", "action", "animation", "change", "state"]),
    ("Label",                  ["label", "unassigned"]),
    ("Launched",               ["launched"]),
    ("Leathercraft",           ["leathercraft"]),
    ("sinix",                  ["sinix", "monochroma", "deafenedland", "generalvc", "Chroma Corps"]),
    ("Offer",                  ["offer", "claimed"]),
    ("Option",                 ["option", "select", "options", "default", "priority", "single"]),
    ("Order",                  ["order", "track"]),
    ("Payment",                ["payment"]),
    ("Potential",              ["potential", "exchange"]),
    ("Project",                ["project", "client", "design", "image", "network", "members"]),
    ("Safari",                 ["safari", "bookmarks"]),
    ("Shipping",               ["shipping"]),

]
# ─────────────────────────────────────────────────────────────────────────────

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.tiff'}

STOP_WORDS = {
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'from','is','are','was','were','be','been','have','has','had','do','does',
    'did','will','would','could','should','may','might','can','it','its','this',
    'that','these','those','i','you','he','she','we','they','what','which','who',
    'when','where','how','all','each','every','both','more','most','no','not',
    'only','same','so','than','too','very','just','also','am','as','if','up',
    'out','new','get','our','your','my','their','click','here','page','www',
    'com','http','https','png','jpg','file','edit','view','help','window',
    'search','open','close','back','next','done','save','cancel','menu','home',
    'settings','account','profile','email','type','text','name','date','time',
    'some','then','than','them','they','been','into','over','after','before',
    'about','there','other','also','more','like','just','know','take','make',
    'good','look','come','want','need','went','right','left','used','using'
}

def ocr(path):
    try:
        img = Image.open(path)
        img.thumbnail((1600, 1600))
        return pytesseract.image_to_string(img).lower()
    except Exception as e:
        print(f"  OCR error: {e}")
        return ""

def match_predefined(text):
    for folder, keywords in CATEGORIES:
        if any(kw in text for kw in keywords):
            return folder
    return None

def meaningful_words(text):
    words = text.translate(str.maketrans('', '', string.punctuation)).split()
    return [w for w in words if len(w) >= MIN_WORD_LENGTH and w not in STOP_WORDS and w.isalpha()]

def top_keyword(text):
    words = meaningful_words(text)
    if not words:
        return None
    return Counter(words).most_common(1)[0][0].capitalize()

def write_learned_categories(learned):
    """Append newly learned categories back into this script's CATEGORIES list."""
    script_path = os.path.abspath(__file__)
    with open(script_path, 'r') as f:
        source = f.read()

    marker = "    # ── LEARNED CATEGORIES (auto-appended after each run — edit freely) ──────"
    if marker not in source:
        print("\n⚠️  Could not find marker to write learned categories — skipping.")
        return

    # Build new entries (skip any that are already in the file)
    existing_names = re.findall(r'^\s*\("([^"]+)"', source, re.MULTILINE)
    new_lines = []
    for name, keywords in sorted(learned.items()):
        if name not in existing_names:
            kw_str = ', '.join(f'"{k}"' for k in keywords)
            new_lines.append(f'    ("{name:<22}", [{kw_str}]),')

    if not new_lines:
        print("\n✓ No new categories to write back (all already in script).")
        return

    insertion = marker + "\n" + "\n".join(new_lines)
    updated = source.replace(marker, insertion)
    with open(script_path, 'w') as f:
        f.write(updated)

    print(f"\n✓ Wrote {len(new_lines)} learned categories back into the script.")
    print("  Open sort_screenshots.py to review and rename them.")

def run():
    import shutil as _sh
    if not _sh.which("tesseract"):
        print("❌ Tesseract not found. Install with:  brew install tesseract")
        return

    if not os.path.isdir(SOURCE):
        print(f"❌ Source folder does not exist: {SOURCE}")
        return

    os.makedirs(STAGING, exist_ok=True)

    files = [f for f in os.listdir(SOURCE)
             if os.path.isfile(os.path.join(SOURCE, f))
             and os.path.splitext(f)[1].lower() in IMAGE_EXTS]

    print(f"Found {len(files)} images — starting OCR...\n")

    # Pass 1: OCR everything
    assignments  = []        # (fname, folder, ocr_text)
    auto_counts  = Counter()
    auto_texts   = {}        # folder → [all ocr texts]

    for i, fname in enumerate(files):
        src = os.path.join(SOURCE, fname)
        print(f"[{i+1}/{len(files)}] {fname[:55]}", end=" → ", flush=True)

        text  = ocr(src)
        folder = match_predefined(text)

        if folder is None:
            kw = top_keyword(text)
            folder = f"auto/{kw}" if kw else "auto/_misc"
            auto_counts[folder] += 1
            auto_texts.setdefault(folder, []).append(text)

        assignments.append((fname, folder))
        print(folder)

    # Pass 2: collapse small auto-clusters
    print(f"\nCollapsing auto-folders with fewer than {MIN_CLUSTER_SIZE} files into auto/_misc...\n")
    final = []
    for fname, folder in assignments:
        if folder.startswith("auto/") and folder != "auto/_misc":
            if auto_counts[folder] < MIN_CLUSTER_SIZE:
                folder = "auto/_misc"
        final.append((fname, folder))

    # Pass 3: move files
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

    # Pass 4: build learned category keywords from surviving auto-clusters
    learned = {}
    for folder, texts in auto_texts.items():
        if auto_counts[folder] >= MIN_CLUSTER_SIZE:
            all_words = meaningful_words(" ".join(texts))
            top = [w for w, _ in Counter(all_words).most_common(TOP_KEYWORDS)]
            name = folder.replace("auto/", "")
            learned[name] = top

    # Pass 5: write learned categories back into this script
    if learned:
        write_learned_categories(learned)

    print("\n── Summary ──────────────────────────────────")
    for folder, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {folder:<40} {n} files")
    print(f"\nDone. Results in: {STAGING}")

if __name__ == "__main__":
    run()
