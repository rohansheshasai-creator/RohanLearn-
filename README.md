# RohanLearn

The website for the [RohanLearn](https://www.youtube.com/@rohanlearn) YouTube channel.
Live at **[rohanlearn.com](https://rohanlearn.com)**.

Built as plain HTML, CSS and JavaScript — there is nothing to install, nothing to
build, and no dependencies to break. Edit a file, save it, done.

---

## What's in here

| File | What it is |
|---|---|
| `index.html` | Home page — hero, latest upload, recent breakdowns, format, about teaser |
| `about.html` | The full About page |
| `contact.html` | Sponsorships & promotions |
| `404.html` | Shown when someone hits a link that doesn't exist |
| `assets/css/style.css` | All the styling — colours, type, layout, motion |
| `assets/js/main.js` | All the interactive bits — scroll animations, counters, live data |
| `assets/img/` | Photos, the share-preview image (`og-image.png`) and favicons |
| `assets/latest-video.json` | Latest videos — **updated automatically** (see below) |
| `assets/channel-stats.json` | Subscribers / videos / views — **updated automatically** |
| `.github/` | The two small automations that keep those two JSON files fresh |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | Search-engine and install metadata |
| `CNAME` | Tells GitHub this site lives at `rohanlearn.com` — **don't delete this** |

---

## Things that update themselves

Two GitHub Actions run in the background. You don't need to do anything.

- **Latest video** (every 6 hours): reads the channel's feed, skips YouTube Shorts,
  and updates `assets/latest-video.json`. The homepage's *Latest upload* player and
  *Recent breakdowns* cards read from it.
- **Channel stats** (daily): updates `assets/channel-stats.json`. The numbers in the
  hero and on the About / Contact pages read from it.

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

*Instrument Serif* (headlines), *Inter* (text) and *JetBrains Mono* (small labels),
loaded from Google Fonts.

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

---

## Hosting

Hosted on **GitHub Pages** from the `main` branch, with a custom domain set by
the `CNAME` file.
