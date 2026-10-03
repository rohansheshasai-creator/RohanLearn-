#!/usr/bin/env python3
"""
Reads the RohanLearn YouTube channel's public RSS feed and keeps
assets/latest-video.json up to date with the most recent FULL-LENGTH
videos (YouTube Shorts are skipped).

The homepage shows videos[0] in the "Latest upload" player and the next
few in "Recent breakdowns". The file keeps the older top-level keys
(videoId / title / publishedAt) too, so nothing that read it before
breaks.

Why RSS and not the YouTube Data API: RSS needs no API key, so nothing
secret has to live in the repo. Why this runs in a GitHub Action and
not in the browser: YouTube's RSS feed doesn't send CORS headers, so a
visitor's browser can't read it.

How Shorts are detected: https://www.youtube.com/shorts/<id> answers
200 for a Short and redirects (303) to the normal watch page for a
regular video.
"""

import json
import os
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

CHANNEL_ID = "UCxBbAhcn1PgxfV8kWD0o8Uw"  # Rohan Learn
FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "latest-video.json")
KEEP = 7  # latest + 6 more is plenty for the homepage
UA = {"User-Agent": "Mozilla/5.0"}

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


_opener = urllib.request.build_opener(NoRedirect)


def is_short(video_id):
    req = urllib.request.Request(f"https://www.youtube.com/shorts/{video_id}", method="HEAD", headers=UA)
    try:
        with _opener.open(req, timeout=10) as resp:
            return resp.status == 200
    except urllib.error.HTTPError:
        return False  # redirected (or otherwise not a Short page) -> regular video
    except Exception:
        return False  # can't tell -> keep it rather than hide a real video


def write_output(key, value):
    gh_out = os.environ.get("GITHUB_OUTPUT")
    if gh_out:
        with open(gh_out, "a", encoding="utf-8") as f:
            f.write(f"{key}={value}\n")


def main():
    req = urllib.request.Request(FEED_URL, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
    except Exception as e:
        print(f"Failed to fetch RSS feed: {e}", file=sys.stderr)
        write_output("changed", "false")
        sys.exit(1)

    entries = ET.fromstring(raw).findall("atom:entry", NS)
    if not entries:
        print("No entries found in feed", file=sys.stderr)
        write_output("changed", "false")
        sys.exit(1)

    videos = []
    for entry in entries:
        vid = entry.find("yt:videoId", NS).text
        if is_short(vid):
            continue
        videos.append({
            "id": vid,
            "title": entry.find("atom:title", NS).text,
            "publishedAt": entry.find("atom:published", NS).text,
        })
        if len(videos) >= KEEP:
            break

    if not videos:
        print("Feed had no full-length videos", file=sys.stderr)
        write_output("changed", "false")
        sys.exit(1)

    latest = videos[0]
    new_data = {
        "videoId": latest["id"],
        "title": latest["title"],
        "publishedAt": latest["publishedAt"],
        "videos": videos,
    }

    old_data = None
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, encoding="utf-8") as f:
                old_data = json.load(f)
        except (json.JSONDecodeError, OSError):
            pass

    if old_data == new_data:
        print(f"No change — latest is still {latest['id']}")
        write_output("changed", "false")
        return

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Updated: latest is {latest['id']} — {latest['title']} ({len(videos)} videos kept)")
    write_output("changed", "true")


if __name__ == "__main__":
    main()
