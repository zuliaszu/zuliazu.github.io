(function () {
  var sec = document.getElementById("questions");
  if (!sec) return;
  var boxes = [].slice.call(sec.querySelectorAll('.iq-pts input[type=checkbox]'));
  if (!boxes.length) return;

  var KEY = "aiscp_selfcheck", PAGE = location.pathname;

  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(state) {
    var all = readAll();
    all[PAGE] = state;
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {}
  }
  var state = readAll()[PAGE] || {};

  var sum = document.createElement("div");
  sum.className = "sc-sum";
  var line = document.createElement("p");
  var reset = document.createElement("a");
  reset.href = "#questions";
  reset.textContent = "Reset";
  sum.appendChild(line);
  sum.appendChild(reset);
  var first = sec.querySelector(".iq");
  sec.insertBefore(sum, first);

  function render() {
    var covered = 0, total = 0;
    [].forEach.call(sec.querySelectorAll(".iq-score"), function (el) {
      var q = el.dataset.q, t = parseInt(el.dataset.total, 10) || 0;
      var n = sec.querySelectorAll('.iq-pts input[data-q="' + q + '"]:checked').length;
      el.textContent = n + " of " + t + " covered";
      covered += n;
      total += t;
    });
    var n_q = sec.querySelectorAll(".iq").length;
    var threshold = Math.ceil(total * 0.8);
    var txt = "You have covered " + covered + " of " + total + " points across " + n_q + " question" + (n_q === 1 ? "" : "s") + ". ";
    line.textContent = txt + (covered >= threshold
      ? "That is past " + threshold + ": do the proof exercise."
      : "Ready for the proof exercise at " + threshold + ".");
  }

  boxes.forEach(function (box) {
    var q = box.dataset.q, i = parseInt(box.dataset.i, 10);
    box.checked = (state[q] || []).indexOf(i) !== -1;
    box.parentNode.classList.toggle("on", box.checked);
    box.addEventListener("change", function () {
      var list = state[q] || [];
      var at = list.indexOf(i);
      if (box.checked && at === -1) list.push(i);
      if (!box.checked && at !== -1) list.splice(at, 1);
      state[q] = list;
      box.parentNode.classList.toggle("on", box.checked);
      save(state);
      render();
    });
  });

  reset.addEventListener("click", function (e) {
    e.preventDefault();
    state = {};
    save(state);
    boxes.forEach(function (box) {
      box.checked = false;
      box.parentNode.classList.remove("on");
    });
    render();
  });

  render();
})();
