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

  /* ---------- Letter-stagger reveal for section headings ----------
     A text-level burst animation, distinct from the panel-level 3D
     tilt used for cards/CTAs. Splits each .reveal-chars heading into
     per-character spans (preserving nested tags like <em>), then
     bursts them in, staggered, the first time the heading is scrolled
     into view. */
  (function initCharReveal() {
    var headings = document.querySelectorAll(".reveal-chars");
    if (!headings.length) return;

    var i;
    headings.forEach(function (heading) {
      i = 0;
      (function wrap(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {                    // text node
            var frag = document.createDocumentFragment();
            // Split into words first, and keep each word's letters inside
            // one no-wrap container — otherwise every letter is free to
            // wrap independently and long words break mid-letter at the
            // edge of the line (e.g. "strat" / "egy.").
            child.textContent.split(" ").forEach(function (word, wi, words) {
              if (word !== "") {
                var wordSpan = document.createElement("span");
                wordSpan.className = "char-word";
                word.split("").forEach(function (ch) {
                  var span = document.createElement("span");
                  span.className = "char";
                  span.style.setProperty("--i", i++);
                  span.textContent = ch;
                  wordSpan.appendChild(span);
                });
                frag.appendChild(wordSpan);
              }
              if (wi < words.length - 1) frag.appendChild(document.createTextNode(" "));
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            wrap(child);                                  // recurse into e.g. <em>
          }
        });
      })(heading);
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      headings.forEach(function (h) { h.classList.add("is-in"); });
      return;
    }

    var charObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        charObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    headings.forEach(function (h) { charObserver.observe(h); });
  })();

  /* ---------- Button ripple — click-triggered, not hover/scroll ---------- */
  document.querySelectorAll(".btn").forEach(function (btn) {
    btn.addEventListener("pointerdown", function (e) {
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 1.6;
      var ripple = document.createElement("span");
      ripple.className = "btn__ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - r.left - size / 2) + "px";
      ripple.style.top  = (e.clientY - r.top  - size / 2) + "px";
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", function () { ripple.remove(); });
    });
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
    // The ticker only runs while something is actually moving, and goes
    // back to sleep once every element has settled — instead of running
    // requestAnimationFrame forever for the entire life of the page (which
    // burns battery/CPU even while you're just reading, motionless).
    var revealRafId = null;

    var ensureRevealLoop = function () {
      if (revealRafId === null) revealRafId = requestAnimationFrame(tickReveal);
    };

    function tickReveal() {
      var stillMoving = false;
      revealTargets.forEach(function (t) {
        var diff = t.target - t.current;
        if (Math.abs(diff) > 0.001) {
          t.current += diff * 0.16;
          stillMoving = true;
        } else if (t.current !== t.target) {
          t.current = t.target;
        }
        t.el.style.setProperty("--p", t.current.toFixed(4));
      });
      revealRafId = stillMoving ? requestAnimationFrame(tickReveal) : null;
    }

    var computeRevealTargets = function () {
      var vh = window.innerHeight;
      var changed = false;
      revealTargets.forEach(function (t) {
        var rect = t.el.getBoundingClientRect();
        var start = vh * 0.92 + t.stagger * 0.4;   // window opens here (element still low on screen)
        var end   = vh * 0.55 + t.stagger * 0.4;   // fully settled by here
        var raw   = (start - rect.top) / (start - end);
        var next  = Math.min(1, Math.max(0, raw));
        if (next !== t.target) { t.target = next; changed = true; }
      });
      if (changed) ensureRevealLoop();
    };

    computeRevealTargets();
    ensureRevealLoop();
  }

  /* ---------- Nav: liquid-glass morph + progress bar + bg parallax ---------- */
  var nav      = document.getElementById("nav");
  var progress = document.querySelector(".progress__bar");
  var ticking  = false;

  function computeRevealTargetsSafe() {
    if (typeof computeRevealTargets === "function") computeRevealTargets();
  }

  function onScroll() {
    // ---- read phase first (avoids forcing a layout flush mid-frame) ----
    var y        = window.scrollY;
    var scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    if (!reduceMotion) computeRevealTargetsSafe();   // reads getBoundingClientRect

    // ---- write phase ----
    if (nav) {
      nav.classList.toggle("is-stuck", y > 30);
      // continuous "compactness" 0→1 over the first 260px of scroll —
      // the nav pill gently shrinks and tightens as you scroll, like a
      // liquid-glass tab bar settling into a smaller capsule.
      nav.style.setProperty("--nav-compact", Math.min(1, y / 260).toFixed(3));
    }

    if (progress) {
      progress.style.width = (scrollMax > 0 ? (y / scrollMax) * 100 : 0) + "%";
    }

    // subtle background parallax
    document.documentElement.style.setProperty(
      "--scroll-parallax", Math.min(60, y * 0.06).toFixed(1) + "px"
    );

    ticking = false;
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

    // Place it instantly the first time — without this, the indicator's own
    // hover transition would animate it growing from a zero-width sliver on
    // every page load, which reads as a glitch rather than an entrance.
    indicator.style.transition = "none";
    moveTo(activeLink);
    void indicator.offsetWidth;           // force layout so the "none" takes hold
    indicator.style.transition = "";      // restore the CSS-defined glide
    requestAnimationFrame(function () { indicator.classList.add("is-ready"); });

    links.forEach(function (link) {
      link.addEventListener("pointerenter", function () { moveTo(link); });
      link.addEventListener("focus", function () { moveTo(link); });
    });
    wrap.addEventListener("pointerleave", function () { moveTo(activeLink); });

    // Keyboard users: once focus leaves the nav entirely, snap back to
    // showing the real active page instead of leaving the pill stranded
    // under whichever link was last tabbed to.
    wrap.addEventListener("focusout", function (e) {
      if (!wrap.contains(e.relatedTarget)) moveTo(activeLink);
    });

    window.addEventListener("resize", function () { moveTo(activeLink); });
  })();

  /* ---------- Carousel ("The channel" section) ----------
     No JS at all now — it's a pure CSS animation (see .carousel__track
     in style.css), the same duplicate-and-loop technique as the ticker
     marquee. Pausing on hover is animation-play-state via :hover, which
     is instant and jank-free in both directions with zero timers. */

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

    /* Glow that trails the cursor (smoothed) — only ticks while it's
       actually catching up to the pointer, not forever in the background. */
    var glow    = document.querySelector(".cursor-glow");
    var target  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var pos     = { x: target.x, y: target.y };
    var glowRaf = null;

    function tickGlow() {
      var dx = target.x - pos.x, dy = target.y - pos.y;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        pos.x += dx * 0.12;
        pos.y += dy * 0.12;
        if (glow) glow.style.transform = "translate3d(" + pos.x + "px," + pos.y + "px,0)";
        glowRaf = requestAnimationFrame(tickGlow);
      } else {
        glowRaf = null;
      }
    }

    window.addEventListener("pointermove", function (e) {
      target.x = e.clientX;
      target.y = e.clientY;
      if (glowRaf === null) glowRaf = requestAnimationFrame(tickGlow);
    }, { passive: true });

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
          (px - 0.5) * 10 + "deg) translateY(-6px) scale(1.025)";

        if (glare) {
          glare.style.setProperty("--mx", px * 100 + "%");
          glare.style.setProperty("--my", py * 100 + "%");
        }
      });

      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });

    /* Poster row — widths are set as explicit px values (not flex-grow)
       so the transition is a plain numeric interpolation: smooth every
       time, in both directions, with no snap. The hovered card is sized
       to exactly height * 16/9; the rest split what's left evenly. */
    (function initPosterRow() {
      var row = document.querySelector(".posters");
      if (!row) return;
      var posters = Array.prototype.slice.call(row.querySelectorAll(".poster"));
      if (!posters.length) return;

      var GAP = 8; // must match the CSS `gap` on .posters

      function layout(hoveredIndex) {
        var rowRect = row.getBoundingClientRect();
        var n = posters.length;
        var available = rowRect.width - GAP * (n - 1);

        if (hoveredIndex === -1) {
          var equalWidth = available / n;
          posters.forEach(function (p) { p.style.width = equalWidth + "px"; });
          return;
        }

        var hoveredWidth = Math.min(rowRect.height * (16 / 9), available - (n - 1) * 60);
        var restWidth = (available - hoveredWidth) / (n - 1);
        posters.forEach(function (p, i) {
          p.style.width = (i === hoveredIndex ? hoveredWidth : restWidth) + "px";
        });
      }

      layout(-1);

      posters.forEach(function (poster, i) {
        poster.addEventListener("pointerenter", function () { layout(i); });
      });
      row.addEventListener("pointerleave", function () { layout(-1); });

      window.addEventListener("resize", function () {
        var hoveredNow = posters.findIndex(function (p) { return p.matches(":hover"); });
        layout(hoveredNow);
      });
    })();
  }

})();
