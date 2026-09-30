/* Learning-route progress is independent of the career quiz. No network or account.
   ROUTES is filled at build time from content/routes/*.json: {slug:{t:title,s:[[stepId,label],...]}}.
   The summary (homepage, routes hub, My plan) draws an inline SVG ring and one bar per started route. */
(function () {
  'use strict';
  var KEY = 'aiscp_routes_v1';
  var ROUTES = {"ai-fundamentals":{"t":"AI fundamentals","s":[["first-task","Grade three AI answers for a fictional company"],["what-ai-is","What people actually mean when they say AI"],["how-llms-fail","Why a confident answer can still be wrong"],["prompting","Writing a prompt that gets a usable answer"],["deliverable","One-page AI working note"]]},"security-fundamentals":{"t":"Security fundamentals","s":[["first-task","Threat model a fictional loyalty app on one page"],["core-vocabulary","Assets, threats, vulnerabilities and risk"],["threat-modelling","Threat modelling: four questions, in order"],["controls-and-findings","Identity, controls and writing a finding people act on"],["deliverable","One-page threat model and finding for a fictional system"]]},"ai-security-fundamentals":{"t":"AI security fundamentals","s":[["first-task","Threat-sketch a fictional returns assistant"],["why-different","Instructions, data and prompt injection"],["map-the-system","Map the feature before you judge it"],["shared-vocabulary","Say the risk in words other teams already use"],["controls-and-evidence","Controls and test evidence"],["deliverable","One-page AI feature security review"]]},"developer":{"t":"Build and test a small AI app","s":[["first-task","Run the offline starter and test an access boundary"],["thin-slice","Build the thinnest useful slice"],["break-your-own-app","Break your own app with a poisoned document"],["evals-as-tests","Turn findings into evaluations that run like tests"],["constrain-and-observe","Shrink the blast radius and watch what it does"],["deliverable","Small AI app with an evaluation suite and threat notes"]]},"leadership":{"t":"AI security leadership","s":[["first-task","Write a one-page decision record for one AI use case"],["use-case","Deciding which use cases are worth doing, and who decides"],["risk-benefit","Naming risks and benefits in business terms, and reporting them"],["ownership-evidence","Ownership and the evidence to ask suppliers and teams for"],["operate-respond","Operate the system and respond to incidents"],["deliverable","One-page AI decision and oversight record for a single use case"]]},"technical-presales":{"t":"Technical pre-sales for AI security","s":[["first-task","Map the trust boundaries of a fictional AI assistant"],["validate","Turn a request into a technical validation, not a promise"],["architecture","Read the architecture before you demo it"],["demo","Build a demo that shows a control working"],["questionnaire","Answer the security questionnaire honestly"],["deliverable","Technical validation pack for one AI use case"]]},"sales":{"t":"Sales conversations about AI security","s":[["first-task","Run a written discovery on a fictional request"],["discovery","Discovery: ask about consequences, not technology"],["qualify","Qualification: ready, needs-specialist, or not-ready"],["limits","Talk about limitations without losing the room"],["handover","Hand over so the technical team does not start again"],["deliverable","AI discovery and handover pack"]]},"network-to-ai-security":{"t":"From network security to AI security","s":[["first-task","Map a fictional firewall-change assistant"],["map-the-ai-system","Map the AI system"],["control-the-connections","Secure the connections"],["beyond-the-firewall","Limit what permitted traffic can do"],["test-and-monitor","Test and monitor the controls"],["deliverable","A security review of your fictional assistant"]]}};
  var titles = {'network-to-ai-security':'From network security to AI security','ai-fundamentals':'AI fundamentals','security-fundamentals':'Security fundamentals','ai-security-fundamentals':'AI security fundamentals',developer:'Build and test a small AI app',leadership:'AI security leadership','technical-presales':'Technical pre-sales for AI security',sales:'Sales conversations about AI security'};
  Object.keys(ROUTES).forEach(function (s) { if (ROUTES[s] && ROUTES[s].t) titles[s] = ROUTES[s].t; });
  var data = {}, persistent = true;
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) data = raw;
  } catch (_) { persistent = false; }
  function valid(r) { return r && typeof r === 'object' && Array.isArray(r.done) && r.done.every(function (s) { return typeof s === 'string' && /^[a-z][a-z0-9-]*$/.test(s); }); }
  function element(tag, text, cls) { var n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
  function svg(tag, attrs) { var n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }
  function stepsOf(slug) { return ROUTES[slug] && Array.isArray(ROUTES[slug].s) ? ROUTES[slug].s : null; }
  function stats(slug) {
    var steps = stepsOf(slug), done = new Set(data[slug].done), next = null, total = steps ? steps.length : null, count = 0;
    if (steps) { steps.forEach(function (st) { if (done.has(st[0])) count += 1; else if (!next) next = st; }); }
    else count = done.size;
    return {done: count, total: total, next: next, complete: total !== null && count >= total};
  }
  function ring(done, total) {
    var r = 44, c = 2 * Math.PI * r, pct = total ? Math.min(1, done / total) : 0;
    var node = svg('svg', {viewBox: '0 0 112 112', width: '128', height: '128', role: 'img', 'aria-label': done + ' of ' + total + ' steps completed, ' + Math.round(pct * 100) + ' percent', class: 'route-ring'});
    node.appendChild(svg('circle', {cx: 56, cy: 56, r: r, class: 'route-ring-track'}));
    var arc = svg('circle', {cx: 56, cy: 56, r: r, class: 'route-ring-arc', 'stroke-dasharray': c.toFixed(2), 'stroke-dashoffset': (c * (1 - pct)).toFixed(2)});
    node.appendChild(arc);
    var big = svg('text', {x: 56, y: 53, class: 'route-ring-num', 'text-anchor': 'middle'}); big.textContent = Math.round(pct * 100) + '%';
    var small = svg('text', {x: 56, y: 71, class: 'route-ring-sub', 'text-anchor': 'middle'}); small.textContent = done + ' of ' + total;
    node.appendChild(big); node.appendChild(small);
    return node;
  }
  function summaries() {
    document.querySelectorAll('[data-route-summary]').forEach(function (mount) {
      var slugs = Object.keys(titles).filter(function (s) { return valid(data[s]) && data[s].done.length; }).sort(function (a,b) { return (Number(data[b].updated)||0)-(Number(data[a].updated)||0); });
      mount.replaceChildren(); mount.hidden = !slugs.length;
      if (!slugs.length) return;
      var base = mount.getAttribute('data-route-base') || '', all = slugs.map(stats), known = all.filter(function (x) { return x.total !== null; });
      var done = known.reduce(function (n, x) { return n + x.done; }, 0), total = known.reduce(function (n, x) { return n + x.total; }, 0), finished = known.filter(function (x) { return x.complete; }).length;
      mount.classList.add('route-saved'); mount.appendChild(element('h2', 'Your learning progress'));
      var dash = element('div', '', 'route-dash');
      if (total) {
        var figure = element('div', '', 'route-dash-ring'); figure.appendChild(ring(done, total));
        figure.appendChild(element('p', slugs.length + (slugs.length === 1 ? ' route started' : ' routes started') + (finished ? ', ' + finished + ' complete' : '')));
        dash.appendChild(figure);
      }
      var list = element('ul', '', 'route-bars');
      slugs.forEach(function (s, i) {
        var st = all[i], item = element('li'), head = element('div', '', 'route-bar-head'), a = element('a', titles[s]);
        a.href = base + s + '.html'; head.appendChild(a);
        head.appendChild(element('span', st.total !== null ? st.done + ' of ' + st.total : st.done + ' steps ticked'));
        item.appendChild(head);
        if (st.total !== null) {
          var bar = element('div', '', 'route-bar'), fill = element('i'); fill.style.width = Math.round(100 * st.done / st.total) + '%'; bar.appendChild(fill); bar.setAttribute('aria-hidden', 'true'); item.appendChild(bar);
          var line = element('p', '', 'route-bar-next');
          if (st.complete) { line.textContent = 'Route complete. '; var nxt = element('a', 'Choose what to learn next →'); nxt.href = base + s + '.html#next'; line.appendChild(nxt); }
          else { line.textContent = 'Continue: '; var go = element('a', st.next[1] + ' →'); go.href = base + s + '.html#' + st.next[0]; line.appendChild(go); }
          item.appendChild(line);
        }
        list.appendChild(item);
      });
      dash.appendChild(list); mount.appendChild(dash);
      mount.appendChild(element('p', 'Progress is stored only in this browser. Nothing here is sent anywhere.'));
    });
  }
  var page = document.querySelector('[data-route]');
  if (page) {
    var slug = page.getAttribute('data-route');
    if (!Object.prototype.hasOwnProperty.call(titles, slug)) return;
    var inputs = Array.from(page.querySelectorAll('[data-route-step]'));
    var ids = inputs.map(function (i) { return i.getAttribute('data-route-step'); });
    var old = valid(data[slug]) ? data[slug] : {done:[]};
    var completed = new Set(old.done.filter(function (id) { return ids.indexOf(id) >= 0; }));
    function paint() {
      inputs.forEach(function (input) { input.checked = completed.has(input.getAttribute('data-route-step')); });
      var bar = page.querySelector('progress'); bar.max = inputs.length; bar.value = completed.size;
      page.querySelector('[data-route-status]').textContent = completed.size + ' of ' + inputs.length + ' steps completed' + (completed.size === inputs.length ? '. Route complete. Keep your work and choose what to learn next.' : '.');
      if (!persistent) page.querySelector('[data-route-storage]').textContent = 'Progress cannot be saved in this browser right now. Your ticks work for this visit; keep your own notes before leaving.';
      summaries();
    }
    page.querySelectorAll('.route-tick,.route-progress,.route-print').forEach(function (e) { e.hidden = false; });
    inputs.forEach(function (input) { input.addEventListener('change', function () {
      var id = input.getAttribute('data-route-step');
      if (input.checked) completed.add(id); else completed.delete(id);
      data[slug] = {done:Array.from(completed),updated:Date.now()};
      try { localStorage.setItem(KEY,JSON.stringify(data)); persistent = true; } catch (_) { persistent = false; }
      paint();
      /* Counts only: route slug and step id. Optional analytics (if the visitor accepted) listens for this; no notes or answers exist here. */
      try { document.dispatchEvent(new CustomEvent('aiscp:progress', {detail: {route: slug, step: id, checked: input.checked, done: completed.size, total: inputs.length}})); } catch (_) {}
    }); });
    page.querySelector('.route-print').addEventListener('click',function () { var closed=Array.from(page.querySelectorAll('details:not([open])')); closed.forEach(function(d){d.open=true;}); window.print(); closed.forEach(function(d){d.open=false;}); });
    paint();
  }
  summaries();
  addEventListener('pageshow', function (event) { if (event.persisted) location.reload(); });
}());
