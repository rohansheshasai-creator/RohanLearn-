/* ============================================================
   RohanLearn — interactions & animations
   Plain JavaScript, no libraries. Runs on every page.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Fade the page in once it's ready ---------- */
  requestAnimationFrame(function () {
    document.body.classList.add("is-ready");
  });

  /* ---------- Current year in the footer ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Hero headline: stagger each word ---------- */
  document.querySelectorAll(".hero__title .word").forEach(function (word, i) {
    word.style.animationDelay = (120 + i * 90) + "ms";
  });

  /* ==========================================================
     Scroll-scrubbed 3D reveal (Apple-product-page style)
     Every .reveal element tracks a continuous progress value
     (0→1) as it crosses a window in the viewport. The value is
     eased frame-by-frame (like the cursor glow below) so it
     feels silky rather than snapping to the raw scroll position,
     and it runs both ways — scroll back up and it un-reveals.
     data-delay (ms) is reused as a stagger: it nudges an
     element's reveal window later, so grouped items (e.g. a row
     of cards) settle into place one after another.
     ========================================================== */
  var revealTargets = Array.prototype.map.call(
    document.querySelectorAll(".reveal"),
    function (el) {
      return { el: el, current: 0, target: 0, stagger: parseFloat(el.dataset.delay) || 0 };
    }
  );

  if (reduceMotion || !revealTargets.length) {
    revealTargets.forEach(function (t) { t.el.style.setProperty("--p", 1); });
  } else {
    var computeRevealTargets = function () {
      var vh = window.innerHeight;
      revealTargets.forEach(function (t) {
        var rect = t.el.getBoundingClientRect();
        var start = vh * 0.92 + t.stagger * 0.4;   // window opens here (element still low on screen)
        var end   = vh * 0.55 + t.stagger * 0.4;   // fully settled by here
        var raw   = (start - rect.top) / (start - end);
        t.target = Math.min(1, Math.max(0, raw));
      });
    };

    (function revealLoop() {
      revealTargets.forEach(function (t) {
        var diff = t.target - t.current;
        t.current += diff * 0.16;
        if (Math.abs(diff) < 0.001) t.current = t.target;
        t.el.style.setProperty("--p", t.current.toFixed(4));
      });
      requestAnimationFrame(revealLoop);
    })();
  }

  /* ---------- Nav: liquid-glass morph + progress bar + bg parallax ---------- */
  var nav      = document.getElementById("nav");
  var progress = document.querySelector(".progress__bar");
  var ticking  = false;

  function onScroll() {
    var y = window.scrollY;

    if (nav) {
      nav.classList.toggle("is-stuck", y > 30);
      // continuous "compactness" 0→1 over the first 260px of scroll —
      // the nav pill gently shrinks and tightens as you scroll, like a
      // liquid-glass tab bar settling into a smaller capsule.
      nav.style.setProperty("--nav-compact", Math.min(1, y / 260).toFixed(3));
    }

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }

    // subtle background parallax
    document.documentElement.style.setProperty(
      "--scroll-parallax", Math.min(60, y * 0.06).toFixed(1) + "px"
    );

    if (!reduceMotion) computeRevealTargetsSafe();
    ticking = false;
  }

  function computeRevealTargetsSafe() {
    if (typeof computeRevealTargets === "function") computeRevealTargets();
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });

  window.addEventListener("resize", function () {
    requestAnimationFrame(onScroll);
  });

  onScroll();

  /* ---------- Liquid-glass sliding nav indicator ---------- */
  (function initNavIndicator() {
    var wrap  = document.querySelector(".nav__links");
    if (!wrap) return;
    var links = Array.prototype.slice.call(wrap.querySelectorAll("a"));
    if (!links.length) return;

    var indicator = document.createElement("span");
    indicator.className = "nav__indicator";
    indicator.setAttribute("aria-hidden", "true");
    wrap.insertBefore(indicator, wrap.firstChild);

    var activeLink = wrap.querySelector("a.is-active") || links[0];

    function moveTo(el) {
      if (!el) return;
      var wrapRect = wrap.getBoundingClientRect();
      var elRect   = el.getBoundingClientRect();
      indicator.style.left  = (elRect.left - wrapRect.left) + "px";
      indicator.style.width = elRect.width + "px";
    }

    moveTo(activeLink);
    requestAnimationFrame(function () { indicator.classList.add("is-ready"); });

    links.forEach(function (link) {
      link.addEventListener("pointerenter", function () { moveTo(link); });
      link.addEventListener("focus", function () { moveTo(link); });
    });
    wrap.addEventListener("pointerleave", function () { moveTo(activeLink); });

    window.addEventListener("resize", function () { moveTo(activeLink); });
  })();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector(".nav__burger");
  var menu   = document.getElementById("mobile-menu");

  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        burger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        burger.focus();
      }
    });
  }

  /* ---------- Animated counters in the stats row ---------- */
  var counters = document.querySelectorAll("[data-count]");

  function runCounter(el) {
    var target = parseFloat(el.dataset.count) || 0;
    var suffix = el.dataset.suffix || "";
    var dur    = 1600;
    var start  = null;

    function step(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        el.textContent = (parseFloat(el.dataset.count) || 0).toLocaleString() + (el.dataset.suffix || "");
      });
    } else {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countObserver.unobserve(entry.target);
        });
      }, { threshold: 0.6 });

      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* ---------- Desktop-only pointer effects ---------- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add("has-pointer");

    /* Glow that trails the cursor (smoothed) */
    var glow   = document.querySelector(".cursor-glow");
    var target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var pos    = { x: target.x, y: target.y };

    window.addEventListener("pointermove", function (e) {
      target.x = e.clientX;
      target.y = e.clientY;
    }, { passive: true });

    (function loop() {
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      if (glow) glow.style.transform = "translate3d(" + pos.x + "px," + pos.y + "px,0)";
      requestAnimationFrame(loop);
    })();

    /* Magnetic buttons — they lean toward the cursor */
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + dx * 0.22 + "px," + dy * 0.3 + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });

    /* 3D tilt + moving glare on cards — overrides the scroll-reveal
       transform inline while hovered; reverts to the CSS-driven
       reveal transform (still tracking --p) on pointerleave. */
    document.querySelectorAll(".tilt").forEach(function (card) {
      var glare = card.querySelector(".card__glare");

      card.addEventListener("pointermove", function (e) {
        var r  = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;

        card.style.transform =
          "perspective(900px) rotateX(" + (0.5 - py) * 8 + "deg) rotateY(" +
          (px - 0.5) * 10 + "deg) translateY(-6px)";

        if (glare) {
          glare.style.setProperty("--mx", px * 100 + "%");
          glare.style.setProperty("--my", py * 100 + "%");
        }
      });

      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

})();
