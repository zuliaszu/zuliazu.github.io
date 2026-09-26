/* Progress component for the home page. Reads the quiz result from localStorage
   (aiscp_runs, written by quiz/quiz.js) and renders four steps, the last three
   gated until a result exists. No network, no accounts. */
(function () {
  "use strict";

  var PLATFORM = "ai-security-career-platform/";
  var SEEN_KEY = "zs_seen_run";

  var ROLES = {
    "AI/Agent Security Engineer": { slug: "engineer", role: "The Builder", title: "AI Security Engineer" },
    "AI Red Team / Adversarial Testing": { slug: "red-team", role: "The Breaker", title: "AI Red Teamer" },
    "AI Security Architect": { slug: "architect", role: "The Architect", title: "AI Security Architect" },
    "AI Governance / GRC": { slug: "grc", role: "The Governor", title: "AI Governance and Risk Lead" },
    "Consulting / Field delivery management": { slug: "consulting", role: "The Advisor", title: "AI Security Consultant" },
    "AI Security Research / Applied Science": { slug: "research", role: "The Researcher", title: "AI Security Researcher" },
    "AI Compliance and Assurance": { slug: "compliance", role: "The Assessor", title: "AI Compliance and Assurance Lead" }
  };

  function readJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function readString(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeString(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) { /* private mode, ignore */ }
  }

  function removeKey(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
  }

  /* Last run by "at", falling back to array order when "at" is missing. */
  function lastRun() {
    var runs = readJSON("aiscp_runs");
    if (!runs || !runs.length) return null;
    var best = null;
    for (var i = 0; i < runs.length; i++) {
      var r = runs[i];
      if (!r || typeof r !== "object" || typeof r.top !== "string") continue;
      if (!best) { best = r; continue; }
      var a = Date.parse(r.at || "") || i;
      var b = Date.parse(best.at || "") || -1;
      if (a >= b) best = r;
    }
    return best;
  }

  function doneCount() {
    var done = readJSON("aiscp_done");
    if (!done) return 0;
    if (Array.isArray(done)) return done.length;
    if (typeof done === "object") {
      var n = 0;
      for (var k in done) {
        if (Object.prototype.hasOwnProperty.call(done, k) && done[k]) n++;
      }
      return n;
    }
    return 0;
  }

  function state() {
    var run = lastRun();
    var map = run ? ROLES[run.top] : null;
    if (!run || !map) return { done: false, role: null, title: null, slug: null };
    return { done: true, role: map.role, title: map.title, slug: map.slug, at: run.at || null };
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function lockIcon() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("aria-hidden", "true");
    var body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("x", "4"); body.setAttribute("y", "10.5");
    body.setAttribute("width", "16"); body.setAttribute("height", "10");
    body.setAttribute("rx", "2.5");
    var shackle = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shackle.setAttribute("d", "M8 10.5V8a4 4 0 0 1 8 0v2.5");
    svg.appendChild(body);
    svg.appendChild(shackle);
    return svg;
  }

  function arrowIcon() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", "M5 12h14M13 6l6 6-6 6");
    svg.appendChild(p);
    return svg;
  }

  function steps(s) {
    var base = s.done ? PLATFORM + "paths/" + s.slug + ".html" : null;
    var plan = readJSON("aiscp_plan");
    var ticks = doneCount();
    var planNote = "A study schedule based on your available time.";
    if (s.done && plan) {
      planNote = ticks > 0
        ? "Started. " + ticks + (ticks === 1 ? " step" : " steps") + " ticked off."
        : "Started.";
    }
    return [
      {
        n: 1, open: true,
        head: "Find your role",
        body: "Sixteen questions about how you work today. About four minutes, no signup.",
        href: "quiz/",
        cta: s.done ? "Take it again" : "Take the quiz"
      },
      {
        n: 2, open: s.done,
        head: "Your path",
        body: s.done
          ? "Skills in the order to learn them, free resources first."
          : "One of seven paths: engineer, red team, architect, governance, compliance, consulting, research.",
        href: base, cta: "Open your path"
      },
      {
        n: 3, open: s.done,
        head: "Your study plan",
        body: planNote,
        href: PLATFORM + "plan.html", cta: "Open the plan",
        flag: (s.done && plan) ? "Started" : null
      },
      {
        n: 4, open: s.done,
        head: "Prove it",
        body: "A practice exercise with a deliverable and self-checks.",
        href: base ? base + "#proof" : null, cta: "Open the exercise"
      }
    ];
  }

  function render(mount) {
    var s = state();
    var list = el("ol", "jy-steps");
    var items = steps(s);
    var gated = [];

    items.forEach(function (st) {
      var li = el("li", "jy-step" + (st.open ? "" : " is-locked"));
      if (!st.open) li.setAttribute("aria-disabled", "true");

      var top = el("div", "jy-top");
      top.appendChild(el("span", "jy-n", String(st.n)));
      if (!st.open) {
        var lk = el("span", "jy-lock");
        lk.appendChild(lockIcon());
        top.appendChild(lk);
      } else if (st.flag) {
        top.appendChild(el("span", "jy-flag", st.flag));
      }
      li.appendChild(top);

      li.appendChild(el("h3", "jy-h", st.head));
      if (st.n === 2 && s.done) {
        li.appendChild(el("p", "jy-role", "Your role: " + s.role + ", " + s.title));
      }
      li.appendChild(el("p", "jy-b", st.body));

      if (st.open && st.href) {
        var a = el("a", "jy-go", st.cta);
        a.href = st.href;
        if (st.href.indexOf("http") === 0) a.rel = "noopener";
        a.appendChild(arrowIcon());
        li.appendChild(a);
      } else {
        li.appendChild(el("p", "jy-locked-note", "Unlocks after the quiz"));
      }

      if (st.n > 1) gated.push(li);
      list.appendChild(li);
    });

    var wrap = el("div", "jy");
    wrap.appendChild(list);

    var msg = el("p", "jy-msg");
    msg.setAttribute("role", "status");
    msg.hidden = true;
    wrap.appendChild(msg);

    var foot = el("p", "jy-foot");
    foot.appendChild(el("span", null, "Saved in this browser only. "));
    var reset = el("button", "jy-reset", "Reset");
    reset.type = "button";
    foot.appendChild(reset);
    wrap.appendChild(foot);

    mount.innerHTML = "";
    mount.appendChild(wrap);

    reset.addEventListener("click", function () {
      removeKey(SEEN_KEY);
      render(mount);
    });

    if (s.done && s.at && readString(SEEN_KEY) !== String(s.at)) {
      celebrate(gated, msg);
      writeString(SEEN_KEY, String(s.at));
    }
  }

  function celebrate(nodes, msg) {
    msg.textContent = "Open now: your path, your plan and the proof exercise.";
    msg.hidden = false;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    msg.classList.add("is-new");
    nodes.forEach(function (n, i) {
      n.classList.add("jy-pop");
      n.style.animationDelay = (i * 400) + "ms";
    });
  }

  function init() {
    var mount = document.getElementById("journey");
    if (!mount) return;
    render(mount);
  }

  window.ZS = window.ZS || {};
  window.ZS.unlockState = function () {
    var s = state();
    return { done: s.done, role: s.role, title: s.title, slug: s.slug };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
