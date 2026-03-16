import os, shutil, re
from datetime import datetime
from collections import defaultdict

# ── CONFIG ───────────────────────────────────────────────────────────────────
SOURCE  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_inbox")
STAGING = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_sorted", "by-burst")

BURST_GAP        = 20   # minutes — gap larger than this = new session
MIN_SESSION_SIZE = 2    # sessions smaller than this go to _singles
IMAGE_EXTS       = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic',
                    '.tiff', '.tif', '.bmp', '.svg', '.avif'}

# ── SESSION LABELS ───────────────────────────────────────────────────────────
# After a run, detected sessions are listed below. Add a label to any session
# and it will be used as the folder name on the next run instead of the date.
# Format: "YYYY-MM-DD HH:MM": "Your Label Here"
SESSION_LABELS = {
    # "2025-06-19 14:32": "Eko App Design Review",
    # "2026-02-22 20:15": "Small Claims Filing",
}
# ─────────────────────────────────────────────────────────────────────────────

def time_of_day(hour):
    if hour < 6:   return "night"
    if hour < 12:  return "morning"
    if hour < 17:  return "afternoon"
    if hour < 21:  return "evening"
    return "night"

def session_folder_name(session_key, files):
    dt = datetime.strptime(session_key, "%Y-%m-%d %H:%M")

    # Use custom label if provided
    if session_key in SESSION_LABELS and SESSION_LABELS[session_key].strip():
        label = SESSION_LABELS[session_key].strip()
        return f"{dt.strftime('%Y-%m-%d')} — {label}"

    tod = time_of_day(dt.hour)
    return f"{dt.strftime('%Y-%m-%d')} {tod} ({len(files)} files)"

def get_files(folder):
    files = []
    for f in os.listdir(folder):
        fpath = os.path.join(folder, f)
        if os.path.isfile(fpath) and os.path.splitext(f)[1].lower() in IMAGE_EXTS:
            mtime = os.path.getmtime(fpath)
            files.append((mtime, f, fpath))
    return sorted(files)

def cluster(files, gap_minutes):
    if not files:
        return []
    sessions = []
    current = [files[0]]
    for i in range(1, len(files)):
        delta = (files[i][0] - files[i-1][0]) / 60
        if delta <= gap_minutes:
            current.append(files[i])
        else:
            sessions.append(current)
            current = [files[i]]
    sessions.append(current)
    return sessions

def write_session_labels(sessions):
    """Write detected sessions back into this script's SESSION_LABELS dict."""
    script_path = os.path.abspath(__file__)
    with open(script_path, 'r') as f:
        source = f.read()

    # Find the SESSION_LABELS block and replace it
    new_entries = []
    for key, files in sessions.items():
        if len(files) >= MIN_SESSION_SIZE:
            existing_label = SESSION_LABELS.get(key, "")
            label_str = f'"{existing_label}"' if existing_label else '""  # ← add label here'
            dt = datetime.strptime(key, "%Y-%m-%d %H:%M")
            comment = f"# {len(files)} files, {time_of_day(dt.hour)}"
            new_entries.append(f'    "{key}": {label_str},  {comment}')

    new_block = "SESSION_LABELS = {\n    # After a run, detected sessions are listed below. Add a label to any session\n    # and it will be used as the folder name on the next run instead of the date.\n    # Format: \"YYYY-MM-DD HH:MM\": \"Your Label Here\"\n"
    new_block += "\n".join(new_entries)
    new_block += "\n}"

    updated = re.sub(
        r'SESSION_LABELS = \{.*?\}',
        new_block,
        source,
        flags=re.DOTALL
    )

    with open(script_path, 'w') as f:
        f.write(updated)

    print(f"\n✓ Wrote {len(new_entries)} sessions back into the script.")
    print("  Open sort_by_burst.py, add labels next to any session key, then re-run.")

def run():
    os.makedirs(STAGING, exist_ok=True)

    files = get_files(SOURCE)
    if not files:
        print("No image files found in SOURCE.")
        return

    print(f"Found {len(files)} files — clustering into sessions (gap = {BURST_GAP} min)...\n")

    sessions_list = cluster(files, BURST_GAP)

    # Build session dict keyed by start timestamp string
    sessions_dict = {}
    for session in sessions_list:
        dt = datetime.fromtimestamp(session[0][0])
        key = dt.strftime("%Y-%m-%d %H:%M")
        sessions_dict[key] = session

    # Preview sessions
    print(f"{'Session':<25} {'Files':>6}  {'Time span'}")
    print("─" * 55)
    for key, sfiles in sessions_dict.items():
        span = (sfiles[-1][0] - sfiles[0][0]) / 60
        label = f" → {SESSION_LABELS[key]}" if SESSION_LABELS.get(key) else ""
        size_tag = "" if len(sfiles) >= MIN_SESSION_SIZE else "  [→ _singles]"
        print(f"{key:<25} {len(sfiles):>6} files  {span:.0f} min{label}{size_tag}")

    print()
    moved = 0

    for key, sfiles in sessions_dict.items():
        if len(sfiles) < MIN_SESSION_SIZE:
            folder_name = "_singles"
        else:
            folder_name = session_folder_name(key, sfiles)

        dest_dir = os.path.join(STAGING, folder_name)
        os.makedirs(dest_dir, exist_ok=True)

        for _, fname, src in sfiles:
            dest = os.path.join(dest_dir, fname)
            if os.path.exists(dest):
                base, ext = os.path.splitext(fname)
                n = 1
                while os.path.exists(dest):
                    dest = os.path.join(dest_dir, f"{base}_{n}{ext}")
                    n += 1
            shutil.move(src, dest)
            moved += 1

    print(f"Moved {moved} files into {len(sessions_dict)} sessions.")
    print(f"Results in: {STAGING}\n")

    # Write sessions back into script for labeling
    write_session_labels(sessions_dict)

if __name__ == "__main__":
    run()
