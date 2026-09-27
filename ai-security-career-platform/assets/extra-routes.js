/* Learning-route progress is independent of the career quiz. No network or account. */
(function () {
  'use strict';
  var KEY = 'aiscp_routes_v1';
  var titles = {'network-to-ai-security':'From network security to AI security','ai-fundamentals':'AI fundamentals','security-fundamentals':'Security fundamentals','ai-security-fundamentals':'AI security fundamentals',developer:'Build and test a small AI app',leadership:'AI security leadership','technical-presales':'Technical pre-sales for AI security',sales:'Sales conversations about AI security'};
  var data = {}, persistent = true;
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) data = raw;
  } catch (_) { persistent = false; }
  function valid(r) { return r && typeof r === 'object' && Array.isArray(r.done) && r.done.every(function (s) { return typeof s === 'string' && /^[a-z][a-z0-9-]*$/.test(s); }); }
  function element(tag, text) { var n = document.createElement(tag); if (text) n.textContent = text; return n; }
  function summaries() {
    document.querySelectorAll('[data-route-summary]').forEach(function (mount) {
      var slugs = Object.keys(titles).filter(function (s) { return valid(data[s]) && data[s].done.length; }).sort(function (a,b) { return (Number(data[b].updated)||0)-(Number(data[a].updated)||0); });
      mount.replaceChildren(); mount.hidden = !slugs.length;
      if (!slugs.length) return;
      mount.classList.add('route-saved'); mount.appendChild(element('h2','Continue learning'));
      var list = element('ul');
      slugs.forEach(function (s) {
        var item = element('li'), a = element('a', titles[s] + ' →');
        a.href = (mount.getAttribute('data-route-base') || '') + s + '.html';
        item.appendChild(a); item.appendChild(element('span', ' · ' + new Set(data[s].done).size + ' steps ticked')); list.appendChild(item);
      });
      mount.appendChild(list); mount.appendChild(element('p', 'Progress is stored only in this browser.'));
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
    }); });
    page.querySelector('.route-print').addEventListener('click',function () { var closed=Array.from(page.querySelectorAll('details:not([open])')); closed.forEach(function(d){d.open=true;}); window.print(); closed.forEach(function(d){d.open=false;}); });
    paint();
  }
  summaries();
  addEventListener('pageshow', function (event) { if (event.persisted) location.reload(); });
}());
