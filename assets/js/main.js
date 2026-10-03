/* ============================================================
   RohanLearn — interactions & motion
   Plain JavaScript, no libraries. Every effect degrades to a normal,
   fully readable page if this file fails to load or the visitor has
   "reduce motion" switched on.

   Contents: 1 helpers · 2 shared data · 3 nav · 4 reveal · 5 live
   stats & counters · 6 videos · 7 announcement · 8 hero cards ·
   9 growth dashboard · 10 walkthrough · 11 FAQ · 12 toast & copy ·
   13 command palette · 14 pointer effects
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 1. Helpers ---------- */
  var d = document;
  var root = d.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO  = "IntersectionObserver" in window;
  var EMAIL  = "knowledgegrowthhubb@gmail.com";

  function $(s, c)  { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function fetchJSON(url) {
    return fetch(url, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Dates are shown in IST (the channel's timezone) with fixed month names,
  // so every visitor sees the same thing regardless of browser or locale.
  function fmtDate(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return "";
    var ist = new Date(t + 19800000); // +5:30
    return ist.getUTCDate() + " " + MONTHS[ist.getUTCMonth()] + " " + ist.getUTCFullYear();
  }
  function dayToMs(day) { var p = day.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function fmtDay(day, withYear) {
    var t = new Date(dayToMs(day));
    return t.getUTCDate() + " " + MONTHS[t.getUTCMonth()] + (withYear ? " " + t.getUTCFullYear() : "");
  }
  function num(n) { return Math.round(n).toLocaleString("en-US"); }

  var svgNS = "http://www.w3.org/2000/svg";

  /* ---------- 2. Shared data (each file is fetched once) ---------- */
  var videosReq  = fetchJSON("assets/latest-video.json");
  var statsReq   = fetchJSON("assets/channel-stats.json");
  var historyReq = fetchJSON("assets/stats-history.json").then(function (data) {
    return data && data.points && data.points.length > 1 ? data.points : null;
  });

  function getVideos(data) {
    if (!data) return [];
    if (data.videos && data.videos.length) return data.videos;
    return data.videoId ? [{ id: data.videoId, title: data.title, publishedAt: data.publishedAt }] : [];
  }

  /* ---------- 3. Nav ---------- */
  var nav = $(".nav");
  var bar = $(".progress");
  var announce = $(".announce");

  function updateAnnounceOffset() {
    var h = (announce && !announce.classList.contains("is-gone")) ? announce.offsetHeight : 0;
    root.style.setProperty("--ann", Math.max(0, h - (window.scrollY || 0)) + "px");
  }
  function onScroll() {
    var y = window.scrollY || 0;
    if (nav) nav.classList.toggle("is-scrolled", y > 8);
    if (bar) {
      var h = root.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(y / h, 1) : 0) + ")";
    }
    updateAnnounceOffset();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateAnnounceOffset);
  onScroll();

  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  (function initNavIndicator() {
    var links = $(".nav__links");
    if (!links) return;
    var ind    = $(".nav__ind", links);
    var items  = $$("a", links);
    var active = items.filter(function (a) { return a.getAttribute("aria-current") === "page"; })[0];

    function place(el) {
      if (!el) { ind.style.opacity = 0; return; }
      ind.style.opacity = 1;
      ind.style.width = (el.offsetWidth - 32) + "px";
      ind.style.transform = "translateX(" + (el.offsetLeft + 16) + "px)";
    }
    items.forEach(function (a) {
      a.addEventListener("pointerenter", function () { place(a); });
      a.addEventListener("focus", function () { place(a); });
    });
    links.addEventListener("pointerleave", function () { place(active); });
    window.addEventListener("resize", function () { place(active); });

    ind.style.transition = "none";
    place(active);
    void ind.offsetWidth;
    ind.style.transition = "";
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { place(active); });
  })();

  (function initMenu() {
    var burger = $(".burger");
    var menu = $(".menu");
    if (!burger || !menu) return;
    function setOpen(open) {
      root.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("aria-hidden", String(!open));
    }
    burger.addEventListener("click", function () { setOpen(!root.classList.contains("menu-open")); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 760) setOpen(false); });
  })();

  /* ---------- 4. Split headings + reveal on scroll ---------- */
  function splitWords(el) {
    var idx = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = d.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(" ")); return; }
            var w  = d.createElement("span");
            var wi = d.createElement("span");
            w.className = "w";
            wi.className = "wi";
            wi.textContent = part;
            wi.style.setProperty("--i", idx++);
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
  }
  $$("[data-split]").forEach(splitWords);

  var revealTargets = $$("[data-split], [data-reveal], [data-stage], [data-observe], .tl");
  if (!hasIO || reduce) {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. Live stats + count-up ---------- */
  function formatStat(n) {
    if (n >= 1000) return { count: Math.round(n / 1000), suffix: "K+" };
    return { count: n, suffix: "+" };
  }

  function applyStats(stats) {
    if (!stats) return;
    $$("[data-stat]").forEach(function (el) {
      var key = el.dataset.stat;
      if (stats[key] == null) return;
      var f = formatStat(stats[key]);
      el.dataset.count = f.count;
      el.dataset.suffix = f.suffix;
      if (el.dataset.done) el.textContent = f.count.toLocaleString() + f.suffix;
    });
    $$("[data-live]").forEach(function (el) {
      var key = el.dataset.live;
      if (stats[key] == null) return;
      var f = formatStat(stats[key]);
      el.textContent = f.count.toLocaleString() + f.suffix;
    });
  }

  function countTo(el, target, suffix, dur, onDone) {
    var start = null;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString("en-US") + (suffix || "");
      if (p < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  }

  (function initCounters() {
    var counters = $$("[data-stat][data-count]");
    if (!counters.length) { statsReq.then(applyStats); return; }

    // give the live numbers a brief head start before the count-up reads them
    Promise.race([statsReq, new Promise(function (r) { setTimeout(function () { r(null); }, 1200); })])
      .then(function (stats) {
        applyStats(stats);
        if (reduce || !hasIO) {
          counters.forEach(function (el) {
            el.textContent = (parseFloat(el.dataset.count) || 0).toLocaleString() + (el.dataset.suffix || "");
            el.dataset.done = "1";
          });
          return;
        }
        counters.forEach(function (el) { el.textContent = "0" + (el.dataset.suffix || ""); });
        var co = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            countTo(el, parseFloat(el.dataset.count) || 0, el.dataset.suffix || "", 1700, function () { el.dataset.done = "1"; });
            co.unobserve(el);
          });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { co.observe(el); });
      });
    statsReq.then(applyStats); // late arrivals still update
  })();

  /* ---------- 6. Latest video + recent breakdowns ---------- */
  function buildCard(v, i) {
    var a = d.createElement("a");
    a.className = "vcard is-in";
    a.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(v.id);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("data-reveal", "");
    a.style.setProperty("--d", (i % 3) * 0.1 + "s");

    var thumb = d.createElement("div");
    thumb.className = "vcard__thumb";
    var img = d.createElement("img");
    img.width = 1280; img.height = 720; img.alt = ""; img.loading = "lazy";
    img.src = "https://i.ytimg.com/vi/" + v.id + "/maxresdefault.jpg";
    img.onerror = function () { img.onerror = null; img.src = "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg"; };
    var play = d.createElement("span");
    play.className = "vcard__play";
    play.innerHTML = '<svg><use href="#i-play"/></svg>';
    thumb.appendChild(img);
    thumb.appendChild(play);

    var date = d.createElement("span");
    date.className = "vcard__date";
    date.textContent = fmtDate(v.publishedAt);

    var title = d.createElement("h3");
    title.className = "vcard__title";
    title.textContent = v.title;

    a.appendChild(thumb); a.appendChild(date); a.appendChild(title);
    return a;
  }

  (function initLatestVideo() {
    var frame = $("#latest-video-frame");
    var grid  = $("#vgrid");
    if (!frame && !grid) return;

    videosReq.then(function (data) {
      var vids = getVideos(data);
      if (!vids.length) return;
      var latest = vids[0];

      if (frame && latest.id && latest.id !== frame.dataset.fallbackId) {
        frame.src = "https://www.youtube.com/embed/" + latest.id + "?autoplay=1&mute=1&playsinline=1&rel=0";
      }
      if (frame && latest.title) frame.title = latest.title;

      var t = $(".js-latest-title"); if (t && latest.title) t.textContent = latest.title;
      var dt = $(".js-latest-date"); if (dt && latest.publishedAt) dt.textContent = fmtDate(latest.publishedAt);
      var lk = $(".js-latest-link"); if (lk && latest.id) lk.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(latest.id);

      if (grid && vids.length >= 4) {
        var rest = vids.slice(1);
        var n = rest.length >= 6 ? 6 : 3;
        grid.textContent = "";
        rest.slice(0, n).forEach(function (v, i) { grid.appendChild(buildCard(v, i)); });
      }
    });
  })();

  /* ---------- 7. Announcement bar ---------- */
  (function initAnnounce() {
    if (!announce) return;
    var KEY = "rl-announce-dismissed";
    var link  = $(".announce__link", announce);
    var close = $(".announce__close", announce);
    function idOf(href) { var m = /[?&]v=([\w-]+)/.exec(href || ""); return m ? m[1] : ""; }
    function dismissed(id) { try { return localStorage.getItem(KEY) === id; } catch (e) { return false; } }
    function hide() { announce.classList.add("is-gone"); updateAnnounceOffset(); }

    if (dismissed(idOf(link.href))) hide();
    close.addEventListener("click", function () {
      try { localStorage.setItem(KEY, idOf(link.href)); } catch (e) { /* private mode */ }
      hide();
    });

    videosReq.then(function (data) {
      var latest = getVideos(data)[0];
      if (!latest) return;
      link.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(latest.id);
      var t = $(".js-announce-title", announce);
      if (t) t.textContent = latest.title;
      if (dismissed(latest.id)) hide();
      else { announce.classList.remove("is-gone"); updateAnnounceOffset(); }
    });
    updateAnnounceOffset();
  })();

  /* ---------- 8. Hero cards: upload countdown + subscriber sparkline ---------- */
  // Uploads go live every Saturday at 7:02 PM IST = 13:32 UTC.
  function nextSlot(now) {
    var slot = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13, 32, 0));
    slot.setUTCDate(slot.getUTCDate() + ((6 - slot.getUTCDay() + 7) % 7));
    if (slot.getTime() <= now.getTime()) slot.setUTCDate(slot.getUTCDate() + 7);
    return slot;
  }

  (function initCountdown() {
    var dEl = $(".js-cd-d");
    if (!dEl) return;
    var hEl = $(".js-cd-h"), mEl = $(".js-cd-m"), sEl = $(".js-cd-s"), label = $(".js-next-label");
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function tick() {
      var now = new Date();
      var next = nextSlot(now);
      var sinceDrop = now.getTime() - (next.getTime() - 7 * 864e5);
      if (label) label.textContent = sinceDrop < 3 * 36e5 ? "Out now" : "Next upload";
      var diff = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
      dEl.textContent = pad(Math.floor(diff / 86400));
      hEl.textContent = pad(Math.floor(diff % 86400 / 3600));
      mEl.textContent = pad(Math.floor(diff % 3600 / 60));
      sEl.textContent = pad(diff % 60);
    }
    tick();
    setInterval(function () { if (!d.hidden) tick(); }, 1000);
  })();

  /* ---------- 9. Sparklines + growth dashboard (real daily data) ---------- */
  // Smooth curve through the points without overshooting (monotone cubic).
  function monotonePath(pts) {
    var n = pts.length;
    if (n < 2) return "";
    var dx = [], dy = [], m = [], t = [], i;
    for (i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1][0] - pts[i][0];
      dy[i] = pts[i + 1][1] - pts[i][1];
      m[i] = dx[i] === 0 ? 0 : dy[i] / dx[i];
    }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = (m[i - 1] * m[i] <= 0) ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    var p = function (v) { return v.toFixed(1); };
    var out = "M" + p(pts[0][0]) + " " + p(pts[0][1]);
    for (i = 0; i < n - 1; i++) {
      out += " C" + p(pts[i][0] + dx[i] / 3) + " " + p(pts[i][1] + t[i] * dx[i] / 3) + "," +
                    p(pts[i + 1][0] - dx[i] / 3) + " " + p(pts[i + 1][1] - t[i + 1] * dx[i] / 3) + "," +
                    p(pts[i + 1][0]) + " " + p(pts[i + 1][1]);
    }
    return out;
  }

  // shared gradient used by every sparkline
  (function addDefs() {
    var s = d.createElementNS(svgNS, "svg");
    s.setAttribute("width", "0"); s.setAttribute("height", "0");
    s.setAttribute("aria-hidden", "true");
    s.style.position = "absolute";
    s.innerHTML = '<defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f0b34a" stop-opacity=".30"/><stop offset="1" stop-color="#f0b34a" stop-opacity="0"/></linearGradient></defs>';
    d.body.appendChild(s);
  })();

  function drawSpark(svg, values) {
    if (!svg || values.length < 2) return;
    var vb = svg.viewBox.baseVal, W = vb.width, H = vb.height, padY = 4;
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = (max - min) || 1;
    var pts = values.map(function (v, i) {
      return [i / (values.length - 1) * (W - 6) + 3, padY + (1 - (v - min) / span) * (H - padY * 2)];
    });
    var line = monotonePath(pts);
    var last = pts[pts.length - 1];
    svg.innerHTML =
      '<path class="spark-area" d="' + line + " L" + last[0].toFixed(1) + " " + H + " L" + pts[0][0].toFixed(1) + " " + H + ' Z"/>' +
      '<path class="spark-line" pathLength="1" d="' + line + '"/>' +
      '<circle class="spark-dot" cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3"/>';

    // The data usually arrives after the card has already been revealed, so
    // rewind the draw-in and replay it from the start.
    var parts = $$(".spark-line, .spark-area, .spark-dot", svg);
    parts.forEach(function (el) { el.style.transition = "none"; el.style.strokeDashoffset = el.classList.contains("spark-line") ? "1" : ""; el.style.opacity = el.classList.contains("spark-line") ? "" : "0"; });
    void svg.getBoundingClientRect();
    parts.forEach(function (el) { el.style.transition = ""; el.style.strokeDashoffset = ""; el.style.opacity = ""; });
  }

  function valueDaysBefore(points, key, days) {
    var lastMs = dayToMs(points[points.length - 1].d);
    var target = lastMs - days * 864e5;
    var best = points[0];
    for (var i = 0; i < points.length; i++) { if (dayToMs(points[i].d) <= target) best = points[i]; }
    return best;
  }

  historyReq.then(function (points) {
    if (!points) return;
    var last = points[points.length - 1];

    // hero card
    var subsNum = $(".js-subs-num");
    if (subsNum) {
      subsNum.textContent = num(last.s);
      drawSpark($(".js-subs-spark"), points.slice(-30).map(function (p) { return p.s; }));
      var base = valueDaysBefore(points, "s", 30);
      var delta = last.s - base.s;
      var dEl = $(".js-subs-delta");
      if (dEl && delta > 0) dEl.textContent = "▲ +" + num(delta) + " · 30d";
    }

    // KPI cards
    var since = $(".js-g-since");
    if (since) since.textContent = fmtDay(points[0].d, true);
    $$("[data-kpi]").forEach(function (card) {
      var key = card.dataset.kpi;
      var numEl = $(".js-kpi-num", card);
      var series = points.map(function (p) { return p[key]; });
      var base30 = valueDaysBefore(points, key, 30);
      var delta30 = last[key] - base30[key];
      var dEl = $(".js-kpi-delta", card);
      if (dEl && delta30 > 0) {
        dEl.innerHTML = "▲ +" + num(delta30) + " <small>last 30 days</small>";
      }
      drawSpark($(".js-kpi-spark", card), series.slice(-45));

      if (numEl) {
        if (reduce || !hasIO) { numEl.textContent = num(last[key]); return; }
        numEl.textContent = "0";
        var ko = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          countTo(numEl, last[key], "", 1600);
          ko.disconnect();
        }, { threshold: 0.6 });
        ko.observe(card);
      }
    });

    initChart(points);
  });

  function initChart(points) {
    var wrap = $("[data-chart]");
    if (!wrap) return;
    var plot = $(".chart__plot", wrap);
    var svg  = $(".chart__svg", plot);
    var tip  = $(".chart__tip", plot);
    var metric = "s";
    var pad = { l: 54, r: 16, t: 18, b: 32 };
    var geom = null;

    function niceStep(range, ticks) {
      var raw = range / (ticks - 1);
      var exp = Math.floor(Math.log(raw) / Math.LN10);
      var f = raw / Math.pow(10, exp);
      var nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
      return nf * Math.pow(10, exp);
    }
    function yLabel(v) {
      return (metric === "v" && v >= 1000) ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "K" : num(v);
    }

    function draw(animate) {
      var W = plot.clientWidth, H = plot.clientHeight;
      if (!W || !H) return;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);

      var vals = points.map(function (p) { return p[metric]; });
      var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      var step = niceStep((max - min) || 1, 4);
      var y0 = Math.floor(min / step) * step, y1 = Math.ceil(max / step) * step;
      if (y1 === y0) y1 = y0 + step;
      var t0 = dayToMs(points[0].d), t1 = dayToMs(points[points.length - 1].d);

      function X(p) { return pad.l + (dayToMs(p.d) - t0) / (t1 - t0) * (W - pad.l - pad.r); }
      function Y(v) { return pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b); }

      var pts = points.map(function (p) { return [X(p), Y(p[metric])]; });
      var line = monotonePath(pts);
      var baseY = H - pad.b;
      var html = '<defs><linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#f0b34a" stop-opacity=".26"/><stop offset="1" stop-color="#f0b34a" stop-opacity="0"/></linearGradient></defs>';

      for (var v = y0; v <= y1 + 1e-6; v += step) {
        var gy = Y(v).toFixed(1);
        html += '<line class="g-grid" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + gy + '" y2="' + gy + '"/>' +
                '<text class="g-lbl" x="' + (pad.l - 12) + '" y="' + (+gy + 4) + '" text-anchor="end">' + yLabel(v) + '</text>';
      }
      var nLbl = W < 560 ? 3 : 5; // fewer date labels on narrow screens so they never collide
      for (var k = 0; k < nLbl; k++) {
        var idx = Math.round(k / (nLbl - 1) * (points.length - 1));
        html += '<text class="g-lbl" x="' + X(points[idx]).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' +
                (k === 0 ? "start" : k === nLbl - 1 ? "end" : "middle") + '">' + fmtDay(points[idx].d) + '</text>';
      }
      html += '<path class="g-area" fill="url(#gFill)" d="' + line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + baseY +
              " L" + pts[0][0].toFixed(1) + " " + baseY + ' Z"/>' +
              '<path class="g-line" d="' + line + '"/>' +
              '<line class="g-guide" y1="' + pad.t + '" y2="' + baseY + '" style="visibility:hidden"/>' +
              '<circle class="g-dot" r="5" style="visibility:hidden"/>';
      svg.innerHTML = html;
      geom = { pts: pts, W: W, H: H };

      var path = $(".g-line", svg), area = $(".g-area", svg);
      if (animate && !reduce) {
        var len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        area.style.opacity = 0;
        void path.getBoundingClientRect();
        path.style.transition = "stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1)";
        area.style.transition = "opacity 1.4s ease .5s";
        path.style.strokeDashoffset = 0;
        area.style.opacity = 1;
      }
    }

    function show(e) {
      if (!geom) return;
      var r = svg.getBoundingClientRect();
      var x = e.clientX - r.left;
      var best = 0, bd = Infinity;
      geom.pts.forEach(function (p, i) { var dd = Math.abs(p[0] - x); if (dd < bd) { bd = dd; best = i; } });
      var p = geom.pts[best], pt = points[best], prev = points[best - 1];
      var guide = $(".g-guide", svg), dot = $(".g-dot", svg);
      guide.setAttribute("x1", p[0]); guide.setAttribute("x2", p[0]); guide.style.visibility = "visible";
      dot.setAttribute("cx", p[0]); dot.setAttribute("cy", p[1]); dot.style.visibility = "visible";
      var diff = prev ? pt[metric] - prev[metric] : 0;
      tip.innerHTML = "<b>" + num(pt[metric]) + "</b><span>" + fmtDay(pt.d, true) +
        (diff > 0 ? " · <em>+" + num(diff) + "</em>" : "") + "</span>";
      var left = Math.min(Math.max(p[0], 74), geom.W - 74);
      tip.style.left = left + "px";
      tip.style.top = p[1] + "px";
      tip.classList.add("is-on");
    }
    function hide() {
      tip.classList.remove("is-on");
      var guide = $(".g-guide", svg), dot = $(".g-dot", svg);
      if (guide) guide.style.visibility = "hidden";
      if (dot) dot.style.visibility = "hidden";
    }
    svg.addEventListener("pointermove", show);
    svg.addEventListener("pointerdown", show);
    svg.addEventListener("pointerleave", hide);

    $$(".seg button", wrap).forEach(function (btn) {
      btn.addEventListener("click", function () {
        metric = btn.dataset.m;
        $$(".seg button", wrap).forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
        hide();
        draw(true);
      });
    });

    var started = false;
    function start() { if (started) return; started = true; draw(true); }
    if (hasIO) {
      var co = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { start(); co.disconnect(); }
      }, { threshold: 0.25 });
      co.observe(plot);
    } else { start(); }

    if ("ResizeObserver" in window) {
      var raf = 0, lastW = 0;
      new ResizeObserver(function () {
        if (!started || plot.clientWidth === lastW) return;
        lastW = plot.clientWidth;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { draw(false); });
      }).observe(plot);
    }
  }

  /* ---------- 10. Walkthrough tabs ---------- */
  (function initShowcase() {
    var sc = $("[data-showcase]");
    if (!sc) return;
    var tabs = $$(".tab", sc);
    var panels = $$(".panel", sc);
    var idx = 0;

    function select(i, manual) {
      idx = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var fill = $(".tab__bar i", t);
        fill.style.animation = "none"; void fill.offsetWidth; fill.style.animation = "";
      });
      panels.forEach(function (p, k) { p.classList.toggle("is-active", k === i); });
      if (manual) { sc.classList.add("is-manual"); sc.classList.remove("is-playing", "is-paused"); }
    }

    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { select(k, true); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (idx + 1) % tabs.length;
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (idx + tabs.length - 1) % tabs.length;
        if (n === null) return;
        e.preventDefault(); select(n, true); tabs[n].focus();
      });
      $(".tab__bar i", t).addEventListener("animationend", function () {
        if (sc.classList.contains("is-playing")) select((idx + 1) % tabs.length, false);
      });
    });

    if (reduce || !hasIO) { sc.classList.add("is-manual"); return; }
    new IntersectionObserver(function (entries) {
      if (sc.classList.contains("is-manual")) return;
      sc.classList.toggle("is-playing", entries[0].isIntersecting);
    }, { threshold: 0.4 }).observe(sc);
    if (fine) {
      sc.addEventListener("pointerenter", function () { sc.classList.add("is-paused"); });
      sc.addEventListener("pointerleave", function () { sc.classList.remove("is-paused"); });
    }
  })();

  // paused flow animation for visitors who prefer reduced motion
  if (reduce) $$("svg.flow").forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });

  /* ---------- 11. FAQ ---------- */
  (function initFaq() {
    var items = $$(".qa");
    items.forEach(function (qa) {
      var btn = $(".qa__q", qa);
      btn.addEventListener("click", function () {
        var open = !qa.classList.contains("is-open");
        items.forEach(function (o) {
          o.classList.remove("is-open");
          $(".qa__q", o).setAttribute("aria-expanded", "false");
        });
        if (open) { qa.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); }
      });
    });
  })();

  /* ---------- 12. Toast + copy to clipboard ---------- */
  var toastEl = null, toastTimer = 0;
  function toast(message) {
    if (!toastEl) {
      toastEl = d.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.innerHTML = '<svg><use href="#i-check"/></svg><span></span>';
      d.body.appendChild(toastEl);
    }
    $("span", toastEl).textContent = message;
    void toastEl.offsetWidth;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2200);
  }

  function copyText(text, message) {
    function done() { toast(message || "Copied to clipboard"); }
    function fallback() {
      var ta = d.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      d.body.appendChild(ta);
      ta.select();
      try { d.execCommand("copy"); done(); } catch (e) { toast("Press ⌘C / Ctrl+C to copy"); }
      d.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () { copyText(b.dataset.copy, "Email copied to clipboard"); });
  });

  /* ---------- 13. Command palette (⌘K / Ctrl+K) ---------- */
  (function initCommandPalette() {
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $$(".kbtn kbd").forEach(function (k) { k.textContent = isMac ? "⌘K" : "Ctrl K"; });

    var el = null, input, list;
    var all = [], shown = [], active = 0, lastFocus = null, videos = [];

    var STATIC = [
      { g: "Pages", t: "Home", href: "/", icon: "i-page", k: "start index" },
      { g: "Pages", t: "About", href: "/about.html", icon: "i-page", k: "story rohan journey rules" },
      { g: "Pages", t: "Contact", href: "/contact.html", icon: "i-mail", k: "business sponsor promotions collab email" }
    ];
    var AFTER = [
      { g: "Follow", t: "YouTube", href: "https://www.youtube.com/@rohanlearn", icon: "i-yt", k: "channel videos", small: "@rohanlearn" },
      { g: "Follow", t: "Instagram", href: "https://www.instagram.com/rohansheshasai/", icon: "i-ig", k: "insta", small: "@rohansheshasai" },
      { g: "Follow", t: "X (Twitter)", href: "https://x.com/RohanSaikyw", icon: "i-x", k: "twitter", small: "@RohanSaikyw" },
      { g: "Follow", t: "Facebook", href: "https://www.facebook.com/profile.php?id=100086551701987", icon: "i-fb", k: "fb" },
      { g: "Follow", t: "Blog", href: "https://rohanlearn.blogspot.com", icon: "i-globe", k: "blogspot articles" },
      { g: "Actions", t: "Subscribe on YouTube", href: "https://www.youtube.com/@rohanlearn?sub_confirmation=1", icon: "i-yt", k: "follow bell" },
      { g: "Actions", t: "Email for promotions", href: "mailto:" + EMAIL + "?subject=Promotion%20Inquiry%20%E2%80%94%20RohanLearn", icon: "i-mail", k: "sponsor business contact", small: EMAIL },
      { g: "Actions", t: "Copy business email", run: function () { copyText(EMAIL, "Email copied to clipboard"); }, icon: "i-copy", k: "clipboard" }
    ];

    function buildAll() {
      var vids = videos.slice(0, 5).map(function (v) {
        return { g: "Latest videos", t: v.title, href: "https://www.youtube.com/watch?v=" + v.id, icon: "i-play", k: "watch video", small: fmtDate(v.publishedAt) };
      });
      all = STATIC.concat(vids, AFTER);
    }
    videosReq.then(function (data) { videos = getVideos(data); buildAll(); if (el && el.classList.contains("is-open")) render(); });
    buildAll();

    function build() {
      el = d.createElement("div");
      el.className = "cmdk";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-label", "Search the site");
      el.innerHTML =
        '<div class="cmdk__box">' +
          '<div class="cmdk__field"><svg><use href="#i-search"/></svg>' +
            '<input class="cmdk__input" type="text" placeholder="Search pages, videos, links…" autocomplete="off" spellcheck="false" ' +
              'role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" aria-label="Search">' +
            '<kbd>esc</kbd></div>' +
          '<div class="cmdk__list" id="cmdk-list" role="listbox"></div>' +
          '<div class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>' +
        '</div>';
      d.body.appendChild(el);
      input = $(".cmdk__input", el);
      list  = $(".cmdk__list", el);

      el.addEventListener("pointerdown", function (e) { if (e.target === el) close(); });
      input.addEventListener("input", function () { active = 0; render(); });
      input.addEventListener("keydown", onKey);
      list.addEventListener("pointermove", function (e) {
        var it = e.target.closest(".cmdk__item");
        if (it && +it.dataset.i !== active) { active = +it.dataset.i; paintActive(false); }
      });
      list.addEventListener("click", function (e) {
        var it = e.target.closest(".cmdk__item");
        if (it) run(shown[+it.dataset.i]);
      });
    }

    function render() {
      var q = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      shown = all.filter(function (it) {
        var hay = (it.t + " " + (it.k || "") + " " + it.g + " " + (it.small || "")).toLowerCase();
        return q.every(function (w) { return hay.indexOf(w) !== -1; });
      });
      list.innerHTML = "";
      if (!shown.length) {
        list.innerHTML = '<div class="cmdk__empty">No results for “' + input.value.replace(/[<>&]/g, "") + '”</div>';
        input.removeAttribute("aria-activedescendant");
        return;
      }
      var group = "";
      shown.forEach(function (it, i) {
        if (it.g !== group) {
          group = it.g;
          var h = d.createElement("div");
          h.className = "cmdk__group";
          h.textContent = group;
          list.appendChild(h);
        }
        var b = d.createElement("button");
        b.type = "button";
        b.className = "cmdk__item";
        b.id = "cmdk-o-" + i;
        b.setAttribute("role", "option");
        b.dataset.i = i;
        b.innerHTML = '<svg><use href="#' + it.icon + '"/></svg><span></span>' + (it.small ? "<small></small>" : "");
        $("span", b).textContent = it.t;
        if (it.small) $("small", b).textContent = it.small;
        list.appendChild(b);
      });
      paintActive(true);
    }

    function paintActive(scroll) {
      $$(".cmdk__item", list).forEach(function (b) {
        var on = +b.dataset.i === active;
        b.setAttribute("aria-selected", String(on));
        if (on) {
          input.setAttribute("aria-activedescendant", b.id);
          if (scroll) b.scrollIntoView({ block: "nearest" });
        }
      });
    }

    function onKey(e) {
      if (e.key === "ArrowDown") { e.preventDefault(); active = shown.length ? (active + 1) % shown.length : 0; paintActive(true); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = shown.length ? (active + shown.length - 1) % shown.length : 0; paintActive(true); }
      else if (e.key === "Enter") { e.preventDefault(); if (shown[active]) run(shown[active]); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Tab") { e.preventDefault(); }
    }

    function run(it) {
      close();
      if (it.run) { it.run(); return; }
      if (/^https?:/.test(it.href)) window.open(it.href, "_blank", "noopener");
      else window.location.href = it.href;
    }

    function open() {
      if (!el) build();
      lastFocus = d.activeElement;
      input.value = "";
      active = 0;
      render();
      el.classList.add("is-open");
      root.style.overflow = "hidden";
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      if (!el) return;
      el.classList.remove("is-open");
      root.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function isOpen() { return el && el.classList.contains("is-open"); }

    d.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); isOpen() ? close() : open(); return; }
      if (e.key === "/" && !isOpen()) {
        var tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
        e.preventDefault(); open();
      }
    });
    $$("[data-cmdk]").forEach(function (b) { b.addEventListener("click", open); });
  })();

  /* ---------- 14. Pointer effects: parallax, depth, magnetic buttons, spotlight ---------- */
  if (!reduce) {
    (function initParallax() {
      var layers = $$("[data-parallax]");
      if (!layers.length) return;
      var ticking = false;
      function update() {
        ticking = false;
        var y = Math.min(window.scrollY || 0, window.innerHeight * 1.3);
        layers.forEach(function (el) {
          el.style.transform = "translate3d(0," + (y * parseFloat(el.dataset.parallax)).toFixed(1) + "px,0)";
        });
      }
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    })();

    (function initDepth() {
      var stage = $("[data-stage]");
      if (!stage || !fine) return;
      var hero = stage.closest(".hero");
      var layers = $$("[data-depth]", stage);
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

      function loop() {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        layers.forEach(function (el) {
          var k = parseFloat(el.dataset.depth) * 1000;
          el.style.translate = (cx * k).toFixed(2) + "px " + (cy * k).toFixed(2) + "px";
        });
        raf = (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) ? requestAnimationFrame(loop) : 0;
      }
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      hero.addEventListener("pointerleave", function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    })();
  }

  if (fine && !reduce) {
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
      });
      el.addEventListener("pointerleave", function () { el.style.translate = ""; });
    });
  }
  if (fine) {
    $$(".tile").forEach(function (t) {
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect();
        t.style.setProperty("--mx", (e.clientX - r.left) + "px");
        t.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }
})();
