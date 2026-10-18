/* ============================================================
   RohanLearn — interactions & motion
   Plain JavaScript, no libraries. Every effect degrades to a normal,
   fully readable page if this file fails to load or the visitor has
   "reduce motion" switched on.

   Contents: 1 helpers · 2 shared data · 3 nav · 4 reveal · 5 live
   stats & counters · 6 videos · 7 announcement · 8 hero cards ·
   9 growth dashboard · 10 walkthrough · 11 FAQ · 12 toast & copy ·
   13 theme switch · 14 command palette · 15 brands wall & world map ·
   16 subscribe bar & Saturday reminder · 17 pointer effects · 18 analytics
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
  var conn   = navigator.connection || {};
  var saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  // fewer continuous animations on very low-power / data-saver devices
  if (saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2)) root.classList.add("lite");

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
  var videosReq  = fetchJSON("/assets/latest-video.json");
  var statsReq   = fetchJSON("/assets/channel-stats.json");
  var takeReq    = fetchJSON("/assets/takeaways.json");
  var coverReq   = fetchJSON("/assets/coverage.json");
  var historyReq = fetchJSON("/assets/stats-history.json").then(function (data) {
    return data && data.points && data.points.length > 1 ? data.points : null;
  });

  function getVideos(data) {
    if (!data) return [];
    if (data.videos && data.videos.length) return data.videos;
    return data.videoId ? [{ id: data.videoId, title: data.title, publishedAt: data.publishedAt }] : [];
  }

  /* ---------- 3. Nav + one shared scroll loop ----------
     Every scroll-driven effect runs from this single requestAnimationFrame
     callback. Page height is measured only when the layout changes (never
     while scrolling), and the browser is only asked to change compositor-
     friendly properties (transform, class toggles). */
  var topbar = $(".topbar");
  var bar = $(".progress");
  var scrollHooks = [];
  var queued = false, scrolled = false, docH = 0, viewH = window.innerHeight, lastP = -1;

  function measure() { docH = root.scrollHeight; viewH = window.innerHeight; }
  function frame() {
    queued = false;
    var y = window.pageYOffset || 0;
    var s = y > 8;
    if (s !== scrolled) { scrolled = s; if (topbar) topbar.classList.toggle("is-scrolled", s); }
    if (bar) {
      var max = docH - viewH;
      var p = max > 0 ? Math.min(y / max, 1) : 0;
      if (Math.abs(p - lastP) > 0.0005) { lastP = p; bar.style.transform = "scaleX(" + p.toFixed(4) + ")"; }
    }
    for (var i = 0; i < scrollHooks.length; i++) scrollHooks[i](y);
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", function () { measure(); queue(); });
  window.addEventListener("load", function () { measure(); queue(); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { measure(); queue(); }).observe(d.body);
  measure();
  frame();

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
      ind.style.transform = "translateX(" + (el.offsetLeft + 16) + "px) scaleX(" + (el.offsetWidth - 32) + ")";
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
        // measure every stat with its final number, lock that width, then reset to 0:
        // the digits can now count up without the row re-flowing every frame
        counters.forEach(function (el) { el.textContent = (parseFloat(el.dataset.count) || 0).toLocaleString() + (el.dataset.suffix || ""); });
        var widths = counters.map(function (el) { var st = el.closest(".stat") || el; return Math.ceil(st.getBoundingClientRect().width); });
        counters.forEach(function (el, i) { (el.closest(".stat") || el).style.minWidth = widths[i] + "px"; el.textContent = "0" + (el.dataset.suffix || ""); });
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
    var card = d.createElement("article");
    card.className = "vcard is-in";
    card.setAttribute("data-reveal", "");
    card.style.setProperty("--d", (i % 3) * 0.1 + "s");
    var a = d.createElement("a");
    a.className = "vcard__link";
    a.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(v.id);
    a.target = "_blank";
    a.rel = "noopener";

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
    card.appendChild(a);
    return card;
  }

  /* ---- sealed takeaways ----
     Each video can carry a "N takeaways inside" box: the lines are shown with their key words
     blacked out (assets/takeaways.json). The hidden words are never sent to the browser, and the
     only way to read them is the video, which is the point. */
  var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
             '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path class="shackle" d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var sealCount = 0;

  function fillRedacted(el, text) {
    text.split(/(█+)/).forEach(function (part) {
      if (!part) return;
      if (part.charAt(0) === "█") {
        var bar = d.createElement("span");
        bar.className = "redact";
        bar.style.setProperty("--n", part.length);
        bar.innerHTML = '<span class="sr-only">hidden</span>';
        el.appendChild(bar);
      } else {
        el.appendChild(d.createTextNode(part));
      }
    });
  }

  function setSeal(seal, open) {
    seal.classList.toggle("is-open", open);
    var b = $(".seal__btn", seal);
    if (b) b.setAttribute("aria-expanded", String(open));
  }

  function buildSeal(id, lines, feature) {
    if (!id || !lines || !lines.length) return null;
    var uid = "seal-" + (++sealCount);
    var url = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);

    var seal = d.createElement("div");
    seal.className = "seal" + (feature ? " seal--feature is-open" : "");

    var btn = d.createElement("button");
    btn.type = "button";
    btn.className = "seal__btn";
    btn.setAttribute("aria-expanded", feature ? "true" : "false");
    btn.setAttribute("aria-controls", uid);
    btn.innerHTML = '<span class="seal__lock">' + LOCK + '</span><span class="seal__t"></span><span class="seal__hint"></span>' +
      '<svg class="seal__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    $(".seal__t", btn).textContent = lines.length + (lines.length === 1 ? " takeaway inside" : " takeaways inside");

    var panel = d.createElement("div");
    panel.className = "seal__panel";
    panel.id = uid;
    var inner = d.createElement("div");
    inner.className = "seal__inner";
    var list = d.createElement("ol");
    list.className = "seal__list";
    lines.forEach(function (text, i) {
      var li = d.createElement("li");
      li.style.setProperty("--i", i);
      var n = d.createElement("span");
      n.className = "seal__n";
      n.textContent = "0" + (i + 1);
      var p = d.createElement("p");
      p.className = "seal__line";
      fillRedacted(p, text);
      li.appendChild(n); li.appendChild(p);
      list.appendChild(li);
    });
    inner.appendChild(list);

    // the moment someone is curious enough to peek is the moment to ask
    var sub = d.createElement("p");
    sub.className = "seal__sub";
    sub.innerHTML = '<span class="btn__dot" aria-hidden="true"></span><span>New case study every Saturday</span>' +
                    '<a href="https://www.youtube.com/@rohanlearn?sub_confirmation=1" target="_blank" rel="noopener" data-sub>Subscribe</a>';
    inner.appendChild(sub);
    if (!feature) {
      var cta = d.createElement("a");
      cta.className = "seal__cta";
      cta.href = url; cta.target = "_blank"; cta.rel = "noopener";
      cta.innerHTML = '<span class="seal__cta-l"><span class="seal__lock seal__lock--sm">' + LOCK + '</span>Watch to unlock all ' + lines.length + '</span>' +
                      '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow-up"/></svg>';
      inner.appendChild(cta);
    }
    panel.appendChild(inner);
    seal.appendChild(btn); seal.appendChild(panel);
    return seal;
  }

  function attachSeals(scope, tk) {
    if (!tk || !tk.videos) return;
    $$(".vcard", scope).forEach(function (card) {
      if ($(".seal", card)) return;
      var link = $(".vcard__link", card);
      var m = link && /[?&]v=([\w-]{11})/.exec(link.href);
      var id = card.dataset.id || (m && m[1]);
      var seal = id && buildSeal(id, tk.videos[id], false);
      if (seal) card.appendChild(seal);
    });
  }

  // Video cards open the video's case-study page (on this site) when it has one;
  // otherwise they keep linking straight to YouTube.
  function caseUrl(cov, id) {
    var v = cov && cov.videos && cov.videos[id];
    return v && v.s ? "/case-studies/" + v.s + "/" : null;
  }
  function linkCases(scope, cov) {
    $$(".vcard", scope).forEach(function (card) {
      var link = $(".vcard__link", card);
      var m = link && /[?&]v=([\w-]{11})/.exec(link.href);
      if (!m) return;
      var href = caseUrl(cov, m[1]);
      if (!href) return;
      card.dataset.id = m[1];
      link.href = href;
      link.removeAttribute("target"); link.removeAttribute("rel");
    });
  }

  // case-study pages: the sealed takeaways sit beside the video, already open
  takeReq.then(function (tk) {
    if (!tk || !tk.videos) return;
    $$("[data-seal-id]").forEach(function (slot) {
      var seal = buildSeal(slot.dataset.sealId, tk.videos[slot.dataset.sealId], true);
      if (seal) slot.appendChild(seal);
    });
  });

  d.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".seal__btn") : null;
    if (!b) return;
    var seal = b.closest(".seal");
    var open = !seal.classList.contains("is-open");
    // one box open at a time in the grid (the featured one stays as it is)
    if (open && !seal.classList.contains("seal--feature")) {
      $$(".seal.is-open:not(.seal--feature)").forEach(function (o) { if (o !== seal) setSeal(o, false); });
    }
    setSeal(seal, open);
  });

  (function initLatestVideo() {
    var frame  = $("#latest-video-frame");
    var player = $("#latest-player");
    var poster = $(".js-latest-poster");
    var grid   = $("#vgrid");
    if (!frame && !grid) return;

    var current = frame ? (frame.dataset.id || frame.dataset.fallbackId) : "";
    var loaded = false, autoPaused = false;
    var canAuto = !reduce && !saveData && hasIO;

    function embedUrl(id, auto, muted) {
      return "https://www.youtube.com/embed/" + id + "?autoplay=" + (auto ? 1 : 0) + "&mute=" + (muted ? 1 : 0) +
             "&playsinline=1&rel=0&enablejsapi=1";
    }
    function load(auto, muted) {
      if (!frame || loaded || !current) return;
      loaded = true;
      frame.addEventListener("load", function () { if (player) player.classList.add("is-loaded"); }, { once: true });
      frame.src = embedUrl(current, auto, muted);
    }
    function command(fn) {
      try { frame.contentWindow.postMessage(JSON.stringify({ event: "command", func: fn, args: [] }), "*"); } catch (e) { /* not ready */ }
    }

    // The player stays a lightweight poster until it is actually on screen
    // (the YouTube embed is ~1 MB of script that would otherwise compete with scrolling).
    if (player && poster) {
      poster.addEventListener("click", function (e) {
        e.preventDefault();
        if (!loaded) load(true, false);        // a tap/click is a user gesture: play with sound
      });
    }
    if (player && canAuto) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible) {
          if (!loaded) load(true, true);
          else if (autoPaused) { command("playVideo"); autoPaused = false; }
        } else if (loaded) { command("pauseVideo"); autoPaused = true; }
      }, { threshold: 0.45 }).observe(player);
    }

    function applyLatest(vids) {
      var latest = vids[0];
      if (latest.id && latest.id !== current) {
        current = latest.id;
        if (frame) frame.dataset.id = latest.id;
        if (loaded && frame) frame.src = embedUrl(current, true, true);
        if (player) player.style.setProperty("--poster", "url(https://i.ytimg.com/vi/" + latest.id + "/maxresdefault.jpg)");
      }
      if (frame && latest.title) frame.title = latest.title;
      if (poster && latest.id) poster.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(latest.id);

      var t = $(".js-latest-title"); if (t && latest.title) t.textContent = latest.title;
      var dt = $(".js-latest-date"); if (dt && latest.publishedAt) dt.textContent = fmtDate(latest.publishedAt);
      var lk = $(".js-latest-link"); if (lk && latest.id) lk.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(latest.id);

      if (grid && vids.length >= 4) {
        var rest = vids.slice(1);
        var cnt = rest.length >= 6 ? 6 : 3;
        grid.textContent = "";
        rest.slice(0, cnt).forEach(function (v, i) { grid.appendChild(buildCard(v, i)); });
      }
    }

    Promise.all([videosReq, takeReq]).then(function (res) {
      var vids = getVideos(res[0]), tk = res[1];
      if (vids.length) applyLatest(vids);

      // sealed takeaways: the featured video first, then every card in the grid
      var slot = $("[data-seal-slot]");
      if (slot && tk && tk.videos) {
        var seal = buildSeal(current, tk.videos[current], true);
        if (seal) { slot.textContent = ""; slot.appendChild(seal); }
      }
      if (grid) attachSeals(grid, tk);
      coverReq.then(function (cov) { if (grid) linkCases(grid, cov); });
    });
  })();

  /* ---------- 7. Announcement bar ---------- */
  (function initAnnounce() {
    var announce = $(".announce");
    if (!announce) return;
    var KEY = "rl-announce-dismissed";
    var link  = $(".announce__link", announce);
    var close = $(".announce__close", announce);
    function idOf(href) { var m = /[?&]v=([\w-]+)/.exec(href || ""); return m ? m[1] : ""; }
    function dismissed(id) { try { return localStorage.getItem(KEY) === id; } catch (e) { return false; } }

    close.addEventListener("click", function () {
      try { localStorage.setItem(KEY, idOf(link.href)); } catch (e) { /* private mode */ }
      root.classList.add("ann-off");
    });

    videosReq.then(function (data) {
      var latest = getVideos(data)[0];
      if (!latest) return;
      link.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(latest.id);
      var t = $(".js-announce-title", announce);
      if (t) t.textContent = latest.title;
      root.classList.toggle("ann-off", dismissed(latest.id));
    });
  })();

  /* ---------- 8. Hero cards: upload countdown + subscriber sparkline ---------- */
  // Uploads go live every Saturday at 7:02 PM IST = 13:32 UTC.
  function nextSlot(now) {
    var slot = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13, 32, 0));
    slot.setUTCDate(slot.getUTCDate() + ((6 - slot.getUTCDay() + 7) % 7));
    if (slot.getTime() <= now.getTime()) slot.setUTCDate(slot.getUTCDate() + 7);
    return slot;
  }

  var heroVisible = true;
  (function trackHero() {
    var hero = $(".hero");
    if (!hero || !hasIO) return;
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }, { rootMargin: "80px 0px" }).observe(hero);
  })();

  (function initCountdown() {
    var dEl = $(".js-cd-d");
    if (!dEl) return;
    var hEl = $(".js-cd-h"), mEl = $(".js-cd-m"), sEl = $(".js-cd-s"), label = $(".js-next-label");
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function set(el, v) { if (el._v !== v) { el._v = v; el.textContent = v; } }
    function tick() {
      var now = new Date();
      var next = nextSlot(now);
      var sinceDrop = now.getTime() - (next.getTime() - 7 * 864e5);
      if (label) set(label, sinceDrop < 3 * 36e5 ? "Out now" : "Next upload");
      var diff = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
      set(dEl, pad(Math.floor(diff / 86400)));
      set(hEl, pad(Math.floor(diff % 86400 / 3600)));
      set(mEl, pad(Math.floor(diff % 3600 / 60)));
      set(sEl, pad(diff % 60));
    }
    tick();
    setInterval(function () { if (!d.hidden && heroVisible) tick(); }, 1000);
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
      '<stop offset="0" style="stop-color:var(--accent)" stop-opacity=".30"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></linearGradient></defs>';
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
        '<stop offset="0" style="stop-color:var(--accent)" stop-opacity=".26"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></linearGradient></defs>';

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
    var flow = $("svg.flow", sc);
    var idx = 0, scVisible = false;

    // SVG motion (the travelling dots) keeps running even when hidden, so pause it
    // unless that panel is the active one and on screen.
    function syncFlow() {
      if (!flow || !flow.pauseAnimations) return;
      if (!reduce && scVisible && idx === 1) flow.unpauseAnimations(); else flow.pauseAnimations();
    }

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
      syncFlow();
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

    syncFlow();
    if (!hasIO) { sc.classList.add("is-manual"); return; }
    new IntersectionObserver(function (entries) {
      scVisible = entries[0].isIntersecting;
      syncFlow();
      if (reduce || sc.classList.contains("is-manual")) return;
      sc.classList.toggle("is-playing", scVisible);
    }, { threshold: 0.4 }).observe(sc);
    if (reduce) sc.classList.add("is-manual");
    if (fine) {
      sc.addEventListener("pointerenter", function () { sc.classList.add("is-paused"); });
      sc.addEventListener("pointerleave", function () { sc.classList.remove("is-paused"); });
    }
  })();

  // pause every endless animation inside a section while it is off screen
  (function initPauseOffscreen() {
    if (!hasIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle("is-off", !e.isIntersecting); });
    }, { rootMargin: "160px 0px" });
    $$(".hero, .tape, .cta, .bento").forEach(function (el) { io.observe(el); });
  })();

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

  /* ---------- 13. Theme switch (dark is the default, light is opt-in) ---------- */
  // The page's first paint is already themed by a tiny script in each <head>; this adds
  // the button, the remembered choice, and the animated switch.
  var THEME_KEY = "rl-theme";
  function theme() { return root.getAttribute("data-theme") === "light" ? "light" : "dark"; }
  var cur = theme(), vt = null;   // cur is updated at once, so fast double-clicks never get out of step
  function paintTheme(t) {
    cur = t;
    root.setAttribute("data-theme", t);
    var cs = $('meta[name="color-scheme"]'), tc = $('meta[name="theme-color"]');
    if (cs) cs.content = t;
    if (tc) tc.content = t === "light" ? "#f6f3ec" : "#09090a";
    var label = t === "light" ? "Switch to dark mode" : "Switch to light mode";
    $$("[data-theme-toggle]").forEach(function (b) { b.setAttribute("aria-label", label); b.title = label; });
  }
  function switchTheme() {
    var next = cur === "light" ? "dark" : "light";
    cur = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    if (vt) { try { vt.skipTransition(); } catch (e) {} vt = null; }
    if (reduce || root.classList.contains("lite") || !d.startViewTransition) { paintTheme(next); return; }
    var me;
    try {
      root.classList.add("theme-switching");
      me = vt = d.startViewTransition(function () { paintTheme(next); });
    } catch (e) { root.classList.remove("theme-switching"); paintTheme(next); return; }
    var done = function () { if (vt === me) { vt = null; root.classList.remove("theme-switching"); } };
    var quiet = function () {};   // a skipped transition rejects these promises; that is expected, not an error
    me.ready.catch(quiet); me.updateCallbackDone.catch(quiet);
    me.finished.then(done, done);
  }
  paintTheme(theme());
  $$("[data-theme-toggle]").forEach(function (b) { b.addEventListener("click", switchTheme); });
  // keep other open tabs in step
  window.addEventListener("storage", function (e) { if (e.key === THEME_KEY) paintTheme(e.newValue === "light" ? "light" : "dark"); });

  /* ---------- 14. Command palette (⌘K / Ctrl+K) ---------- */
  (function initCommandPalette() {
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $$(".kbtn kbd").forEach(function (k) { k.textContent = isMac ? "⌘K" : "Ctrl K"; });

    var el = null, input, list;
    var all = [], shown = [], active = 0, lastFocus = null, videos = [];

    var STATIC = [
      { g: "Pages", t: "Home", href: "/", icon: "i-page", k: "start index" },
      { g: "Pages", t: "Case studies", href: "/case-studies/", icon: "i-page", k: "all videos breakdowns library companies economy geopolitics" },
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

    function themeItem() {
      var light = theme() === "light";
      return { g: "Actions", t: light ? "Switch to dark mode" : "Switch to light mode", run: switchTheme,
               icon: light ? "i-moon" : "i-sun", k: "theme appearance dark light mode night day" };
    }
    function buildAll() {
      var vids = videos.slice(0, 5).map(function (v) {
        return { g: "Latest videos", t: v.title, href: "https://www.youtube.com/watch?v=" + v.id, icon: "i-play", k: "watch video", small: fmtDate(v.publishedAt) };
      });
      all = STATIC.concat(vids, AFTER, [themeItem()]);
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
      buildAll();   // refreshes the theme action's label
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

  /* ---------- 15. Brands wall + world map (both from assets/coverage.json) ---------- */
  var VERDICTS = [
    { k: "rise", t: "Rise" }, { k: "comeback", t: "Comeback" }, { k: "fall", t: "Fall" },
    { k: "threat", t: "Under threat" }, { k: "power", t: "Money & power" }
  ];
  var VERDICT_LABEL = {};
  VERDICTS.forEach(function (v) { VERDICT_LABEL[v.k] = v.t; });
  function ytUrl(id) { return "https://www.youtube.com/watch?v=" + encodeURIComponent(id); }
  function monthYear(day) {
    var m = /^(\d{4})-(\d{2})/.exec(day || "");
    return m ? MONTHS[+m[2] - 1] + " " + m[1] : "";
  }

  (function initBrands() {
    var sec = $("#brands"), wall = $("#bwall"), bar = $(".bfilter");
    if (!sec || !wall || !bar) return;

    coverReq.then(function (cov) {
      var brands = cov && cov.brands;
      if (!brands || !brands.length) { sec.hidden = true; return; }
      var videos = cov.videos || {};

      // filter chips, with counts; only outcomes that exist get a chip
      var counts = {};
      brands.forEach(function (b) { counts[b.verdict] = (counts[b.verdict] || 0) + 1; });
      [{ k: "all", t: "All", n: brands.length }].concat(
        VERDICTS.filter(function (v) { return counts[v.k]; }).map(function (v) { return { k: v.k, t: v.t, n: counts[v.k] }; })
      ).forEach(function (f, i) {
        var b = d.createElement("button");
        b.type = "button"; b.className = "bchip"; b.dataset.f = f.k;
        b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        b.innerHTML = "<span></span><small></small>";
        $("span", b).textContent = f.t; $("small", b).textContent = f.n;
        bar.appendChild(b);
      });

      brands.forEach(function (br, i) {
        var v = videos[br.video] || {};
        var verdict = /^[a-z]+$/.test(br.verdict || "") ? br.verdict : "power";
        var a = d.createElement("a");
        a.className = "brand";
        var page = caseUrl(cov, br.video);
        a.href = page || ytUrl(br.video);
        if (!page) { a.target = "_blank"; a.rel = "noopener"; }
        a.dataset.v = verdict; a.dataset.id = br.video;
        a.setAttribute("aria-label", br.name + ", " + (VERDICT_LABEL[verdict] || "") + ". Watch: " + (v.t || "the breakdown"));
        a.innerHTML =
          '<span class="brand__media" aria-hidden="true"></span>' +
          '<span class="brand__top"><span class="brand__sector"></span><span class="vtag vtag--' + verdict + '"></span></span>' +
          '<span class="brand__name"></span>' +
          '<span class="brand__foot"><span class="brand__meta"></span>' +
          '<span class="brand__go">Watch <svg aria-hidden="true"><use href="#i-arrow-up"/></svg></span></span>';
        $(".brand__sector", a).textContent = br.sector || "";
        $(".vtag", a).textContent = VERDICT_LABEL[verdict] || "";
        $(".brand__name", a).textContent = br.name;
        $(".brand__meta", a).textContent = [br.country, monthYear(v.d)].filter(Boolean).join(" · ");
        wall.appendChild(a);
      });

      // the video's thumbnail fades in behind the name on hover/focus (fetched only then)
      function warm(e) {
        var a = e.target.closest && e.target.closest(".brand");
        if (!a || a.dataset.warm) return;
        a.dataset.warm = "1";
        var img = new Image();
        img.onload = function () { $(".brand__media", a).style.backgroundImage = "url(" + img.src + ")"; a.classList.add("has-media"); };
        img.src = "https://i.ytimg.com/vi/" + a.dataset.id + "/hqdefault.jpg";
      }
      if (fine) wall.addEventListener("pointerover", warm);
      wall.addEventListener("focusin", warm);

      // "All" shows the first TOP brands until "Show all" is pressed; an outcome filter shows every match
      var TOP = 8, filter = "all", expanded = false, swapTimer = 0;
      var tiles = $$(".brand", wall);
      var more = null;
      if (tiles.length > TOP) {
        more = d.createElement("div");
        more.className = "bmore";
        more.innerHTML = '<button class="bmore__btn" type="button" aria-expanded="false" aria-controls="bwall"><span></span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>';
        wall.insertAdjacentElement("afterend", more);
      }
      function wanted(a, i) {
        if (filter !== "all") return a.dataset.v === filter;
        return expanded || i < TOP;
      }
      function syncMore() {
        if (!more) return;
        var btn = $(".bmore__btn", more);
        more.hidden = filter !== "all";
        btn.setAttribute("aria-expanded", String(expanded));
        $("span", btn).textContent = expanded ? "Show fewer" : "Show all " + tiles.length + " brands";
      }
      // first paint: no animation
      tiles.forEach(function (a, i) { a.hidden = !wanted(a, i); });
      syncMore();

      // fade the leavers out, then swap, then fade the newcomers in (one after another)
      function show() {
        syncMore();
        tiles.forEach(function (a, i) { if (!wanted(a, i) && !a.hidden) a.classList.add("is-out"); });
        clearTimeout(swapTimer);
        swapTimer = setTimeout(function () {
          var k = 0;
          tiles.forEach(function (a, i) {
            if (wanted(a, i)) {
              if (a.hidden) { a.hidden = false; a.classList.add("is-out"); a.style.setProperty("--k", k++); }
            } else { a.hidden = true; a.classList.remove("is-out"); }
          });
          void wall.offsetWidth;   // commit the hidden-state styles, so removing the class animates
          tiles.forEach(function (a) { if (!a.hidden) a.classList.remove("is-out"); });
        }, reduce ? 0 : 220);
      }
      bar.addEventListener("click", function (e) {
        var chip = e.target.closest(".bchip");
        if (!chip || chip.getAttribute("aria-pressed") === "true") return;
        filter = chip.dataset.f;
        $$(".bchip", bar).forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        show();
      });
      if (more) $(".bmore__btn", more).addEventListener("click", function () {
        expanded = !expanded;
        show();
        // after collapsing, keep the button where the visitor's eyes are
        if (!expanded) setTimeout(function () { more.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); }, reduce ? 0 : 240);
      });
    });
  })();

  (function initWorldMap() {
    var host = $("[data-wmap]"), chips = $(".glo__chips"), panel = $(".glo__panel");
    if (!host || !chips || !panel) return;
    var tile = host.closest(".tile") || d;
    var SHORT = { US: "USA", GB: "UK", ZA: "S. Africa" };

    var started = false;
    function start() {
      if (started) return;
      started = true;
      Promise.all([coverReq, fetchJSON("/assets/world-dots.json")]).then(function (r) {
        if (r[0] && r[0].countries && r[0].countries.length && r[1] && r[1].dots) build(r[0], r[1]);
      });
    }
    // the map data is only fetched when the visitor gets near it
    if (hasIO) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: "700px 0px" });
      io.observe(host);
    } else start();

    function dotPath(str) {
      return (str || "").split(" ").map(function (p) { return p ? "M" + p.replace(",", " ") + "h0" : ""; }).join("");
    }

    function build(cov, map) {
      var W = map.w, H = map.h, k = W / 360;
      function X(lon) { return (lon + 180) * k; }
      function Y(lat) { return (75 - lat) * k; }
      var countries = cov.countries, videos = cov.videos || {};
      var byCode = {};
      countries.forEach(function (c) { byCode[c.code] = c; });
      var hub = byCode.IN || countries[0];

      var wrap = d.createElement("div");
      wrap.className = "wmap";
      wrap.style.aspectRatio = W + " / " + H;

      var svg = d.createElementNS(svgNS, "svg");
      svg.setAttribute("class", "wmap__svg");
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("aria-hidden", "true");
      var land = "";
      Object.keys(map.dots).forEach(function (code) { if (!byCode[code]) land += dotPath(map.dots[code]); });
      var html = '<path class="wm-land" d="' + land + '"/>';
      countries.forEach(function (c) {
        if (map.dots[c.code]) html += '<path class="wm-c" data-c="' + c.code + '" d="' + dotPath(map.dots[c.code]) + '"/>';
      });
      // arcs out of India: the channel's point of view
      var hx = X(hub.lon), hy = Y(hub.lat), n = 0;
      countries.forEach(function (c) {
        if (c === hub) return;
        var x = X(c.lon), y = Y(c.lat), mx = (hx + x) / 2, my = (hy + y) / 2;
        var lift = Math.min(90, Math.hypot(x - hx, y - hy) * 0.32);
        html += '<path class="wm-arc" data-c="' + c.code + '" pathLength="1" style="--i:' + (n++) + '" d="M' +
                hx.toFixed(1) + " " + hy.toFixed(1) + " Q" + mx.toFixed(1) + " " + (my - lift).toFixed(1) + " " + x.toFixed(1) + " " + y.toFixed(1) + '"/>';
      });
      svg.innerHTML = html;
      wrap.appendChild(svg);

      // pins are real buttons laid over the map, so they stay crisp and tappable at any size
      countries.forEach(function (c) {
        var b = d.createElement("button");
        b.type = "button";
        b.className = "wm-pin" + (c === hub ? " wm-pin--hub" : "");
        b.dataset.c = c.code;
        b.style.left = (X(c.lon) / W * 100).toFixed(2) + "%";
        b.style.top = (Y(c.lat) / H * 100).toFixed(2) + "%";
        b.setAttribute("aria-label", c.name + ", " + c.videos.length + (c.videos.length === 1 ? " breakdown" : " breakdowns"));
        b.innerHTML = '<span class="wm-pin__dot"></span><span class="wm-pin__lbl"><span></span><b></b></span>';
        $(".wm-pin__lbl span", b).textContent = c.name;
        $(".wm-pin__lbl b", b).textContent = c.videos.length;
        wrap.appendChild(b);
      });

      // chips: the same choices as a scrollable row (the main control on phones)
      chips.textContent = "";
      countries.forEach(function (c) {
        var b = d.createElement("button");
        b.type = "button"; b.className = "gchip"; b.dataset.c = c.code;
        b.innerHTML = "<span></span><small></small>";
        $("span", b).textContent = SHORT[c.code] || c.name;
        $("small", b).textContent = c.videos.length;
        chips.appendChild(b);
      });

      host.textContent = "";
      host.appendChild(wrap);

      // draw the arcs once the map is actually on screen
      if (hasIO && !reduce) {
        var dio = new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) { dio.disconnect(); requestAnimationFrame(function () { wrap.classList.add("is-drawn"); }); }
        }, { threshold: 0.3 });
        dio.observe(wrap);
      } else wrap.classList.add("is-drawn");

      function renderPanel(c) {
        var list = c.videos.map(function (id) {
          var v = videos[id] || {};
          var page = caseUrl(cov, id);
          return '<li><a class="gvid" href="' + (page || ytUrl(id)) + '"' + (page ? "" : ' target="_blank" rel="noopener"') + ">" +
                 '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/mqdefault.jpg" width="320" height="180" alt="" loading="lazy" decoding="async">' +
                 '<span class="gvid__t"></span><span class="gvid__d">' + (v.d ? fmtDate(v.d) : "") + '</span></a></li>';
        }).join("");
        panel.innerHTML = '<div class="glo__head"><b></b><span></span></div><ul class="glo__list">' + list + "</ul>";
        $(".glo__head b", panel).textContent = c.name;
        $(".glo__head span", panel).textContent = c.videos.length + (c.videos.length === 1 ? " breakdown" : " breakdowns");
        $$(".gvid__t", panel).forEach(function (t, i) { t.textContent = (videos[c.videos[i]] || {}).t || "Watch on YouTube"; });
      }

      var cur = null, swap = 0;
      function select(code, fromUser) {
        var c = byCode[code];
        if (!c || code === cur) return;
        cur = code;
        $$(".wm-pin, .gchip", tile).forEach(function (el) {
          var on = el.dataset.c === code;
          el.classList.toggle("is-active", on);
          el.setAttribute("aria-pressed", String(on));
        });
        $$(".wm-c, .wm-arc", svg).forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-c") === code); });
        wrap.classList.toggle("has-pick", code !== hub.code);
        if (!fromUser || reduce) { renderPanel(c); return; }
        panel.classList.add("is-swap");
        clearTimeout(swap);
        swap = setTimeout(function () { renderPanel(c); panel.classList.remove("is-swap"); }, 160);
        var chip = $('.gchip[data-c="' + code + '"]', chips);
        if (chip) chips.scrollTo({ left: chip.offsetLeft - chips.offsetLeft - 12, behavior: "smooth" });
      }
      tile.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest(".wm-pin, .gchip");
        if (b) select(b.dataset.c, true);
      });
      select(hub.code, false);
    }
  })();

  // the case-studies hub: filter by topic and search as you type
  (function initHub() {
    var list = $("#cs-list"), bar = $(".cs-filter"), input = $(".cs-search input"), empty = $(".cs-empty");
    if (!list || !bar) return;
    var cards = $$(".cs-card", list), topic = "all", q = "", typing = 0;
    function apply() {
      var words = q.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
      cards.forEach(function (c) {
        var ok = (topic === "all" || c.dataset.cat === topic) &&
                 words.every(function (w) { return c.dataset.q.indexOf(w) !== -1; });
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    }
    bar.addEventListener("click", function (e) {
      var chip = e.target.closest(".bchip");
      if (!chip) return;
      topic = chip.dataset.f;
      $$(".bchip", bar).forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      apply();
    });
    if (input) input.addEventListener("input", function () {
      q = input.value;
      clearTimeout(typing);
      typing = setTimeout(apply, 80);
    });
  })();

  /* ---------- 16. Subscribe bar + Saturday reminder ---------- */
  var SUB_URL = "https://www.youtube.com/@rohanlearn?sub_confirmation=1";
  function store(key, val) { try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; } }

  // "Remind me every Saturday": Google Calendar (a weekly event starting at the next
  // upload) or a calendar file that Apple Calendar / Outlook open directly
  (function initReminder() {
    var boxes = $$("[data-remind]");
    if (!boxes.length) return;
    function stamp(dt) { return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
    var start = nextSlot(new Date()), end = new Date(start.getTime() + 30 * 60000);
    var gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("New RohanLearn case study") +
      "&dates=" + stamp(start) + "/" + stamp(end) +
      "&recur=" + encodeURIComponent("RRULE:FREQ=WEEKLY;BYDAY=SA") +
      "&details=" + encodeURIComponent("A new breakdown of money, power and strategy is live.\nWatch: https://www.youtube.com/@rohanlearn/videos");
    $$(".js-gcal").forEach(function (a) { a.href = gcal; });

    function close(box, focus) {
      var btn = $(".remind__btn", box), menu = $(".remind__menu", box);
      if (menu.hidden) return;
      box.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false");
      setTimeout(function () { if (!box.classList.contains("is-open")) menu.hidden = true; }, reduce ? 0 : 200);
      if (focus) btn.focus();
    }
    boxes.forEach(function (box) {
      var btn = $(".remind__btn", box), menu = $(".remind__menu", box);
      btn.addEventListener("click", function () {
        if (box.classList.contains("is-open")) { close(box); return; }
        boxes.forEach(function (b) { if (b !== box) close(b); });
        menu.hidden = false;
        requestAnimationFrame(function () { box.classList.add("is-open"); });
        btn.setAttribute("aria-expanded", "true");
      });
      box.addEventListener("keydown", function (e) {
        var items = $$(".remind__item", box), i = items.indexOf(d.activeElement);
        if (e.key === "Escape") { close(box, true); }
        else if (e.key === "ArrowDown" && box.classList.contains("is-open")) { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
        else if (e.key === "ArrowUp" && box.classList.contains("is-open")) { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
      });
      $$(".remind__item", box).forEach(function (a) {
        a.addEventListener("click", function () { close(box); toast("Reminder added. See you Saturday"); });
      });
    });
    d.addEventListener("click", function (e) {
      boxes.forEach(function (b) { if (!b.contains(e.target)) close(b); });
    });
  })();

  // a slim bar that slides in once the visitor has scrolled past the first screen,
  // and gets out of the way near the end of the page (where the big Subscribe button is)
  (function initSubBar() {
    var HIDE_KEY = "rl-subbar";
    var until = +(store(HIDE_KEY) || 0);
    if (until && until > Date.now()) return;
    var first = $(".hero") || $(".phero");
    if (!first) return;

    var bar = d.createElement("div");
    bar.className = "subbar";
    bar.setAttribute("role", "complementary");
    bar.setAttribute("aria-label", "Subscribe to RohanLearn");
    bar.innerHTML =
      '<span class="subbar__mark" aria-hidden="true">R</span>' +
      '<span class="subbar__txt"><b>RohanLearn</b><span><span class="js-subbar-n"></span><span class="subbar__more">New case study every Saturday</span></span></span>' +
      '<a class="subbar__btn" href="' + SUB_URL + '" target="_blank" rel="noopener" data-sub><span class="btn__dot"></span>Subscribe</a>' +
      '<button class="subbar__x" type="button" aria-label="Hide for a week"><svg aria-hidden="true"><use href="#i-close"/></svg></button>';
    d.body.appendChild(bar);

    statsReq.then(function (st) {
      var n = st && st.subscribers;
      if (n) $(".js-subbar-n", bar).textContent = Number(n).toLocaleString("en-IN") + " subscribers";
      else $(".js-subbar-n", bar).remove();
    });

    // positions are measured only when the layout changes; the scroll path just compares numbers
    var showAt = 0, hideAt = Infinity, vh = window.innerHeight, gone = false, on = false;
    function measureBar() {
      var y = window.pageYOffset || 0;
      var r = first.getBoundingClientRect();
      showAt = r.bottom + y - 40;
      var ends = $$(".cta, .footer").map(function (el) { return el.getBoundingClientRect().top + y; });
      hideAt = ends.length ? Math.min.apply(null, ends) : Infinity;
      vh = window.innerHeight;
    }
    function check(y) {
      var want = !gone && y > showAt && y + vh < hideAt + 60;
      if (want === on) return;
      on = want;
      bar.classList.toggle("is-on", on);
      root.classList.toggle("has-subbar", on);
    }
    measureBar();
    window.addEventListener("resize", measureBar);
    window.addEventListener("load", measureBar);
    if ("ResizeObserver" in window) new ResizeObserver(measureBar).observe(d.body);
    scrollHooks.push(check);
    check(window.pageYOffset || 0);

    function dismiss(days) {
      gone = true; check(window.pageYOffset || 0);
      store(HIDE_KEY, String(Date.now() + days * 864e5));
    }
    $(".subbar__x", bar).addEventListener("click", function () { dismiss(7); });
    // anyone who clicks Subscribe (here or anywhere else) is not asked again for a month
    d.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href*="sub_confirmation"]');
      if (a) dismiss(30);
    });
  })();

  /* ---------- 17. Parallax, depth, magnetic buttons, spotlight ---------- */
  if (!reduce) {
    (function initParallax() {
      var layers = $$("[data-parallax]");
      if (!layers.length) return;
      var shown = [];
      scrollHooks.push(function (y) {
        if (!heroVisible) return;
        var yy = Math.min(y, viewH * 1.3);
        layers.forEach(function (el, i) {
          var v = +(yy * parseFloat(el.dataset.parallax)).toFixed(1);
          if (shown[i] !== v) { shown[i] = v; el.style.transform = "translate3d(0," + v + "px,0)"; }
        });
      });
    })();

    (function initDepth() {
      var stage = $("[data-stage]");
      if (!stage || !fine) return;
      var hero = stage.closest(".hero");
      var layers = $$("[data-depth]", stage);
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, w = 1, h = 1, left = 0, top = 0;

      function loop() {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        layers.forEach(function (el) {
          var k = parseFloat(el.dataset.depth) * 1000;
          el.style.translate = (cx * k).toFixed(2) + "px " + (cy * k).toFixed(2) + "px";
        });
        raf = (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) ? requestAnimationFrame(loop) : 0;
      }
      hero.addEventListener("pointerenter", function () {
        var r = hero.getBoundingClientRect(); left = r.left; top = r.top; w = r.width; h = r.height;
      });
      hero.addEventListener("pointermove", function (e) {
        tx = (e.clientX - left) / w - 0.5;
        ty = (e.clientY - top) / h - 0.5;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      hero.addEventListener("pointerleave", function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    })();
  }

  // run a handler at most once per frame
  function perFrame(fn) {
    var pending = false, last = null;
    return function (e) {
      last = e;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; fn(last); });
    };
  }

  if (fine && !reduce) {
    $$("[data-magnetic]").forEach(function (el) {
      var move = perFrame(function (e) {
        var r = el.getBoundingClientRect();
        el.style.translate = ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px " + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + "px";
      });
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", function () { el.style.translate = ""; });
    });
  }
  if (fine) {
    $$(".tile").forEach(function (t) {
      t.addEventListener("pointermove", perFrame(function (e) {
        var r = t.getBoundingClientRect();
        t.style.setProperty("--mx", (e.clientX - r.left) + "px");
        t.style.setProperty("--my", (e.clientY - r.top) + "px");
      }));
    });
  }


  /* ---------- 18. Analytics (Microsoft Clarity) ---------- */
  // EDIT: paste the Project ID from clarity.microsoft.com (Settings → Overview) between the quotes.
  // While it is empty, nothing is loaded and nothing is sent.
  var CLARITY_ID = "yzorjquef2";
  var NO_ANALYTICS = "rl-noanalytics";

  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
  var optedOut = store(NO_ANALYTICS) === "1" || navigator.globalPrivacyControl === true;
  var analyticsOn = !!CLARITY_ID && !optedOut && !isLocal;

  if (analyticsOn) {
    // calls made before the script arrives are queued and sent once it loads
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    var loadClarity = function () {
      var t = d.createElement("script");
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + encodeURIComponent(CLARITY_ID);
      d.head.appendChild(t);
    };
    // wait until the page has loaded and the browser is idle, so it never slows the site down
    var whenIdle = function () { if ("requestIdleCallback" in window) requestIdleCallback(loadClarity, { timeout: 3000 }); else setTimeout(loadClarity, 1500); };
    if (d.readyState === "complete") whenIdle(); else window.addEventListener("load", whenIdle);
    window.clarity("set", "theme", theme());
  }
  function track(name) { if (analyticsOn) window.clarity("event", name); }

  // One listener for every moment worth counting. It is added last, so it sees each control
  // after its own click handler has run (e.g. whether a box ended up open or closed).
  d.addEventListener("click", function (e) {
    if (!analyticsOn || !e.target.closest) return;
    var t = e.target, el;
    function at(sel) { el = t.closest(sel); return el; }

    if (at('a[href*="sub_confirmation"]')) {
      var from = t.closest(".subbar") ? "sticky_bar" : t.closest(".seal") ? "takeaways" : t.closest(".nav") ? "top_bar" :
                 t.closest(".cs-aside") ? "case_page" :
                 t.closest(".menu") ? "menu" : t.closest(".cta") ? "closing" : t.closest(".hero") ? "hero" :
                 t.closest(".footer") ? "footer" : "page";
      track("subscribe_" + from);
    }
    else if (at(".seal__btn")) { if (el.getAttribute("aria-expanded") === "true") track("takeaways_peek"); }
    else if (at(".seal__cta")) track("takeaways_unlock");
    else if (at(".remind__btn")) { if (el.getAttribute("aria-expanded") === "true") track("reminder_open"); }
    else if (at(".remind__item")) track(el.classList.contains("js-gcal") ? "reminder_google" : "reminder_apple");
    else if (at("[data-theme-toggle]")) { track("theme_" + cur); window.clarity("set", "theme", cur); }   // cur = the theme being switched to
    else if (at(".bchip")) track((t.closest(".cs-filter") ? "hub_filter_" : "brands_filter_") + el.dataset.f);
    else if (at(".bmore__btn")) { if (el.getAttribute("aria-expanded") === "true") track("brands_show_all"); }
    else if (at(".brand")) track("case_from_brands");
    else if (at(".wm-pin, .gchip")) track("map_" + (el.dataset.c || "").toLowerCase());
    else if (at(".gvid")) track("case_from_map");
    else if (at(".vcard__link")) track("case_from_recent");
    else if (at(".cs-card__link")) track(t.closest(".cs-more") ? "case_from_related" : "case_from_hub");
    else if (at(".cs-ch a")) track("chapter_click");
    else if (at(".cs-actions .btn--yt")) track("watch_from_case_page");
    else if (at(".js-latest-link, .player__poster")) track("watch_latest");
    else if (at(".announce__link")) track("watch_from_announcement");
    else if (at(".announce__close")) track("announcement_closed");
    else if (at(".subbar__x")) track("subscribe_bar_closed");
    else if (at("[data-cmdk]")) track("search_open");
    else if (at(".cmdk__item")) track("search_pick");
    else if (at("[data-copy]")) track("email_copy");
    else if (at('a[href^="mailto:"]')) track("email_click");
    else if (at(".qa__q")) { if (el.getAttribute("aria-expanded") === "true") track("faq_open"); }
    else if (at('a[href*="youtube.com"]')) track("youtube_link");
  });

  // privacy page: switch analytics off (or back on) for this browser
  (function initOptOut() {
    var box = $("[data-optout]");
    if (!box) return;
    var state = $(".optout__state", box), btn = $(".optout__btn", box);
    function paint() {
      var off = store(NO_ANALYTICS) === "1";
      if (!CLARITY_ID) { state.textContent = "Analytics are not running on this site yet."; btn.hidden = true; return; }
      if (navigator.globalPrivacyControl === true) { state.textContent = "Analytics are off: your browser asks sites not to track."; btn.hidden = true; return; }
      state.textContent = off ? "Analytics are off for this device." : "Analytics are on for this device.";
      btn.textContent = off ? "Turn on" : "Turn off";
    }
    btn.addEventListener("click", function () {
      var off = store(NO_ANALYTICS) === "1";
      if (off) { try { localStorage.removeItem(NO_ANALYTICS); } catch (e) {} }
      else {
        store(NO_ANALYTICS, "1");
        // forget Clarity's visitor cookies too
        ["_clck", "_clsk"].forEach(function (n) {
          d.cookie = n + "=; Max-Age=0; path=/";
          d.cookie = n + "=; Max-Age=0; path=/; domain=." + location.hostname.replace(/^www\./, "");
        });
      }
      toast(off ? "Analytics turned on" : "Analytics turned off for this device");
      setTimeout(function () { location.reload(); }, 900);
    });
    paint();
  })();
})();
