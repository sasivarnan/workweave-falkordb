"""Server-configured AI access. No provider key reaches the UI."""

import os


def enabled(provider_name):
    """AI is operator-configured; callers never supply provider credentials."""
    if os.getenv("AI_ENABLED", "true").lower() != "true":
        return False
    key_name = {"openai": "OPENAI_API_KEY", "gemini": "GEMINI_API_KEY"}.get(provider_name)
    return bool(key_name and os.getenv(key_name, "").strip())
