# RohanLearn

The website for the [RohanLearn](https://www.youtube.com/@rohanlearn) YouTube channel.
Live at **[rohanlearn.com](https://rohanlearn.com)**.

Built as plain HTML, CSS and JavaScript — there is nothing to install, nothing to
build, and no dependencies to break. Edit a file, save it, done.

---

## What's in here

| File | What it is |
|---|---|
| `index.html` | The home page — channel intro + a short "about me" section |
| `about.html` | The full About Me page |
| `404.html` | Shown when someone hits a link that doesn't exist |
| `assets/css/style.css` | All the styling (colours, layout, animations) |
| `assets/js/main.js` | All the interactive bits (scroll reveals, hover effects, counters) |
| `assets/img/` | Put your photos here |
| `CNAME` | Tells GitHub that this site lives at `rohanlearn.com` — **don't delete this** |

---

## How to change the text

Open `index.html` or `about.html` in any text editor. Every spot that's meant
to be personalised is marked with a comment like this:

```html
<!-- EDIT: your channel's one-line pitch -->
```

Search for `EDIT:` to find them all. Change the words between the tags, save,
and push (see below).

## How to add your photo

1. Save your photo as `assets/img/rohan.jpg`
2. In `index.html`, find the block marked `EDIT: to use a real photo`
3. Replace the whole `<div class="avatar">…</div>` block with:

```html
<img src="assets/img/rohan.jpg" alt="Rohan" class="avatar-img">
```

4. Do the same in `about.html` (use `class="avatar-img avatar-img--lg"` there)

## How to change the colours

Open `assets/css/style.css`. The first few lines look like this:

```css
--accent:   #7c5cff;   /* violet */
--accent-2: #22d3ee;   /* cyan   */
```

Change those two hex codes and the entire site re-colours itself.

---

## Previewing it on your computer

Just double-click `index.html` — it opens straight in your browser.

For a more accurate preview (closer to how it behaves live), run this in the
project folder and then open http://localhost:8000:

```bash
python3 -m http.server 8000
```

## Publishing your changes

From inside this folder:

```bash
git add -A && git commit -m "Update site" && git push
```

GitHub Pages redeploys automatically, usually within a minute.

---

## Hosting

Hosted on **GitHub Pages** from the `main` branch, with a custom domain set by
the `CNAME` file.
