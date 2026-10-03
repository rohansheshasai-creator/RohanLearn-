/* ============================================================
   RohanLearn — interactions & motion
   Plain JavaScript, no libraries. Every effect degrades to a normal,
   fully readable page if this file fails to load or the visitor has
   "reduce motion" switched on.
   ============================================================ */

(function () {
  "use strict";

  var d = document;
  var root = d.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO  = "IntersectionObserver" in window;

  function $(s, c)  { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* ---------- Footer year ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + reading progress ---------- */
  var nav = $(".nav");
  var bar = $(".progress");
  function onScroll() {
    var y = window.scrollY || 0;
    if (nav) nav.classList.toggle("is-scrolled", y > 8);
    if (bar) {
      var h = root.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(y / h, 1) : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Nav: sliding underline ---------- */
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

    // first placement without the slide-in animation
    ind.style.transition = "none";
    place(active);
    void ind.offsetWidth;
    ind.style.transition = "";
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { place(active); });
  })();

  /* ---------- Mobile menu ---------- */
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

  /* ---------- Split headings into words for the masked rise-in ---------- */
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

  /* ---------- Reveal on scroll ---------- */
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

  /* ---------- Live channel stats ----------
     assets/channel-stats.json is refreshed daily by a GitHub Action.
     The numbers written in the HTML are the fallback. */
  function formatStat(n) {
    if (n >= 1000) return { count: Math.round(n / 1000), suffix: "K+" };
    return { count: n, suffix: "+" };
  }

  var statsReq = fetch("assets/channel-stats.json", { cache: "no-store" })
    .then(function (res) { return res.ok ? res.json() : null; })
    .catch(function () { return null; });

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

  function runCounter(el) {
    var target = parseFloat(el.dataset.count) || 0;
    var suffix = el.dataset.suffix || "";
    var dur = 1700;
    var start = null;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.dataset.done = "1";
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
            runCounter(entry.target);
            co.unobserve(entry.target);
          });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { co.observe(el); });
      });
    statsReq.then(applyStats); // late arrivals still update
  })();

  /* ---------- Latest video + recent breakdowns ----------
     assets/latest-video.json is refreshed every few hours by a GitHub
     Action reading the channel feed (Shorts filtered out). The video and
     cards written in the HTML are the fallback. */
  // Dates are shown in IST (the channel's timezone) with fixed month names,
  // so every visitor sees the same thing regardless of browser or locale.
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return "";
    var ist = new Date(t + 19800000); // +5:30
    return ist.getUTCDate() + " " + MONTHS[ist.getUTCMonth()] + " " + ist.getUTCFullYear();
  }

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

    fetch("assets/latest-video.json", { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data) return;
        var vids = (data.videos && data.videos.length)
          ? data.videos
          : (data.videoId ? [{ id: data.videoId, title: data.title, publishedAt: data.publishedAt }] : []);
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
      })
      .catch(function () { /* fallback markup stays */ });
  })();

  /* ---------- Hero: scroll parallax + pointer depth ---------- */
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

  /* ---------- Magnetic buttons + card spotlight (mouse only) ---------- */
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
