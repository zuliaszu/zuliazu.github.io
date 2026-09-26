/* No chart library, tracking or storage. Both markets remain readable without JavaScript. */
(function () {
  'use strict';
  document.querySelectorAll('[data-salary-chart]').forEach(function (chart) {
    var buttons = Array.from(chart.querySelectorAll('[data-pay-select]'));
    function show(market) {
      chart.querySelectorAll('[data-pay-market]').forEach(function (panel) { panel.hidden = panel.dataset.payMarket !== market; });
      buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.paySelect === market)); });
      chart.querySelector('.pay-status').textContent = market === 'uk' ? 'Showing United Kingdom benchmarks in pounds.' : 'Showing United States benchmarks in dollars.';
    }
    buttons.forEach(function (button) { button.addEventListener('click', function () { show(button.dataset.paySelect); }); });
    chart.querySelector('.pay-switch').hidden = false;
    show('uk');
  });
}());
