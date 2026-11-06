#!/usr/bin/env python3
"""
Updates assets/scoreboard.json: each company's latest closing price and how far it
has moved since its RohanLearn video went live. The companies are in
content/scoreboard.json.

Prices come from Yahoo Finance's public chart endpoint, which needs no key or account.
It is unofficial, so it can change or block requests. A company that fails keeps its
last good numbers, and the run only fails (GitHub then emails the owner) when every
company fails.

Everything is worked out from the same price series on each run, so a stock split
cannot distort a company's "since the video" figure.
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
CONFIG_PATH = os.path.join(ROOT, "content", "scoreboard.json")
CASES_PATH = os.path.join(ROOT, "content", "case-studies.json")
OUT_PATH = os.path.join(ROOT, "assets", "scoreboard.json")
CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{}?{}"
USER_AGENT = "Mozilla/5.0 (compatible; RohanLearnBot/1.0)"
SPARK_POINTS = 48


def read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def fetch_bars(ticker, since_date):
    """Daily closes for a ticker from since_date on: (sorted [(date, close)], currency)."""
    start = datetime.strptime(since_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) - timedelta(days=10)
    query = urllib.parse.urlencode({
        "period1": int(start.timestamp()),
        "period2": int(time.time()),
        "interval": "1d",
    })
    url = CHART_URL.format(urllib.parse.quote(ticker), query)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                result = json.load(response)["chart"]["result"][0]
            break
        except Exception as err:  # network, HTTP or unexpected-shape errors: retry, then give up
            last_error = err
            time.sleep(2 * (attempt + 1))
    else:
        raise RuntimeError(str(last_error))

    meta = result["meta"]
    offset = meta.get("gmtoffset", 0)
    closes = result["indicators"]["quote"][0]["close"]
    session = meta.get("currentTradingPeriod", {}).get("regular", {})
    now = time.time()
    bars = {}
    for stamp, close in zip(result["timestamp"], closes):
        if close is None:
            continue
        if session.get("start", now) <= stamp and now < session.get("end", 0):
            continue  # today's session is still open, so this isn't a closing price yet
        day = datetime.fromtimestamp(stamp + offset, timezone.utc).strftime("%Y-%m-%d")
        bars[day] = round(close, 2)
    return sorted(bars.items()), meta.get("currency", "")


def pct(now, then):
    return round((now / then - 1) * 100, 2)


def thin(series, limit):
    """At most `limit` evenly spaced points, always keeping the first and the last."""
    if len(series) <= limit:
        return series
    step = (len(series) - 1) / (limit - 1)
    return [series[round(i * step)] for i in range(limit)]


def build_row(company, published):
    bars, currency = fetch_bars(company["ticker"], published)
    if not bars:
        raise RuntimeError("no prices returned")

    # Videos go live on Saturdays, so this is normally the Friday close.
    before = [i for i, (day, _) in enumerate(bars) if day <= published]
    after_video = not before  # the company listed after its video
    base_index = before[-1] if before else 0
    base_date, base_price = bars[base_index]
    as_of, price = bars[-1]
    spark = thin(bars[base_index:], SPARK_POINTS)

    return {
        "ticker": company["ticker"],
        "name": company["name"],
        "market": company["market"],
        "video": company["video"],
        "videoDate": published,
        "currency": currency,
        "baseDate": base_date,
        "basePrice": base_price,
        "asOf": as_of,
        "price": price,
        "since": pct(price, base_price),
        "today": pct(price, bars[-2][1]) if len(bars) >= 2 else None,
        "afterVideo": after_video,
        "sparkDates": [day for day, _ in spark],
        "spark": [close for _, close in spark],
    }


def main():
    config = read_json(CONFIG_PATH)
    published = {c["id"]: c["published"][:10] for c in read_json(CASES_PATH)["case_studies"]}

    previous = {}
    if os.path.exists(OUT_PATH):
        try:
            previous = {r["ticker"]: r for r in read_json(OUT_PATH).get("rows", [])}
        except (json.JSONDecodeError, OSError):
            previous = {}

    rows, fetched = [], 0
    for company in config["listed"]:
        ticker = company["ticker"]
        try:
            rows.append(build_row(company, published[company["video"]]))
            fetched += 1
        except Exception as err:
            print(f"::warning::{ticker}: {err}")
            if ticker in previous:
                rows.append(previous[ticker])
        time.sleep(1)

    if not fetched:
        sys.exit("No prices could be fetched; keeping the existing scoreboard.")

    changed = rows != list(previous.values()) or not os.path.exists(OUT_PATH)
    if changed:
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(OUT_PATH, "w", encoding="utf-8") as f:
            json.dump({"updatedAt": stamp, "source": "Yahoo Finance", "rows": rows}, f, indent=1)
            f.write("\n")
    print(f"Fetched {fetched} of {len(config['listed'])} companies; changed: {changed}")

    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")


if __name__ == "__main__":
    main()
