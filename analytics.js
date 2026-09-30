/* Optional, opt-in usage analytics (Google Analytics 4) for zulia.uk.
   Nothing loads until the visitor accepts. window.ZS_ANALYTICS = {id:"G-..."} is emitted by build.py only when
   content/site.json analytics.enabled is true and a measurement id is set; without it this file does nothing.
   Sent when accepted: page path (hash and query stripped, so quiz result links never leave the browser), coarse
   country/region from GA, and count-only events (route slug and step id, quiz start/finish, course link clicks).
   Never sent: quiz answers, notes, progress contents. Advertising features are off. Do Not Track or Global Privacy
   Control means no banner and nothing loads; the footer control still lets the visitor switch analytics on or off. */
(function () {
  'use strict';
  var cfg = window.ZS_ANALYTICS || {}, ID = String(cfg.id || '');
  if (!/^G-[A-Z0-9]{4,}$/.test(ID)) return;
  var KEY = 'zs_analytics_consent', state = null, loaded = false;
  try { state = localStorage.getItem(KEY); } catch (_) {}
  if (state !== 'granted' && state !== 'denied') state = null;
  var signal = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  function save(v) { state = v; try { localStorage.setItem(KEY, v); } catch (_) {} }
  function cleanUrl() { return location.origin + location.pathname; }
  function gtag() { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }
  function load() {
    if (loaded) { window['ga-disable-' + ID] = false; return; }
    loaded = true; window['ga-disable-' + ID] = false;
    gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    gtag('js', new Date());
    gtag('config', ID, {anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: cleanUrl(), cookie_flags: 'SameSite=Lax;Secure'});
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID); document.head.appendChild(s);
  }
  function unload() {
    window['ga-disable-' + ID] = true;
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) { var n = c.split('=')[0].trim(); if (/^_ga/.test(n)) ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) { document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d; }); });
  }
  function event(name, params) { if (state === 'granted' && loaded) gtag('event', name, params || {}); }
  function el(tag, text, cls) { var n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
  var banner = null;
  function closeBanner() { if (banner) { banner.remove(); banner = null; } paintFooter(); }
  function openBanner() {
    if (banner) return;
    banner = el('div', '', 'zs-consent'); banner.setAttribute('role', 'dialog'); banner.setAttribute('aria-labelledby', 'zs-consent-h'); banner.setAttribute('aria-describedby', 'zs-consent-p');
    var h = el('p', 'Help me see how this site is used?', 'zs-consent-h'); h.id = 'zs-consent-h';
    var p = el('p', 'Optional Google Analytics: pages visited, country, and which lessons or quizzes people finish. Never your quiz answers, notes or progress. You can change this any time from the footer.'); p.id = 'zs-consent-p';
    var row = el('div', '', 'zs-consent-actions'), yes = el('button', 'Allow analytics', 'btn'), no = el('button', 'No thanks', 'btn ghost'), later = el('button', 'Later', 'zs-consent-later');
    yes.type = no.type = later.type = 'button'; later.setAttribute('aria-label', 'Decide later; nothing is collected until you choose');
    yes.addEventListener('click', function () { save('granted'); load(); closeBanner(); });
    no.addEventListener('click', function () { save('denied'); unload(); closeBanner(); });
    later.addEventListener('click', closeBanner); /* no choice stored: nothing loads, the card returns on the next page */
    banner.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBanner(); });
    row.appendChild(yes); row.appendChild(no); row.appendChild(later); banner.appendChild(h); banner.appendChild(p); banner.appendChild(row);
    document.body.appendChild(banner); yes.focus({preventScroll: true});
  }
  var footLine = null;
  function paintFooter() {
    var foot = document.querySelector('footer'); if (!foot) return;
    if (!footLine) { footLine = el('p', '', 'zs-consent-line'); foot.appendChild(footLine); }
    footLine.replaceChildren();
    footLine.appendChild(el('span', 'Usage analytics: ' + (state === 'granted' ? 'on' : 'off') + '. '));
    var b = el('button', state === 'granted' ? 'Turn off' : 'Turn on', 'zs-consent-toggle'); b.type = 'button';
    b.addEventListener('click', function () { if (state === 'granted') { save('denied'); unload(); paintFooter(); } else { save('granted'); load(); paintFooter(); } });
    footLine.appendChild(b);
  }
  document.addEventListener('aiscp:progress', function (e) {
    var d = e.detail || {}; if (!/^[a-z][a-z0-9-]*$/.test(String(d.route)) || !/^[a-z][a-z0-9-]*$/.test(String(d.step))) return;
    event('route_step', {route: d.route, step: d.step, checked: d.checked ? 'yes' : 'no', steps_done: Number(d.done) || 0, steps_total: Number(d.total) || 0});
    if (d.checked && d.done === d.total) event('route_complete', {route: d.route});
  });
  document.addEventListener('aiscp:quiz_start', function () { event('quiz_start'); });
  document.addEventListener('aiscp:quiz_complete', function (e) { var r = e.detail && e.detail.result; event('quiz_complete', {result: /^[a-z][a-z0-9-]*$/.test(String(r)) ? r : 'unknown'}); });
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="http"]') : null; if (!a) return;
    var page = document.querySelector('[data-route]'), where = a.closest('#training, .route-reading, .res, .training') ? 'course' : 'outbound';
    event(where === 'course' ? 'course_link_click' : 'outbound_click', {link_url: a.href.split('#')[0], route: page ? page.getAttribute('data-route') : ''});
  }, true);
  if (state === 'granted') load();
  paintFooter();
  if (state === null && !signal) openBanner();
}());
