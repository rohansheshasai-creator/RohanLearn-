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
    word.style.animationDelay = (120 + i * 85) + "ms";
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  revealEls.forEach(function (el) {
    el.style.setProperty("--d", (el.dataset.delay || 0) + "ms");
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    // No animation — just show everything.
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-visible");
        revealObserver.unobserve(el);             // reveal once, then stop watching

        // Tilt cards animate their own transform on hover. Once the reveal
        // has played out, drop the reveal classes so its slow transform
        // transition stops fighting the snappy tilt.
        if (el.classList.contains("tilt")) {
          setTimeout(function () {
            el.classList.remove("reveal", "is-visible");
          }, (parseInt(el.dataset.delay, 10) || 0) + 1000);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Nav: solidify on scroll + progress bar ---------- */
  var nav      = document.getElementById("nav");
  var progress = document.querySelector(".progress__bar");
  var ticking  = false;

  function onScroll() {
    var y = window.scrollY;

    if (nav) nav.classList.toggle("is-stuck", y > 30);

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });

  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector(".nav__burger");
  var menu   = document.getElementById("mobile-menu");

  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });

    // Close the menu after tapping a link
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
      });
    });

    // Close on Escape
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
      var eased = 1 - Math.pow(1 - p, 3);          // ease-out cubic
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
      pos.x += (target.x - pos.x) * 0.12;          // lerp toward the cursor
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

    /* 3D tilt + moving glare on cards */
    document.querySelectorAll(".tilt").forEach(function (card) {
      var glare = card.querySelector(".card__glare");

      card.addEventListener("pointermove", function (e) {
        var r  = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;    // 0 → 1
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
