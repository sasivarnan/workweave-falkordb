"""Check tracked files and the production frontend for configured secret values."""

import os
import subprocess
from pathlib import Path
from workweave.config import load

load()
root = Path(__file__).resolve().parents[1]
values = [
    os.getenv(name, "").encode()
    for name in ["OPENAI_API_KEY", "GEMINI_API_KEY", "FALKORDB_PASSWORD", "AI_ACCESS_CODE"]
    if len(os.getenv(name, "")) >= 8
]
files = [
    root / p
    for p in subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode().split("\0")
    if p
]
files += list((root / "frontend/dist").rglob("*"))
hits = []
for path in files:
    if path.is_file() and any(value in path.read_bytes() for value in values):
        hits.append(str(path.relative_to(root)))
if hits:
    print("Secret value detected in: " + ", ".join(hits))
    raise SystemExit(1)
print(
    "PASS: no configured secret values in tracked files or frontend build; "
    + str(len(values))
    + " configured values checked."
)
