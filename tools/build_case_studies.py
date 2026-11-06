#!/usr/bin/env python3
"""
Builds the case-study pages from content/case-studies.json.

    python3 tools/build_case_studies.py

Writes:
  case-studies/index.html            the hub page (every breakdown, filterable)
  case-studies/<slug>/index.html     one page per video
  scoreboard/index.html              the share-price scoreboard (companies from content/scoreboard.json)
  sitemap.xml                        every page on the site
  assets/coverage.json               adds each video's page address ("s")

The pages reuse contact.html's head, top bar and footer, so a change there
(nav, fonts, theme) carries over the next time this runs. No dependencies.
"""
import html, json, re, os
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.rohanlearn.com"
CHANNEL = "https://www.youtube.com/@rohanlearn"
SUB = CHANNEL + "?sub_confirmation=1"
IST = timezone(timedelta(hours=5, minutes=30))
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
CATS = [("business", "Business"), ("economy", "Economy"), ("geopolitics", "Geopolitics")]
CAT = dict(CATS)
COUNTRY = {"IN": "India", "US": "United States", "CN": "China", "RU": "Russia", "IR": "Iran", "GB": "United Kingdom",
           "NL": "Netherlands", "SG": "Singapore", "VE": "Venezuela", "BR": "Brazil", "ZA": "South Africa"}

e = lambda s: html.escape(str(s), quote=True)


def read(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


def write(p, s):
    full = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(s)


def when(iso):
    t = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(IST)
    return t


def nice_date(iso):
    t = when(iso)
    return "%d %s %d" % (t.day, MONTHS[t.month - 1], t.year)


def secs(dur):  # PT10M27S -> 627
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", dur)
    h, mi, s = (int(x or 0) for x in m.groups())
    return h * 3600 + mi * 60 + s


def mins(dur):
    return "%d min" % max(1, round(secs(dur) / 60))


def tsecs(t):  # "1:28" or "1:02:03"
    parts = [int(x) for x in t.split(":")]
    total = 0
    for p in parts:
        total = total * 60 + p
    return total


def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=1).replace("</", "<\\/") + "\n</script>"


# ---------- page shell, taken from contact.html ----------
SRC = read("contact.html")
HEAD_END = SRC.index("</head>")
MAIN_START = SRC.index('<main id="main">')
MAIN_END = SRC.index("</main>") + len("</main>")


def absolutize(s):
    s = re.sub(r'(href|src)="(?!https?:|mailto:|tel:|#|/|data:)([^"]*)"', r'\1="/\2"', s)
    return s.replace('href="/index.html"', 'href="/"')


def shell(title, desc, url, og_title, og_desc, image, og_type, schema, main, current=("/case-studies/", "Case studies")):
    head = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', "", SRC[:HEAD_END], flags=re.S)  # the template page's own markup
    head = re.sub(r"<title>.*?</title>", "<title>%s</title>" % e(title), head, count=1)
    head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % e(desc), head, count=1)
    head = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % url, head, count=1)
    head = re.sub(r'<meta property="og:type" content="[^"]*">', '<meta property="og:type" content="%s">' % og_type, head, count=1)
    head = re.sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % url, head, count=1)
    head = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % e(og_title), head, count=1)
    head = re.sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % e(og_desc), head, count=1)
    head = re.sub(r'<meta property="og:image" content="[^"]*">', '<meta property="og:image" content="%s">' % image, head, count=1)
    head = re.sub(r'<meta name="twitter:image" content="[^"]*">',
                  '<meta name="twitter:image" content="%s">\n<meta name="twitter:title" content="%s">\n<meta name="twitter:description" content="%s">'
                  % (image, e(og_title), e(og_desc)), head, count=1)
    head += schema + "\n"
    body = SRC[HEAD_END:MAIN_START] + main + SRC[MAIN_END:]
    body = body.replace(' aria-current="page"', "")
    page = absolutize(head + body)
    href, label = current
    page = page.replace('<a href="%s">%s</a>' % (href, label), '<a href="%s" aria-current="page">%s</a>' % (href, label), 1)
    return page


def crumbs_html(items):
    out = []
    for i, (name, href) in enumerate(items):
        if href and i < len(items) - 1:
            out.append('<li><a href="%s">%s</a></li>' % (href, e(name)))
        else:
            out.append('<li aria-current="page">%s</li>' % e(name))
    return '<nav class="crumbs" aria-label="Breadcrumb" data-reveal><ol>' + "".join(out) + "</ol></nav>"


