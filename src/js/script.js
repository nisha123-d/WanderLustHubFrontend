/* ==========================================================================
   Travel Explorer — Vanilla JS
   Mobile menu, sticky nav, smooth scroll, slider, FAQ, reveal, counters,
   form validation, dark mode, back-to-top, loading screen.
   Safe to run more than once (idempotent init).
   ========================================================================== */
(function () {
  "use strict";

  var cleanups = [];
  function on(target, type, handler, opts) {
    if (!target) return;
    target.addEventListener(type, handler, opts);
    cleanups.push(function () {
      target.removeEventListener(type, handler, opts);
    });
  }

  function initTravelExplorer() {
    /* ---------- Loading screen ---------- */
    var loader = document.getElementById("loader");
    if (loader) {
      window.setTimeout(function () {
        loader.classList.add("is-hidden");
      }, 600);
    }

    /* ---------- Dark mode ---------- */
    var root = document.documentElement;
    var stored = null;
    try {
      stored = window.localStorage.getItem("te-theme");
    } catch (e) {
      /* storage blocked */
    }
    var prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", stored || (prefersDark ? "dark" : "light"));

    var themeBtn = document.querySelector(".theme-toggle");
    on(themeBtn, "click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      themeBtn.setAttribute("aria-pressed", String(next === "dark"));
      try {
        window.localStorage.setItem("te-theme", next);
      } catch (e) {
        /* noop */
      }
    });

    /* ---------- Mobile menu ---------- */
    var toggle = document.querySelector(".nav__toggle");
    var menu = document.getElementById("primary-menu");
    function closeMenu() {
      if (!menu || !toggle) return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    on(toggle, "click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".nav__link"), function (link) {
      on(link, "click", closeMenu);
    });
    on(document, "keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    /* ---------- Smooth scrolling ---------- */
    Array.prototype.forEach.call(
      document.querySelectorAll('a[href^="#"]'),
      function (anchor) {
        on(anchor, "click", function (e) {
          var id = anchor.getAttribute("href");
          if (!id || id === "#") return;
          var target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", id);
        });
      }
    );

    /* ---------- Sticky navbar + back to top + active link ---------- */
    var header = document.querySelector(".header");
    var toTop = document.querySelector(".to-top");
    var sections = Array.prototype.slice.call(document.querySelectorAll("section[id]"));
    function onScroll() {
      var y = window.scrollY;
      if (header) header.classList.toggle("is-stuck", y > 40);
      if (toTop) toTop.classList.toggle("is-visible", y > 600);

      var currentId = "";
      sections.forEach(function (section) {
        if (section.offsetTop - 140 <= y) currentId = section.id;
      });
      Array.prototype.forEach.call(document.querySelectorAll(".nav__link"), function (l) {
        l.classList.toggle("is-active", l.getAttribute("href") === "#" + currentId);
      });
    }
    on(window, "scroll", onScroll, { passive: true });
    onScroll();

    on(toTop, "click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    /* ---------- Testimonials slider ---------- */
    var track = document.querySelector(".slider__track");
    if (track) {
      var slides = track.children.length;
      var index = 0;
      var dots = Array.prototype.slice.call(document.querySelectorAll(".slider__dot"));
      function render() {
        track.style.transform = "translateX(" + -index * 100 + "%)";
        dots.forEach(function (d, i) {
          d.classList.toggle("is-active", i === index);
          d.setAttribute("aria-selected", String(i === index));
        });
      }
      function go(step) {
        index = (index + step + slides) % slides;
        render();
      }
      on(document.querySelector('[data-slider="prev"]'), "click", function () {
        go(-1);
      });
      on(document.querySelector('[data-slider="next"]'), "click", function () {
        go(1);
      });
      dots.forEach(function (dot, i) {
        on(dot, "click", function () {
          index = i;
          render();
        });
      });
      var timer = window.setInterval(function () {
        go(1);
      }, 7000);
      cleanups.push(function () {
        window.clearInterval(timer);
      });
      render();
    }

    /* ---------- FAQ accordion ---------- */
    Array.prototype.forEach.call(
      document.querySelectorAll(".faq__trigger"),
      function (trigger) {
        on(trigger, "click", function () {
          var panel = document.getElementById(trigger.getAttribute("aria-controls"));
          var open = trigger.getAttribute("aria-expanded") === "true";
          Array.prototype.forEach.call(
            document.querySelectorAll(".faq__trigger"),
            function (other) {
              if (other === trigger) return;
              other.setAttribute("aria-expanded", "false");
              var p = document.getElementById(other.getAttribute("aria-controls"));
              if (p) p.classList.remove("is-open");
            }
          );
          trigger.setAttribute("aria-expanded", String(!open));
          if (panel) panel.classList.toggle("is-open", !open);
        });
      }
    );

    /* ---------- Animated counters ---------- */
    function countUp(el) {
      var target = parseFloat(el.getAttribute("data-count") || "0");
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1600;
      var start = performance.now();
      function frame(now) {
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var value = target * eased;
        el.textContent =
          (target % 1 !== 0 ? value.toFixed(1) : Math.round(value).toLocaleString()) +
          suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    /* ---------- Scroll reveal + counter trigger ---------- */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            if (entry.target.hasAttribute("data-count")) countUp(entry.target);
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );
      revealEls.concat(counters).forEach(function (el) {
        io.observe(el);
      });
      cleanups.push(function () {
        io.disconnect();
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
      counters.forEach(countUp);
    }

    /* ---------- Form validation ---------- */
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function setError(input, message) {
      var box = document.querySelector('[data-error-for="' + input.id + '"]');
      if (box) box.textContent = message;
      input.setAttribute("aria-invalid", message ? "true" : "false");
      return !message;
    }
    function validate(input) {
      var value = (input.value || "").trim();
      if (input.hasAttribute("required") && !value)
        return setError(input, "This field is required.");
      if (input.type === "email" && !emailRe.test(value))
        return setError(input, "Enter a valid email address.");
      if (input.tagName === "TEXTAREA" && value.length < 10)
        return setError(input, "Please write at least 10 characters.");
      return setError(input, "");
    }

    Array.prototype.forEach.call(
      document.querySelectorAll("form[data-validate]"),
      function (form) {
        var fields = Array.prototype.slice.call(
          form.querySelectorAll("input, textarea, select")
        );
        fields.forEach(function (field) {
          on(field, "blur", function () {
            validate(field);
          });
          on(field, "input", function () {
            if (field.getAttribute("aria-invalid") === "true") validate(field);
          });
        });
        on(form, "submit", function (e) {
          e.preventDefault();
          var valid = fields.map(validate).every(Boolean);
          var status = form.querySelector(".form-status");
          if (!valid) {
            if (status) status.textContent = "Please fix the highlighted fields.";
            var firstBad = form.querySelector('[aria-invalid="true"]');
            if (firstBad) firstBad.focus();
            return;
          }
          if (status) status.textContent = form.getAttribute("data-success") || "Sent!";
          form.reset();
        });
      }
    );
  }

  function boot() {
    // Tear down a previous init (client-side navigation / hot reload).
    cleanups.splice(0).forEach(function (fn) {
      fn();
    });
    initTravelExplorer();
  }

  window.initTravelExplorer = boot;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
