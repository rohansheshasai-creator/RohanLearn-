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
| `assets/js/main.js` | All the interactive bits — animations, live data, charts, ⌘K search |
| `assets/fonts/` | The fonts, hosted on the site itself (fast, nothing loaded from Google) |
| `assets/img/` | Photos, the share-preview image (`og-image.png`) and favicons |
| `assets/latest-video.json` | Latest videos — **updated automatically** (see below) |
| `assets/channel-stats.json` | Subscribers / videos / views — **updated automatically** |
| `assets/stats-history.json` | One data point per day — the growth chart is drawn from this, **updated automatically** |
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

Each page links its CSS and JS with a version (`style.css?v=20261004a`). When you
change either file, change that `v=` value in the four HTML pages (any new text
works) so every visitor gets the new file straight away instead of an old cached one.

---

## Hosting

Hosted on **GitHub Pages** from the `main` branch, with a custom domain set by
the `CNAME` file.