def crumbs_ld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + (h or "")} for i, (n, h) in enumerate(items)]}


def clock(dur):  # PT10M27S -> 10:27 (the badge on a thumbnail)
    t = secs(dur)
    h, rem = divmod(t, 3600)
    m, sec = divmod(rem, 60)
    return "%d:%02d:%02d" % (h, m, sec) if h else "%d:%02d" % (m, sec)


def card(c, heading="h3", lede=True):
    q = (c["h1"] + " " + c["title"] + " " + " ".join(COUNTRY.get(x, x) for x in c["countries"])).lower()
    return ('<article class="cs-card" data-cat="%s" data-q="%s">'
            '<a class="cs-card__link" href="/case-studies/%s/">'
            '<span class="cs-card__thumb"><img src="https://i.ytimg.com/vi/%s/mqdefault.jpg" width="320" height="180" alt="" loading="lazy" decoding="async">'
            '<span class="cs-card__dur">%s</span></span>'
            '<span class="cs-card__meta"><span class="cs-card__cat">%s</span><span>%s</span></span>'
            '<%s class="cs-card__title">%s</%s>'
            '%s'
            "</a></article>") % (
        c["cat"], e(q), c["slug"], c["id"], clock(c["duration"]),
        CAT[c["cat"]], nice_date(c["published"]),
        heading, e(c["h1"]), heading,
        ('<span class="cs-card__lede">%s</span>' % e(c["lede"])) if lede else "")


