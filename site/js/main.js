// Jacob Lubert Latin Tutoring — the only JavaScript on the site.
(function () {
  // Mobile menu toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  // Footer year
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Build FAQ structured data from the FAQ section, so editing the
  // FAQ text on the page also updates what Google sees.
  var items = document.querySelectorAll(".faq details");
  if (items.length) {
    var data = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: Array.prototype.map.call(items, function (d) {
        return {
          "@type": "Question",
          name: d.querySelector("summary").textContent.trim(),
          acceptedAnswer: { "@type": "Answer", text: d.querySelector(".answer").textContent.trim() }
        };
      })
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }
})();
