/* My plan: tick resources anywhere, snapshot the quiz week plan, render it on plan.html.
   Storage: aiscp_done {key: ISO date}, aiscp_plan {saved, top, path_title, hours, weeks, proof}. */
(function () {
  var REL = window.AISCP_REL || "", DONE = "aiscp_done", PLAN = "aiscp_plan";
  var SKILLS = {
    "Agents": { name: "Agent and agentic system security: tool use, permissions, memory, multi-agent", slug: "agents" },
    "AppSec": { name: "Application security for LLM-backed software", slug: "appsec" },
    "Architecture": { name: "AI system threat modelling and secure architecture", slug: "architecture" },
    "Cloud": { name: "Securing model and agent workloads on cloud platforms", slug: "cloud" },
    "Coding": { name: "Python and coding for AI security work", slug: "coding" },
    "Customer-facing": { name: "Advisory and customer-facing delivery skills", slug: "customer-facing" },
    "GRC": { name: "AI governance, risk and compliance: NIST AI RMF, ISO/IEC 42001, EU AI Act, CSA AICM", slug: "grc" },
    "IAM": { name: "Identity and least privilege for agents and tools", slug: "iam" },
    "LLM": { name: "LLM security: prompt injection, jailbreaks, output handling", slug: "llm" },
    "MCP": { name: "Model Context Protocol security: servers, tool poisoning, auth", slug: "mcp" },
    "RAG": { name: "RAG pipeline security: retrieval, vector stores, data poisoning", slug: "rag" },
    "Red teaming": { name: "AI red teaming and adversarial testing", slug: "red-teaming" },
    "SOC": { name: "Detection, logging and response for AI systems", slug: "soc" }
  };
  var BY_NAME = {}; Object.keys(SKILLS).forEach(function (k) { BY_NAME[SKILLS[k].name] = SKILLS[k].slug; });

  function get(k, f) { try { var v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? f : v; } catch (e) { return f; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s === undefined || s === null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function ticked(key) { return !!get(DONE, {})[key]; }
  function tick(key, on) { var d = get(DONE, {}); if (on) d[key] = new Date().toISOString(); else delete d[key]; set(DONE, d); }
  function num(s, re) { var m = re.exec(s || ""); return m ? Number(m[1]) : 0; }

  function paint(a, on) { a.classList.toggle("done", on); var li = a.closest("li, .ri"); if (li) li.classList.toggle("done", on); }
  function box(a, key) {
    if (a.getAttribute("data-plan-box")) return;
    a.setAttribute("data-plan-box", "1");
    var lab = document.createElement("label"), cb = document.createElement("input");
    lab.className = "dn"; cb.type = "checkbox"; cb.checked = ticked(key);
    cb.title = "Mark as done"; cb.setAttribute("aria-label", "Mark as done");
    lab.appendChild(cb); a.parentNode.insertBefore(lab, a);
    cb.addEventListener("change", function () { tick(key, cb.checked); paint(a, cb.checked); if (window.AISCP_PLAN_RENDER) window.AISCP_PLAN_RENDER(); });
    paint(a, cb.checked);
  }
  function boxes(root) {
    (root || document).querySelectorAll('.res li a[href^="http"], .ridx .ri a[href^="http"], .pl-list li a[href^="http"]').forEach(function (a) { box(a, a.getAttribute("href")); });
  }

  function snapshot() {
    var wks = document.querySelectorAll(".result .wk");
    if (!wks.length) return;
    var hours = 0;
    document.querySelectorAll(".result h3").forEach(function (h) { hours = hours || num(h.textContent, /about\s+([\d.]+)\s+hours a week/i); });
    var weeks = [].map.call(wks, function (w) {
      return { items: [].map.call(w.querySelectorAll('.res li a[href^="http"]'), function (a) {
        var li = a.closest("li"), sk = li.querySelector(".skl"), m = li.querySelector(".m");
        return { title: a.textContent.trim(), url: a.getAttribute("href"), skill: sk ? sk.textContent.trim() : "", hours: num(m && m.textContent, /([\d.]+)\s*h\b/) };
      }) };
    });
    var pe = document.querySelector(".result .res-sec.proof"), proof = null;
    if (pe) {
      var h3 = pe.querySelector("h3"), mu = pe.querySelector(".small.muted");
      proof = { title: (h3 ? h3.textContent : "").replace(/^Then prove it:\s*/, "").trim(), hours: num(mu && mu.textContent, /About\s+([\d.]+)\s+hours/i) };
    }
    var rolel = document.querySelector(".result .rolel b"), h2 = document.querySelector(".result h2");
    var runs = get("aiscp_runs", []), last = runs.length ? runs[runs.length - 1] : {};
    set(PLAN, { saved: new Date().toISOString(), top: last.top || (h2 ? h2.textContent.trim() : ""),
      path_title: rolel ? rolel.textContent.trim() : "", hours: hours, weeks: weeks, proof: proof });
  }

  /* The quiz calls this once it has rendered a week plan. Before that there is no .wk in the result and snapshot()
     leaves any earlier saved plan alone, so a result on its own never overwrites aiscp_plan. */
  window.AISCP_PLAN_SNAPSHOT = snapshot;

  function itemRow(it) {
    var slug = BY_NAME[it.skill];
    var sk = it.skill ? '<span class="skl">' + (slug ? '<a href="' + REL + "learn/" + slug + '.html">' + esc(it.skill) + "</a>" : esc(it.skill)) + "</span>" : "";
    return "<li>" + sk + '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.title) + "</a>" +
      (it.hours ? ' <span class="m">' + it.hours + " h</span>" : "") + "</li>";
  }

  function renderPlan(root) {
    var p = get(PLAN, null), d = get(DONE, {});
    if (!p || !p.weeks) {
      root.innerHTML = '<div class="card"><h2>Take the diagnostic first</h2><p>Your plan is built from a diagnostic result. It is stored in this browser only.</p><p><a class="btn" href="' + REL + 'index.html#quiz">Take the diagnostic</a></p></div>';
      return;
    }
    var all = [], planKeys = {};
    p.weeks.forEach(function (w) { (w.items || []).forEach(function (it) { all.push(it); planKeys[it.url] = 1; }); });
    var doneN = all.filter(function (it) { return !!d[it.url]; }).length;
    var leftH = all.reduce(function (s, it) { return s + (d[it.url] ? 0 : (it.hours || 0)); }, 0);
    var pk = p.proof ? "proof:" + p.proof.title : null, proofDone = pk ? !!d[pk] : false;
    if (p.proof && !proofDone) leftH += p.proof.hours || 0;
    var total = all.length + (p.proof ? 1 : 0), doneAll = doneN + (proofDone ? 1 : 0);
    var pct = total ? Math.round(100 * doneAll / total) : 0;

    var html = '<div class="card"><div class="pl-head"><div><h2 style="margin:0 0 4px">' + esc(p.path_title || p.top || "Your plan") + "</h2>" +
      '<p class="small muted" style="margin:0">Saved ' + esc((p.saved || "").slice(0, 10)) + (p.hours ? ", about " + p.hours + " hours a week" : "") + ". Kept in this browser only.</p></div>" +
      '<div class="small muted">' + doneAll + " of " + total + " done, about " + Math.round(leftH) + " hours left</div></div>" +
      '<div class="pl-bar"><i style="width:' + pct + '%"></i></div>';

    html += p.weeks.map(function (w, i) {
      var items = w.items || [], n = items.filter(function (it) { return !!d[it.url]; }).length;
      var st = items.length && n === items.length ? "done" : n ? n + " of " + items.length + " done" : "not started";
      return '<div class="pl-wk"><div class="pl-wk-h"><b>Week ' + (i + 1) + '</b><span class="pl-st">' + st + "</span></div>" +
        '<ul class="pl-list res">' + items.map(itemRow).join("") + "</ul></div>";
    }).join("");

    if (p.proof) {
      html += '<div class="pl-wk"><div class="pl-wk-h"><b>Proof exercise</b><span class="pl-st">' + (proofDone ? "done" : "to do") + "</span></div>" +
        '<ul class="pl-list"><li><label class="dn"><input type="checkbox" id="pl-proof"' + (proofDone ? " checked" : "") + ' aria-label="Mark as done"></label><span' + (proofDone ? ' class="done"' : "") + ">" + esc(p.proof.title) + "</span>" +
        (p.proof.hours ? ' <span class="m">about ' + p.proof.hours + " h</span>" : "") + "</li></ul></div>";
    }
    html += '<p style="margin:18px 0 0"><button type="button" class="btn ghost" id="pl-clear">Clear my plan</button></p></div>';

    var others = Object.keys(d).filter(function (k) { return k.indexOf("http") === 0 && !planKeys[k]; });
    if (others.length) {
      html += '<div class="card" style="margin-top:16px"><h2 style="margin:0 0 4px">Resources you ticked elsewhere</h2>' +
        '<p class="small muted" style="margin:0 0 8px">' + others.length + " item" + (others.length === 1 ? "" : "s") + " outside this plan.</p>" +
        '<ul class="pl-list">' + others.map(function (u) {
          return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u.replace(/^https?:\/\//, "").slice(0, 70)) + "</a>" +
            '<span class="pl-url">ticked ' + esc(String(d[u]).slice(0, 10)) + "</span></li>";
        }).join("") + "</ul></div>";
    }
    root.innerHTML = html;
    var cb = document.getElementById("pl-proof");
    if (cb) cb.addEventListener("change", function () { tick(pk, cb.checked); renderPlan(root); });
    var cl = document.getElementById("pl-clear");
    if (cl) cl.addEventListener("click", function () {
      if (window.confirm("Clear the saved plan? Your ticks stay, the plan snapshot goes.")) { try { localStorage.removeItem(PLAN); } catch (e) {} renderPlan(root); }
    });
    boxes(root);
  }

  function run() {
    boxes(document);
    snapshot();
    var root = document.getElementById("plan-root");
    if (root) { window.AISCP_PLAN_RENDER = function () { renderPlan(root); }; renderPlan(root); }
  }
  function ready(f) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", f); else f(); }
  ready(function () {
    run();
    var q = document.getElementById("quiz");
    if (q && window.MutationObserver) new MutationObserver(function () { boxes(document); snapshot(); }).observe(q, { childList: true, subtree: true });
  });
})();