def build():
    data = json.loads(read("content/case-studies.json"))
    items = sorted(data["case_studies"], key=lambda c: c["published"], reverse=True)
    org = {"@type": "Organization", "@id": SITE + "/#org", "name": "RohanLearn", "url": SITE + "/",
           "logo": SITE + "/assets/img/apple-touch-icon.png"}

    # ---------- one page per video ----------
    for c in items:
        url = "%s/case-studies/%s/" % (SITE, c["slug"])
        watch = "https://www.youtube.com/watch?v=" + c["id"]
        thumb = "https://i.ytimg.com/vi/%s/maxresdefault.jpg" % c["id"]
        total = secs(c["duration"])
        crumbs = [("Home", "/"), ("Case studies", "/case-studies/"), (c["h1"], None)]

        clips = []
        ch = c.get("chapters") or []
        for i, chp in enumerate(ch):
            start = tsecs(chp["t"])
            end = tsecs(ch[i + 1]["t"]) if i + 1 < len(ch) else total
            if end > start:
                clips.append({"@type": "Clip", "name": chp["label"], "startOffset": start, "endOffset": end,
                              "url": "%s&t=%d" % (watch, start)})
        video = {"@type": "VideoObject", "@id": url + "#video", "name": c["title"], "description": c["desc"],
                 "thumbnailUrl": [thumb, "https://i.ytimg.com/vi/%s/hqdefault.jpg" % c["id"]],
                 "uploadDate": when(c["published"]).isoformat(), "duration": c["duration"],
                 "embedUrl": "https://www.youtube.com/embed/" + c["id"], "url": watch,
                 "inLanguage": "en", "publisher": {"@id": SITE + "/#org"},
                 "author": {"@type": "Person", "name": "Rohan", "url": SITE + "/about.html"}}
        if clips:
            video["hasPart"] = clips
        page_ld = {"@type": "WebPage", "@id": url, "url": url, "name": c["seo"], "description": c["desc"],
                   "primaryImageOfPage": thumb, "mainEntity": {"@id": url + "#video"},
                   "isPartOf": {"@type": "WebSite", "@id": SITE + "/#website"}}
        schema = ld({"@context": "https://schema.org", "@graph": [page_ld, video, crumbs_ld(crumbs), org]})

        chapters_html = ""
        if ch:
            rows = "".join('<li><a href="%s&amp;t=%d" target="_blank" rel="noopener"><span class="cs-ch__t">%s</span><span>%s</span></a></li>'
                           % (watch, tsecs(x["t"]), e(x["t"]), e(x["label"])) for x in ch)
            chapters_html = '<h2>Inside this breakdown</h2><ol class="cs-ch">' + rows + "</ol>"

        same = [x for x in items if x is not c and x["cat"] == c["cat"]]
        rest = [x for x in items if x is not c and x["cat"] != c["cat"]]
        related = (same + rest)[:3]

        facts = [("Published", nice_date(c["published"])), ("Length", mins(c["duration"])), ("Topic", CAT[c["cat"]])]
        if c.get("series"):
            facts.append(("Series", c["series"]))
        if c["countries"]:
            facts.append(("Countries", ", ".join(COUNTRY.get(x, x) for x in c["countries"])))
        facts_html = "".join("<div><dt>%s</dt><dd>%s</dd></div>" % (e(k), e(v)) for k, v in facts)

        eyebrow = CAT[c["cat"]] + (" · " + c["series"] if c.get("series") else "")
        main = f'''<main id="main">

  <section class="phero cs-hero">
    <div class="wrap">
      {crumbs_html(crumbs)}
      <span class="eyebrow" data-reveal>{e(eyebrow)}</span>
      <h1 class="cs-title" data-split>{e(c["h1"])}</h1>
      <p class="phero__sub" data-reveal style="--d:.25s">{e(c["lede"])}</p>
    </div>
  </section>

  <section class="section section--tight cs-sec">
    <div class="wrap cs-grid">
      <div class="cs-main">
        <div class="cs-player frame" data-reveal style="background-image:url(https://i.ytimg.com/vi/{c["id"]}/hqdefault.jpg)">
          <iframe src="https://www.youtube-nocookie.com/embed/{c["id"]}?rel=0" title="{e(c["title"])}" loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        <div class="cs-body" data-reveal>
          <h2>The story</h2>
          {"".join("<p>%s</p>" % e(p) for p in c["body"])}
          {chapters_html}
        </div>
      </div>
      <aside class="cs-aside" data-reveal style="--d:.1s">
        <div class="cs-seal" data-seal-id="{c["id"]}"></div>
        <div class="cs-move" data-move-id="{c["id"]}" hidden></div>
        <dl class="cs-facts">{facts_html}</dl>
        <div class="cs-actions">
          <a class="btn btn--yt" href="{watch}" target="_blank" rel="noopener"><svg><use href="#i-yt"/></svg> Watch on YouTube</a>
          <a class="btn btn--ghost" href="{SUB}" target="_blank" rel="noopener"><span class="btn__dot"></span> Subscribe</a>
        </div>
      </aside>
    </div>
  </section>

  <section class="section section--tight cs-more">
    <div class="wrap">
      <header class="shead shead--split">
        <h2 class="shead__title" data-split>More case studies</h2>
        <a class="link-arrow" href="/case-studies/" data-reveal>All case studies <svg><use href="#i-arrow"/></svg></a>
      </header>
      <div class="cs-cards cs-cards--3" data-reveal>
        {"".join(card(x) for x in related)}
      </div>
    </div>
  </section>

</main>'''
        page = shell("%s | RohanLearn" % c["seo"], c["desc"], url, c["seo"], c["desc"], thumb, "article", schema, main)
        write("case-studies/%s/index.html" % c["slug"], page)

    # ---------- hub ----------
    url = SITE + "/case-studies/"
    counts = {k: sum(1 for c in items if c["cat"] == k) for k, _ in CATS}
    chips = '<button class="bchip" type="button" data-f="all" aria-pressed="true"><span>All</span><small>%d</small></button>' % len(items)
    chips += "".join('<button class="bchip" type="button" data-f="%s" aria-pressed="false"><span>%s</span><small>%d</small></button>' % (k, n, counts[k])
                     for k, n in CATS if counts[k])
    hub_desc = "Every RohanLearn breakdown in one place: %d case studies on companies, economies and geopolitics, from Walmart and Nvidia to BRICS and the rupee." % len(items)
    crumbs = [("Home", "/"), ("Case studies", None)]
    schema = ld({"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "@id": url, "url": url, "name": "Case studies", "description": hub_desc,
         "isPartOf": {"@type": "WebSite", "@id": SITE + "/#website"},
         "mainEntity": {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": [
             {"@type": "ListItem", "position": i + 1, "url": "%s/case-studies/%s/" % (SITE, c["slug"]), "name": c["h1"]}
             for i, c in enumerate(items)]}},
        crumbs_ld(crumbs), org]})
    main = f'''<main id="main">

  <section class="phero cs-hero">
    <div class="wrap">
      {crumbs_html(crumbs)}
      <span class="eyebrow" data-reveal>Case studies</span>
      <h1 class="phero__title" data-split>Every breakdown, <em>in one place.</em></h1>
      <p class="phero__sub" data-reveal style="--d:.3s">{len(items)} case studies on money, power and strategy: the companies that rose and fell, the economies behind your prices, and the geopolitics behind the headlines.</p>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap">
      <div class="cs-tools" data-reveal>
        <div class="bfilter cs-filter" role="group" aria-label="Filter by topic">{chips}</div>
        <label class="cs-search"><svg aria-hidden="true"><use href="#i-search"/></svg><span class="sr-only">Search case studies</span>
          <input type="search" placeholder="Search: Jaguar, rupee, China…" autocomplete="off" spellcheck="false"></label>
      </div>
      <div class="cs-cards cs-cards--hub" id="cs-list" data-reveal style="--d:.1s">
        {"".join(card(c, "h2", lede=False) for c in items)}
      </div>
      <p class="cs-empty" hidden>No case study matches that yet. Try another word.</p>
    </div>
  </section>

</main>'''
    page = shell("Case Studies: Business, Economy & Geopolitics | RohanLearn", hub_desc, url,
                 "RohanLearn case studies", hub_desc, SITE + "/assets/img/og-image.jpg", "website", schema, main)
    write("case-studies/index.html", page)

    # ---------- scoreboard (the prices are filled in from assets/scoreboard.json) ----------
    board = json.loads(read("content/scoreboard.json"))
    by_id = {c["id"]: c for c in items}
    url = SITE + "/scoreboard/"
    rows = ""
    for co in board["listed"]:
        c = by_id[co["video"]]
        symbol = co["ticker"].split(".")[0]
        sub = ("via %s &middot; " % e(co["via"]) if co.get("via") else "") + "%s &middot; %s" % (e(symbol), e(co["exchange"]))
        rows += ('<tr class="sb-row" data-ticker="%s" data-market="%s" data-name="%s" data-date="%s">'
                 '<th scope="row" class="sb-co"><a class="sb-co__link" href="/case-studies/%s/">%s</a><span class="sb-co__sub">%s</span></th>'
                 '<td class="sb-vid">%s</td><td class="sb-num sb-base">&mdash;</td><td class="sb-num sb-now">&mdash;</td>'
                 '<td class="sb-num sb-day">&mdash;</td><td class="sb-spark"></td><td class="sb-num sb-since">&mdash;</td></tr>') % (
            e(co["ticker"]), e(co["market"]), e(co["name"].lower()), c["published"][:10], c["slug"], e(co["name"]), sub, nice_date(c["published"]))
    off = "".join('<li><a href="/case-studies/%s/"><strong>%s</strong><span>%s</span></a></li>' % (by_id[x["video"]]["slug"], e(x["name"]), e(x["status"]))
                  for x in board["unlisted"])
    markets = [("India", "India"), ("US", "United States")]
    sb_chips = '<button class="bchip" type="button" data-f="all" aria-pressed="true"><span>All</span><small>%d</small></button>' % len(board["listed"])
    sb_chips += "".join('<button class="bchip" type="button" data-f="%s" aria-pressed="false"><span>%s</span><small>%d</small></button>'
                        % (k, n, sum(1 for x in board["listed"] if x["market"] == k)) for k, n in markets)
    sb_desc = "How the share prices of the companies in RohanLearn's case studies have moved since each video went live, from Microsoft and Nvidia to Jio and Maruti Suzuki."
    crumbs = [("Home", "/"), ("Scoreboard", None)]
    schema = ld({"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url, "url": url, "name": "Scoreboard", "description": sb_desc,
         "isPartOf": {"@type": "WebSite", "@id": SITE + "/#website"}},
        crumbs_ld(crumbs), org]})
    main = f'''<main id="main">

  <section class="phero cs-hero">
    <div class="wrap">
      {crumbs_html(crumbs)}
      <span class="eyebrow" data-reveal>Scoreboard</span>
      <h1 class="phero__title" data-split>What happened <em>after the video.</em></h1>
      <p class="phero__sub" data-reveal style="--d:.3s">Every listed company I've broken down, and how its share price has moved since the video went live. Updated after each market closes.</p>
    </div>
  </section>

  <section class="section section--tight sb-sec">
    <div class="wrap">
      <dl class="sb-stats" data-reveal>
        <div><dt>Companies tracked</dt><dd data-sb="tracked">{len(board["listed"])}</dd></div>
        <div><dt>Up since the video</dt><dd data-sb="up">&mdash;</dd></div>
        <div><dt>Biggest gain</dt><dd data-sb="best">&mdash;</dd></div>
        <div><dt>Biggest drop</dt><dd data-sb="worst">&mdash;</dd></div>
      </dl>

      <div class="sb-tools" data-reveal style="--d:.1s">
        <div class="bfilter sb-filter" role="group" aria-label="Filter by market">{sb_chips}</div>
        <p class="sb-asof" role="status">Loading prices&hellip;</p>
      </div>

      <div class="sb-tablewrap" data-reveal style="--d:.15s">
        <table class="sb-table">
          <caption class="sr-only">Share prices of companies covered in RohanLearn case studies, since each video went live</caption>
          <thead><tr>
            <th scope="col" class="sb-th-co" aria-sort="none"><button class="sb-sort" type="button" data-k="name">Company</button></th>
            <th scope="col" class="sb-vid" aria-sort="none"><button class="sb-sort" type="button" data-k="date">Video</button></th>
            <th scope="col" class="sb-num sb-base">At the video</th>
            <th scope="col" class="sb-num sb-now">Now</th>
            <th scope="col" class="sb-num sb-day" aria-sort="none"><button class="sb-sort" type="button" data-k="today">Last day</button></th>
            <th scope="col" class="sb-spark"><span class="sr-only">Price trend</span></th>
            <th scope="col" class="sb-num sb-since" aria-sort="descending"><button class="sb-sort" type="button" data-k="since">Since video</button></th>
          </tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </div>

      <div class="sb-below">
        <div class="sb-off" data-reveal>
          <h2>No share price to track</h2>
          <ul>{off}</ul>
        </div>
        <div class="sb-how" data-reveal style="--d:.1s">
          <h2>How to read this</h2>
          <ul>
            <li><strong>Since video</strong> compares the last closing price on or before the day the video went live with the latest close. Dividends aren't included.</li>
            <li><strong>Via</strong> means the shares belong to the company behind the brand, so the price reflects that whole business, not the brand alone.</li>
            <li><strong>Since listing</strong> marks a company that began trading after its video. It is measured from its first day's close and left out of the totals above.</li>
            <li>Each price is in the stock's own currency, from <a href="https://finance.yahoo.com/" target="_blank" rel="noopener">Yahoo Finance</a>, and may be delayed or occasionally wrong.</li>
          </ul>
          <p class="sb-legal">This is a record of what happened, not a prediction, a recommendation or investment advice. A price move doesn't prove a video right or wrong.</p>
        </div>
      </div>
    </div>
  </section>

</main>'''
    page = shell("Scoreboard: Share Prices Since Each Video | RohanLearn", sb_desc, url, "The RohanLearn Scoreboard", sb_desc,
                 SITE + "/assets/img/og-image.jpg", "website", schema, main, current=("/scoreboard/", "Scoreboard"))
    write("scoreboard/index.html", page)

    # ---------- page addresses for the rest of the site ----------
    cov = json.loads(read("assets/coverage.json"))
    for c in items:
        v = cov["videos"].setdefault(c["id"], {"t": c["title"], "d": c["published"][:10]})
        v["s"] = c["slug"]
    write("assets/coverage.json", json.dumps(cov, ensure_ascii=False, indent=1) + "\n")

    # ---------- sitemap ----------
    today = datetime.now(IST).strftime("%Y-%m-%d")
    urls = [(SITE + "/", today, "1.0"), (SITE + "/case-studies/", today, "0.9"), (SITE + "/scoreboard/", today, "0.8"),
            (SITE + "/about.html", today, "0.7"), (SITE + "/contact.html", today, "0.6"), (SITE + "/privacy.html", "2026-10-18", "0.2")]
    urls += [("%s/case-studies/%s/" % (SITE, c["slug"]), when(c["published"]).strftime("%Y-%m-%d"), "0.8") for c in items]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "".join("  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n" % u for u in urls)
    xml += "</urlset>\n"
    write("sitemap.xml", xml)
    print("built %d case-study pages + hub + sitemap (%d URLs)" % (len(items), len(urls)))


if __name__ == "__main__":
    build()
