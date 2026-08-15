#!/usr/bin/env python3
"""
Reads the RohanLearn YouTube channel's public RSS feed and, if the
newest video has changed, updates assets/latest-video.json.

Why RSS and not the YouTube Data API: RSS needs no API key, so nothing
secret has to live in the repo or in GitHub Actions settings. Why this
runs in a GitHub Action and not in the browser: YouTube's RSS feed
doesn't send CORS headers, so a page running in a visitor's browser
can reach the feed but isn't allowed to read the response — this has
to run server-side instead.
"""

import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET

CHANNEL_ID = "UCxBbAhcn1PgxfV8kWD0o8Uw"  # Rohan Learn
FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "latest-video.json")

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}


def write_output(key, value):
    gh_out = os.environ.get("GITHUB_OUTPUT")
    if gh_out:
        with open(gh_out, "a", encoding="utf-8") as f:
            f.write(f"{key}={value}\n")


def main():
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
    except Exception as e:
        print(f"Failed to fetch RSS feed: {e}", file=sys.stderr)
        write_output("changed", "false")
        sys.exit(1)

    root = ET.fromstring(raw)
    entry = root.find("atom:entry", NS)
    if entry is None:
        print("No entries found in feed", file=sys.stderr)
        write_output("changed", "false")
        sys.exit(1)

    video_id = entry.find("yt:videoId", NS).text
    title = entry.find("atom:title", NS).text
    published = entry.find("atom:published", NS).text

    old_video_id = None
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, encoding="utf-8") as f:
                old_video_id = json.load(f).get("videoId")
        except (json.JSONDecodeError, OSError):
            pass

    if old_video_id == video_id:
        print(f"No change — latest video is still {video_id}")
        write_output("changed", "false")
        return

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {"videoId": video_id, "title": title, "publishedAt": published},
            f,
            indent=2,
            ensure_ascii=False,
        )
        f.write("\n")

    print(f"Updated latest video: {video_id} — {title}")
    write_output("changed", "true")


if __name__ == "__main__":
    main()
