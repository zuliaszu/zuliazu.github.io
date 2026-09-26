/* fx.js: (1) theme toggle, (2) the hero "agent graph" canvas.
   No libraries. Every block is guarded: a failure here must never break the page. */
(function () {
  "use strict";
  var KEY = "zs_theme";
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---------- 1. theme toggle ---------- */
  function currentTheme() {
    return root.dataset.theme === "light" ? "light" : "dark";
  }
  function apply(t) {
    root.dataset.theme = t;
    try { localStorage.setItem(KEY, t); } catch (e) {}
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#171412" : "#f7f5f1");
    var b = document.querySelector(".theme-btn");
    if (b) {
      b.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      b.setAttribute("aria-label", t === "dark" ? "Dark theme on, switch to light" : "Light theme on, switch to dark");
      var lab = b.querySelector(".lab");
      if (lab) lab.textContent = t === "dark" ? "Light" : "Dark";
    }
  }
  try {
    apply(currentTheme());
    var btn = document.querySelector(".theme-btn");
    if (btn) btn.addEventListener("click", function () {
      apply(currentTheme() === "dark" ? "light" : "dark");
    });
  } catch (e) {}

  /* ---------- 2. hero canvas: a sparse agent graph ---------- */
  try {
    var cv = document.getElementById("fx");
    var hero = document.querySelector(".hero");
    if (!cv || !hero || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    if (!ctx) return;

    var W = 0, H = 0, dpr = 1, nodes = [], edges = [], mouse = { x: -1e4, y: -1e4, on: false };
    var running = false, visible = true, onScreen = true, raf = 0, t0 = 0;

    function cssVar(n, fb) {
      try {
        var v = getComputedStyle(root).getPropertyValue(n).trim();
        return v || fb;
      } catch (e) { return fb; }
    }
    var COL = { ink: "#141413", clay: "#d97757" };
    function readColours() {
      COL.ink = cssVar("--mute", "#7a7570");
      COL.clay = cssVar("--petrol", "#d97757");
    }

    /* alpha damper over the headline column so text stays crisp */
    function legibility(x, y) {
      var textW = W > 900 ? W * 0.58 : W * 0.92;
      return (x < textW && y < H * 0.82) ? 0.45 : 1;
    }

    function build() {
      var area = (W * H) / (dpr * dpr);
      var n = Math.max(14, Math.min(34, Math.round(area / 22000)));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.06 * dpr, vy: (Math.random() - 0.5) * 0.06 * dpr,
          r: (1.3 + Math.random() * 1.5) * dpr,
          lock: Math.random() < 0.22, ph: Math.random() * 6.283
        });
      }
      edges = [];
      var link = 150 * dpr;
      for (var a = 0; a < nodes.length; a++)
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          if (dx * dx + dy * dy < link * link && Math.random() < 0.5) edges.push([a, b]);
        }
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      cv.width = W; cv.height = H;
      cv.style.width = r.width + "px"; cv.style.height = r.height + "px";
      build();
    }

    function padlock(x, y, s, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = COL.clay;
      ctx.lineWidth = Math.max(1, 0.9 * dpr);
      ctx.beginPath();
      ctx.rect(x - s, y - s * 0.35, s * 2, s * 1.35);
      ctx.moveTo(x - s * 0.55, y - s * 0.35);
      ctx.arc(x, y - s * 0.35, s * 0.55, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    }

    function frame(ts) {
      raf = 0;
      if (!t0) t0 = ts || 0;
      var time = ((ts || 0) - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      var i, nd;
      if (!reduce) {
        for (i = 0; i < nodes.length; i++) {
          nd = nodes[i];
          nd.x += nd.vx; nd.y += nd.vy;
          if (nd.x < 0 || nd.x > W) nd.vx *= -1;
          if (nd.y < 0 || nd.y > H) nd.vy *= -1;
        }
      }

      var near = 170 * dpr, near2 = near * near;
      for (i = 0; i < edges.length; i++) {
        var A = nodes[edges[i][0]], B = nodes[edges[i][1]];
        var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        var d2 = (mx - mouse.x) * (mx - mouse.x) + (my - mouse.y) * (my - mouse.y);
        var heat = mouse.on && d2 < near2 ? 1 - d2 / near2 : 0;
        var leg = legibility(mx, my);
        ctx.beginPath();
        ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
        ctx.strokeStyle = heat > 0.04 ? COL.clay : COL.ink;
        ctx.globalAlpha = (0.16 + heat * 0.5) * leg;
        ctx.lineWidth = (heat > 0.04 ? 0.9 + heat : 0.7) * dpr;
        ctx.stroke();
        if (heat > 0.5 && !reduce) {
          var p = (time * 0.35 + i * 0.13) % 1;
          ctx.beginPath();
          ctx.arc(A.x + (B.x - A.x) * p, A.y + (B.y - A.y) * p, 1.6 * dpr, 0, 6.283);
          ctx.fillStyle = COL.clay;
          ctx.globalAlpha = (heat - 0.5) * 1.4 * leg;
          ctx.fill();
        }
      }

      for (i = 0; i < nodes.length; i++) {
        nd = nodes[i];
        var nd2 = (nd.x - mouse.x) * (nd.x - mouse.x) + (nd.y - mouse.y) * (nd.y - mouse.y);
        var h = mouse.on && nd2 < near2 ? 1 - nd2 / near2 : 0;
        var lg = legibility(nd.x, nd.y);
        var pulse = reduce ? 0 : 0.5 + 0.5 * Math.sin(time * 0.7 + nd.ph);
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, nd.r * (1 + h * 0.5), 0, 6.283);
        ctx.fillStyle = h > 0.04 ? COL.clay : COL.ink;
        ctx.globalAlpha = (0.3 + pulse * 0.12 + h * 0.5) * lg;
        ctx.fill();
        if (nd.lock && h > 0.45) padlock(nd.x, nd.y - nd.r * 5, 3.4 * dpr, (h - 0.45) * 1.5 * lg);
      }
      ctx.globalAlpha = 1;

      if (running && !reduce) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduce) { frame(0); return; }
      if (running || !visible || !onScreen) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    readColours();
    size();
    if (reduce) { frame(0); } else { start(); }

    var rt;
    addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); if (reduce) frame(0); }, 160);
    }, { passive: true });

    hero.addEventListener("pointermove", function (e) {
      if (reduce) return;
      var r = cv.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (e.clientY - r.top) * dpr;
      mouse.on = true;
    }, { passive: true });
    hero.addEventListener("pointerleave", function () { mouse.on = false; mouse.x = mouse.y = -1e4; }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      visible ? start() : stop();
    });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        onScreen = es[0].isIntersecting;
        onScreen ? start() : stop();
      }, { threshold: 0 }).observe(hero);
    }

    /* recolour after a theme switch */
    var btn2 = document.querySelector(".theme-btn");
    if (btn2) btn2.addEventListener("click", function () {
      setTimeout(function () { readColours(); if (reduce) frame(0); }, 40);
    });
  } catch (e) {}
})();
