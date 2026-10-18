# RohanLearn

The website for the [RohanLearn](https://www.youtube.com/@rohanlearn) YouTube channel.
Live at **[rohanlearn.com](https://www.rohanlearn.com)**.

Built as plain HTML, CSS and JavaScript — there is nothing to install, nothing to
build, and no dependencies to break. Edit a file, save it, done.

---

## What's in here

| File | What it is |
|---|---|
| `index.html` | Home page — hero, latest upload, recent breakdowns, format, about teaser |
| `about.html` | The full About page |
| `contact.html` | Sponsorships & promotions |
| `privacy.html` | What the site measures and how to switch it off |
| `case-studies/` | The hub page plus one page per video — **generated**, don't edit by hand |
| `content/case-studies.json` | The words on each case-study page (headline, summary, chapters) — **you edit this** |
| `tools/build_case_studies.py` | Rebuilds the case-study pages and `sitemap.xml` from that file |
| `404.html` | Shown when someone hits a link that doesn't exist |
| `assets/css/style.css` | All the styling — colours, type, layout, motion |
| `assets/js/main.js` | All the interactive bits — animations, live data, charts, ⌘K search |
| `assets/fonts/` | The fonts, hosted on the site itself (fast, nothing loaded from Google) |
| `assets/img/` | Photos, the share-preview image (`og-image.jpg`) and favicons |
| `assets/latest-video.json` | Latest videos — **updated automatically** (see below) |
| `assets/channel-stats.json` | Subscribers / videos / views — **updated automatically** |
| `assets/stats-history.json` | One data point per day — the growth chart is drawn from this, **updated automatically** |
| `assets/takeaways.json` | The "3 takeaways inside" teasers under each video — **you edit this** (see below) |
| `assets/coverage.json` | The **Brands I've broken down** wall and the **world map**: which videos cover which company and country — **you edit this** |
| `assets/world-dots.json` | The dot-matrix world map (generated once from Natural Earth; no need to touch) |
| `.github/` | The two small automations that keep those two JSON files fresh |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | Search-engine and install metadata |
| `CNAME` | Tells GitHub this site lives at `rohanlearn.com` — **don't delete this** |

---

## Things that update themselves

Two GitHub Actions run in the background. You don't need to do anything.

- **Latest video** (every 6 hours): reads the channel's feed, skips YouTube Shorts,
  and updates `assets/latest-video.json`. The homepage's *Latest upload* player and
  *Recent breakdowns* cards read from it.
- **Channel stats** (daily): updates `assets/channel-stats.json` and adds a point to
  `assets/stats-history.json`. The numbers in the hero, the growth dashboard and the
  About / Contact pages read from them.

To refresh right after you upload: GitHub → **Actions** → *Update latest video* →
**Run workflow**.

---

## How to change the colours

Open `assets/css/style.css`. The first lines are the design tokens:

```css
--accent: #f0b34a;   /* the one accent colour used everywhere */
--bg:     #09090a;   /* page background */
```

Change the accent and the whole site re-colours itself.

## Fonts

*Instrument Serif* (headlines), *Geist* (text) and *Geist Mono* (small labels and
numbers). All three are open-source (SIL Open Font License) and hosted in
`assets/fonts/`.

## Devices

Built mobile-first and checked from a 360px phone up to a 2560px monitor:
phones (portrait and landscape, notch-safe), iPad (portrait and landscape),
MacBooks and large desktops (text and page width scale up on 1800px+ screens).
Touch screens get bigger tap targets; low-power or data-saver devices get a
"lite" mode (fewer animations, the video waits for a tap); visitors who prefer
reduced motion get a calm, still version.

## "3 takeaways inside" teasers

Under the latest video and each card in *Recent breakdowns* there is a sealed box
with the video's three takeaways, key words blacked out, and a **Watch to unlock all 3**
button. They come from `assets/takeaways.json`.

For a new video, add a line with its id (the part after `v=` in the YouTube link) and
its three takeaways, typing `█` in place of the words you want hidden:

```json
"VIDEO_ID": [
  "Find the ██████ everyone else ██████ ██ ███ █████",
  "Cut costs in the ████ ███, not on the ███████",
  "Keep █████████ after you ███, not just ██████"
]
```

The hidden words are never sent to visitors, so nobody can read them in the page
source. A video with no entry simply shows no box.

## Brands wall and world map

Both are drawn from `assets/coverage.json`. The wall shows the **first 8 brands** in that
list, then a *Show all* button, so keep the list ordered best first. A new video takes
three small edits:

1. Add it under `"videos"`: `"VIDEO_ID": { "t": "Title", "d": "2026-10-17" }`
2. If it is about a company, add a brand:
   `{ "name": "Tesla", "sector": "Electric vehicles", "country": "US", "verdict": "rise", "video": "VIDEO_ID" }`.
   The verdict is one of `rise`, `comeback`, `fall`, `threat` (under threat) or `power` (money & power).
3. Add the video's id to the `"videos"` list of every country it covers. For a new
   country, add `{ "code": "JP", "name": "Japan", "lon": 138, "lat": 37, "videos": ["VIDEO_ID"] }`.
   The 2-letter code lights the country up on the map, and `lon`/`lat` place its pin.

## Subscribe bar and Saturday reminder

- **Subscribe bar:** slides in at the bottom once a visitor scrolls past the first
  screen, with the live subscriber count. It steps aside near the end of the page,
  hides for a week if closed, and for a month once someone clicks any Subscribe link.
- **Remind me every Saturday:** on the countdown card and in the closing section.
  Google Calendar gets a weekly event starting at the next upload;
  `assets/rohanlearn-saturday.ics` is the same event for Apple Calendar and Outlook.
  If the upload time ever changes, update the time in that file and in `nextSlot()`
  in `assets/js/main.js`.

## Visitor analytics (Microsoft Clarity, free)

Clarity shows how people use the site: visitor numbers, pages, countries, devices,
where they came from, **heatmaps** and anonymous **session recordings**.

**To switch it on:** open `assets/js/main.js`, find `var CLARITY_ID = "";` (near the
bottom, section 18) and paste your Project ID between the quotes, then push. Until
then nothing is loaded. It never runs on `localhost`, so testing at home doesn't
pollute your numbers.

The site also sends named events you can filter recordings by (Clarity → Recordings →
Filters → Custom events), for example:

| Event | Means |
|---|---|
| `subscribe_sticky_bar`, `subscribe_takeaways`, `subscribe_top_bar`, `subscribe_closing`, `subscribe_hero`, `subscribe_menu`, `subscribe_footer`, `subscribe_case_page` | Clicked Subscribe, and where |
| `takeaways_peek` / `takeaways_unlock` | Opened a takeaways box / clicked "Watch to unlock" |
| `watch_latest`, `watch_from_announcement`, `watch_from_case_page` | Clicked through to YouTube, and from where |
| `case_from_recent`, `case_from_brands`, `case_from_map`, `case_from_hub`, `case_from_related`, `chapter_click`, `hub_filter_…` | Opened a case-study page, and from where |
| `reminder_open`, `reminder_google`, `reminder_apple` | Saturday reminder |
| `brands_filter_…`, `brands_show_all`, `map_in`, `map_us`… | Used the brands wall / world map |
| `theme_light` / `theme_dark`, `search_open`, `search_pick`, `faq_open`, `email_click`, `email_copy` | Everything else |

Visitors can switch analytics off on the [privacy page](privacy.html), and browsers
that send *Global Privacy Control* are never tracked. In Clarity's settings keep
**Masking** on *Balanced* or *Strict*.

## Case-study pages (SEO)

Every video has its own page at `/case-studies/<name>/`, with the video, a written
summary, clickable chapters, the sealed takeaways, and Google video markup (so search
results can show the thumbnail, length and "key moments"). `/case-studies/` lists them all.

**For a new video:** add an entry to `content/case-studies.json` (copy an existing one),
then run:

```bash
python3 tools/build_case_studies.py
```

That rebuilds every page and `sitemap.xml`. (Or just ask Claude: "add the new video".)

The site's address is **https://www.rohanlearn.com** (with www); every page, the
sitemap and robots.txt use it.

## Light and dark mode

Dark is the default (and the original look) for everyone. The **Light mode / Dark
mode** button in the top bar switches themes, and the choice is remembered on that
device. It also appears in the ⌘K palette as *Switch to light/dark mode*.

All colours live in the tokens at the top of `assets/css/style.css`: the `:root`
block is dark, and the `:root[data-theme="light"]` block right under it is light.
To tweak the light theme, change values there. The theme is set by a tiny script in
each page's `<head>` so there is no flash of the wrong colours while loading.

## Handy shortcuts for visitors

Press **⌘K** (Mac) or **Ctrl+K** — or **/** — anywhere on the site to open the
search palette: pages, the latest videos, social links and quick actions.

---

## Previewing it on your computer

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. (Opening the files by double-click mostly works,
but the live data needs a local server.)

## Publishing your changes

Commit, then push (GitHub Desktop → **Push origin**). GitHub Pages redeploys
automatically, usually within a minute. Browsers keep files for up to 10 minutes,
so use a hard refresh (Cmd+Shift+R) or a private window to see changes immediately.

Each page links its CSS and JS with a version (`style.css?v=20261018a`). When you
change either file, change that `v=` value in the four HTML pages (any new text
works) so every visitor gets the new file straight away instead of an old cached one.

---

## Hosting

Hosted on **GitHub Pages** from the `main` branch, with a custom domain set by
the `CNAME` file.
