#!/usr/bin/env python3
"""
Reads the RohanLearn YouTube channel's public "about" page and, if the
subscriber/video/view counts have changed, updates
assets/channel-stats.json.

Why scraping the about page and not the YouTube Data API: the API is
more robust long-term, but it needs a Google Cloud project + API key
(an external account-creation step). The channel's about page already
embeds the exact same numbers as plain text in its HTML (searchable as
"subscriberCountText"/"videoCountText"/"viewCountText"), publicly and
without any key, so that's what this reads. If YouTube ever changes
that page's markup and this script starts failing, switching to the
official Data API (see comments below) is the fix.
"""

import json
import os
import re
import sys
import urllib.request

CHANNEL_ID = "UCxBbAhcn1PgxfV8kWD0o8Uw"  # Rohan Learn
ABOUT_URL = f"https://www.youtube.com/channel/{CHANNEL_ID}/about"
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "channel-stats.json")

PATTERNS = {
    "subscribers": r'"subscriberCountText":"([\d,]+) subscribers?"',
    "videos": r'"videoCountText":"([\d,]+) videos?"',
    "views": r'"viewCountText":"([\d,]+) views?"',
}


def write_output(key, value):
    gh_out = os.environ.get("GITHUB_OUTPUT")
    if gh_out:
        with open(gh_out, "a", encoding="utf-8") as f:
            f.write(f"{key}={value}\n")


def main():
    req = urllib.request.Request(ABOUT_URL, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"Failed to fetch channel about page: {e}", file=sys.stderr)
        write_output("changed", "false")
        sys.exit(1)

    stats = {}
    for key, pattern in PATTERNS.items():
        match = re.search(pattern, html)
        if not match:
            print(f"Could not find {key} in the channel page — page markup may have changed", file=sys.stderr)
            write_output("changed", "false")
            sys.exit(1)
        stats[key] = int(match.group(1).replace(",", ""))

    old_stats = None
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, encoding="utf-8") as f:
                old_stats = json.load(f)
        except (json.JSONDecodeError, OSError):
            pass

    if old_stats and all(old_stats.get(k) == v for k, v in stats.items()):
        print(f"No change — still {stats}")
        write_output("changed", "false")
        return

    import datetime
    stats["updatedAt"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Updated channel stats: {stats}")
    write_output("changed", "true")


if __name__ == "__main__":
    main()
