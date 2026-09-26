(function () {
  var top = document.querySelector(".top"), btn = document.querySelector(".menu-btn");
  function onScroll() { top.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll(); addEventListener("scroll", onScroll, { passive: true });
  if (btn) btn.addEventListener("click", function () { var o = top.classList.toggle("open"); btn.setAttribute("aria-expanded", o); btn.textContent = o ? "Close" : "Menu"; });
  document.querySelectorAll("#nav a").forEach(function (a) { a.addEventListener("click", function () { top.classList.remove("open"); if (btn) { btn.setAttribute("aria-expanded", "false"); btn.textContent = "Menu"; } }); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".rv:not(.in)").forEach(function (el) { io.observe(el); });
  } else { document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); }); }
})();
