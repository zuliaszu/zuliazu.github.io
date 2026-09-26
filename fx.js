/* fx.js: theme toggle + motion layer (constellation canvas, typed line, headline
   assembly, magnetic buttons, journey reveal). No libraries. Every block is
   guarded: a failure here must never break the page. */
(function () {
  "use strict";
  var KEY = "zs_theme";
  var EVT = "zs:theme";
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches);
  var fine = !(window.matchMedia && matchMedia("(pointer:fine)").matches) ? false : true;

  function cssVar(n, fb) {
    try {
      var v = getComputedStyle(root).getPropertyValue(n).trim();
      return v || fb;
    } catch (e) { return fb; }
  }

  /* ---------- 1. theme toggle (public behaviour unchanged) ---------- */
  function currentTheme() {
    return root.dataset.theme === "light" ? "light" : "dark";
  }
  function apply(t) {
    root.dataset.theme = t;
    try { localStorage.setItem(KEY, t); } catch (e) {}
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#0a0f1c" : "#f5f7fb");
    var b = document.querySelector(".theme-btn");
    if (b) {
      b.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      b.setAttribute("aria-label", t === "dark" ? "Dark theme on, switch to light" : "Light theme on, switch to dark");
      var lab = b.querySelector(".lab");
      if (lab) lab.textContent = t === "dark" ? "Light" : "Dark";
    }
    try { root.dispatchEvent(new CustomEvent(EVT, { bubbles: true, detail: { theme: t } })); } catch (e) {}
  }
  try {
    apply(currentTheme());
    var btn = document.querySelector(".theme-btn");
    if (btn) btn.addEventListener("click", function () {
      apply(currentTheme() === "dark" ? "light" : "dark");
    });
  } catch (e) {}

  /* ---------- 2. full-page constellation canvas ---------- */
  try {
    (function () {
      var cv = document.getElementById("fx");
      if (!cv || !cv.getContext) return;
      var ctx = cv.getContext("2d");
      if (!ctx) return;

      var W = 0, H = 0, FH = 0, dpr = 1;
      var nodes = [], mouse = { x: -1e5, y: -1e5, on: false };
      var running = false, visible = true, raf = 0, t0 = 0, par = 0;
      var packet = null, nextPacket = 1200, pulses = [];
      var COL = { node: "#2c3a52", edge: "#24344a", hot: "#35e0e6", grid: "#1b2436" };

      function readColours() {
        COL.node = cssVar("--fx-node", "#2c3a52");
        COL.edge = cssVar("--fx-edge", "#24344a");
        COL.hot = cssVar("--fx-hot", "#35e0e6");
        COL.grid = cssVar("--fx-grid", "#1b2436");
      }

      function build() {
        var n = W < 700 ? 40 : 90;
        nodes = [];
        for (var i = 0; i < n; i++) {
          nodes.push({
            x: Math.random() * W, y: Math.random() * FH,
            hx: 0, hy: 0,
            vx: (Math.random() - 0.5) * 0.14, vy: (Math.random() - 0.5) * 0.14,
            r: 1.1 + Math.random() * 1.3, ph: Math.random() * 6.283, ring: 0
          });
        }
        packet = null;
      }

      function size() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = Math.max(1, window.innerWidth);
        H = Math.max(1, window.innerHeight);
        FH = H + 520;
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        cv.style.width = W + "px";
        cv.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        build();
      }

      function startPacket() {
        var tries = 0;
        while (tries++ < 40) {
          var a = (Math.random() * nodes.length) | 0, b = (Math.random() * nodes.length) | 0;
          if (a === b) continue;
          var dx = nodes[a].x - nodes[b].x, dy = (nodes[a].y - nodes[b].y);
          if (dx * dx + dy * dy < 140 * 140) { packet = { a: a, b: b, t: 0 }; return; }
        }
      }

      function drawGrid(off) {
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.strokeStyle = COL.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        var x, y;
        for (x = 0; x <= W; x += 80) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
        var y0 = -((off % 80) + 80) % 80;
        for (y = y0; y <= H; y += 80) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
        ctx.stroke();
        ctx.restore();
      }

      function frame(ts) {
        raf = 0;
        if (!t0) t0 = ts || 0;
        var now = (ts || 0);
        var dt = 16.7;
        var time = (now - t0) / 1000;
        par = -(window.pageYOffset || 0) * 0.08;
        if (par < -500) par = -500;

        ctx.clearRect(0, 0, W, H);
        drawGrid(par);

        var i, j, nd, R = 180, R2 = R * R;

        for (i = 0; i < nodes.length; i++) {
          nd = nodes[i];
          if (!reduce) {
            nd.x += nd.vx; nd.y += nd.vy;
            if (nd.x < 0) { nd.x = 0; nd.vx *= -1; }
            if (nd.x > W) { nd.x = W; nd.vx *= -1; }
            if (nd.y < 0) { nd.y = 0; nd.vy *= -1; }
            if (nd.y > FH) { nd.y = FH; nd.vy *= -1; }
          }
          var sy = nd.y + par;
          var tx = 0, ty = 0;
          if (mouse.on && !reduce) {
            var mdx = mouse.x - nd.x, mdy = mouse.y - sy;
            var md2 = mdx * mdx + mdy * mdy;
            if (md2 < R2 && md2 > 1) {
              var pull = (1 - md2 / R2) * 12;
              var md = Math.sqrt(md2);
              tx = (mdx / md) * pull; ty = (mdy / md) * pull;
            }
          }
          nd.hx += (tx - nd.hx) * 0.08;
          nd.hy += (ty - nd.hy) * 0.08;
          nd.sx = nd.x + nd.hx;
          nd.sy = sy + nd.hy;
          if (nd.ring > 0) nd.ring -= dt;
        }

        /* edges */
        var LINK = 140, LINK2 = LINK * LINK;
        for (i = 0; i < nodes.length; i++) {
          var A = nodes[i];
          if (A.sy < -60 || A.sy > H + 60) continue;
          for (j = i + 1; j < nodes.length; j++) {
            var B = nodes[j];
            var dx = A.sx - B.sx, dy = A.sy - B.sy;
            var d2 = dx * dx + dy * dy;
            if (d2 > LINK2) continue;
            var fall = 1 - Math.sqrt(d2) / LINK;
            var mx = (A.sx + B.sx) / 2, my = (A.sy + B.sy) / 2;
            var heat = 0;
            if (mouse.on) {
              var hd2 = (mx - mouse.x) * (mx - mouse.x) + (my - mouse.y) * (my - mouse.y);
              if (hd2 < R2) heat = 1 - hd2 / R2;
            }
            ctx.beginPath();
            ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy);
            ctx.strokeStyle = heat > 0.05 ? COL.hot : COL.edge;
            ctx.globalAlpha = fall * (0.13 + heat * 0.42);
            ctx.lineWidth = heat > 0.05 ? 0.9 + heat * 0.5 : 0.8;
            ctx.stroke();
          }
        }

        /* nodes */
        for (i = 0; i < nodes.length; i++) {
          nd = nodes[i];
          if (nd.sy < -20 || nd.sy > H + 20) continue;
          var h = 0;
          if (mouse.on) {
            var q2 = (nd.sx - mouse.x) * (nd.sx - mouse.x) + (nd.sy - mouse.y) * (nd.sy - mouse.y);
            if (q2 < R2) h = 1 - q2 / R2;
          }
          var pulse = reduce ? 0 : 0.5 + 0.5 * Math.sin(time * 0.6 + nd.ph);
          ctx.beginPath();
          ctx.arc(nd.sx, nd.sy, nd.r * (1 + h * 0.45), 0, 6.283);
          ctx.fillStyle = h > 0.05 ? COL.hot : COL.node;
          ctx.globalAlpha = 0.26 + pulse * 0.1 + h * 0.45;
          ctx.fill();
          if (nd.ring > 0) {
            var k = nd.ring / 600;
            ctx.beginPath();
            ctx.arc(nd.sx, nd.sy, nd.r + (1 - k) * 9, 0, 6.283);
            ctx.strokeStyle = COL.hot;
            ctx.lineWidth = 2;
            ctx.globalAlpha = k * 0.55;
            ctx.stroke();
          }
        }

        /* packet */
        if (!reduce) {
          nextPacket -= dt;
          if (!packet && nextPacket <= 0) { startPacket(); nextPacket = 6000; }
          if (packet) {
            var P = nodes[packet.a], Q = nodes[packet.b];
            if (!P || !Q) { packet = null; }
            else {
              packet.t += 0.012;
              if (packet.t >= 1) { Q.ring = 600; packet = null; }
              else {
                var px = P.sx + (Q.sx - P.sx) * packet.t, py = P.sy + (Q.sy - P.sy) * packet.t;
                ctx.beginPath();
                ctx.arc(px, py, 2.1, 0, 6.283);
                ctx.fillStyle = COL.hot;
                ctx.globalAlpha = 0.85;
                ctx.fill();
              }
            }
          }
        }
        ctx.globalAlpha = 1;
        if (running && !reduce) raf = requestAnimationFrame(frame);
      }

      function start() {
        if (reduce || running || !visible) return;
        running = true;
        if (!raf) raf = requestAnimationFrame(frame);
      }
      function stop() {
        running = false;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }

      readColours();
      size();
      if (reduce) frame(0); else start();

      var rt;
      addEventListener("resize", function () {
        clearTimeout(rt);
        rt = setTimeout(function () { size(); if (reduce) frame(0); }, 160);
      }, { passive: true });

      if (fine && !reduce) {
        addEventListener("pointermove", function (e) {
          mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
        }, { passive: true });
        addEventListener("pointerleave", function () { mouse.on = false; }, { passive: true });
        document.addEventListener("mouseleave", function () { mouse.on = false; }, { passive: true });
      }

      document.addEventListener("visibilitychange", function () {
        visible = !document.hidden;
        if (visible) start(); else stop();
      });

      root.addEventListener(EVT, function () {
        readColours();
        if (reduce) frame(0);
      });
    })();
  } catch (e) {}

  /* ---------- 3. typed line ---------- */
  try {
    (function () {
      var el = document.getElementById("typed");
      if (!el) return;
      var phrases = ["prompt injection", "zero data retention", "agent and MCP security", "EU AI Act readiness", "getting you into the field"];
      try {
        var raw = el.getAttribute("data-phrases");
        if (raw) {
          var p = JSON.parse(raw);
          if (p && p.length) phrases = p;
        }
      } catch (e) {}
      el.textContent = "";
      var out = document.createElement("span");
      out.className = "tw-txt";
      var cur = document.createElement("span");
      cur.className = "tw-cur";
      cur.setAttribute("aria-hidden", "true");
      cur.textContent = "|";
      el.appendChild(out);
      el.appendChild(cur);
      if (reduce) { out.textContent = phrases[0]; return; }
      var i = 0, c = 0, del = false;
      (function step() {
        var word = phrases[i % phrases.length];
        if (!del) {
          c++;
          out.textContent = word.slice(0, c);
          if (c >= word.length) { del = true; setTimeout(step, 1600); return; }
          setTimeout(step, 45);
        } else {
          c--;
          out.textContent = word.slice(0, Math.max(0, c));
          if (c <= 0) { del = false; i++; setTimeout(step, 260); return; }
          setTimeout(step, 22);
        }
      })();
    })();
  } catch (e) {}

  /* ---------- 4. headline assembly ---------- */
  try {
    (function () {
      var h1 = document.querySelector(".hero h1");
      if (!h1 || h1.children.length) return;
      var words = (h1.textContent || "").trim().split(/\s+/);
      if (!words.length || !words[0]) return;
      h1.textContent = "";
      for (var i = 0; i < words.length; i++) {
        var s = document.createElement("span");
        s.className = "hw";
        s.textContent = words[i];
        h1.appendChild(s);
        if (i < words.length - 1) h1.appendChild(document.createTextNode(" "));
        if (reduce) { s.style.opacity = "1"; s.style.transform = "none"; continue; }
        s.style.display = "inline-block";
        s.style.opacity = "0";
        s.style.transform = "translate3d(0,0.5em,0)";
        s.style.transition = "opacity .62s cubic-bezier(.23,1,.32,1) " + (i * 60) + "ms, transform .62s cubic-bezier(.23,1,.32,1) " + (i * 60) + "ms";
      }
      if (reduce) return;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var sp = h1.querySelectorAll(".hw");
          for (var k = 0; k < sp.length; k++) {
            sp[k].style.opacity = "1";
            sp[k].style.transform = "translate3d(0,0,0)";
          }
        });
      });
    })();
  } catch (e) {}

  /* ---------- 5. magnetic buttons ---------- */
  try {
    (function () {
      if (reduce || !fine) return;
      var btns = [].slice.call(document.querySelectorAll(".btn"));
      if (!btns.length) return;
      btns.forEach(function (b) {
        b.style.transition = "transform .28s cubic-bezier(.23,1,.32,1)";
      });
      var pend = false, mx = 0, my = 0;
      addEventListener("pointermove", function (e) {
        mx = e.clientX; my = e.clientY;
        if (pend) return;
        pend = true;
        requestAnimationFrame(function () {
          pend = false;
          for (var i = 0; i < btns.length; i++) {
            var b = btns[i], r = b.getBoundingClientRect();
            var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            var dx = mx - Math.min(Math.max(mx, r.left), r.right);
            var dy = my - Math.min(Math.max(my, r.top), r.bottom);
            var gap = Math.sqrt(dx * dx + dy * dy);
            if (gap > 40) { if (b._m) { b.style.transform = ""; b._m = false; } continue; }
            var k = (1 - gap / 40) * 6;
            var vx = mx - cx, vy = my - cy;
            var vl = Math.sqrt(vx * vx + vy * vy) || 1;
            b.style.transform = "translate3d(" + ((vx / vl) * k).toFixed(2) + "px," + ((vy / vl) * k).toFixed(2) + "px,0)";
            b._m = true;
          }
        });
      }, { passive: true });
      document.addEventListener("mouseleave", function () {
        btns.forEach(function (b) { b.style.transform = ""; b._m = false; });
      }, { passive: true });
    })();
  } catch (e) {}

  /* ---------- 6. route progress line ---------- */
  try {
    (function () {
      var jy = document.getElementById("journey");
      if (!jy) return;
      if (reduce || !window.IntersectionObserver) { jy.classList.add("jy-inview"); return; }
      new IntersectionObserver(function (es, o) {
        if (es[0].isIntersecting) { jy.classList.add("jy-inview"); o.disconnect(); }
      }, { threshold: 0.18 }).observe(jy);
    })();
  } catch (e) {}
})();
