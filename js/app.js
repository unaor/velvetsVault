(function () {
  "use strict";

  /**
   * Telegram destination for “Submit request”.
   * Use your public @username only (no @), e.g. "velvet_sales".
   * You can also paste "https://t.me/velvet_sales" — it will be normalized.
   * The user must have Telegram installed (app or t.me in browser).
   */
  var TELEGRAM_USERNAME = "cafeine9";

  function telegramUsernameFromConfig(raw) {
    if (!raw || typeof raw !== "string") return "";
    var s = raw.trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) {
      try {
        var path = new URL(s).pathname.replace(/^\//, "").split("/")[0];
        if (path) s = path;
      } catch (_) {}
    }
    return s.replace(/^@+/, "");
  }

  var loadScreen = document.getElementById("load-screen");
  var splashVideo = document.getElementById("splash-video");
  var grid = document.getElementById("platform-grid");
  var modal = document.getElementById("buy-modal");
  var modalPlatform = document.getElementById("buy-modal-platform");
  var buyForm = document.getElementById("buy-form");
  var creditAmount = document.getElementById("credit-amount");
  var creditEmail = document.getElementById("credit-email");
  var creditNote = document.getElementById("credit-note");

  var selectedPlatform = null;
  var minSplashMs = 3000;
  var splashStart = Date.now();

  function hideLoadScreen() {
    if (!loadScreen || loadScreen.classList.contains("is-done")) return;
    var elapsed = Date.now() - splashStart;
    var wait = Math.max(0, minSplashMs - elapsed);
    window.setTimeout(function () {
      loadScreen.classList.add("is-done");
      document.body.classList.remove("is-loading");
      loadScreen.setAttribute("aria-hidden", "true");
      try {
        if (splashVideo) {
          splashVideo.pause();
          splashVideo.removeAttribute("src");
          splashVideo.load();
        }
      } catch (_) {}
    }, wait);
  }

  function initSplash() {
    document.body.classList.add("is-loading");
    var done = false;
    function tryHide() {
      if (done) return;
      done = true;
      hideLoadScreen();
    }

    window.addEventListener("load", function () {
      window.setTimeout(tryHide, 400);
    });

    if (splashVideo) {
      splashVideo.addEventListener("error", tryHide);
      splashVideo.addEventListener("stalled", function () {
        window.setTimeout(tryHide, 2500);
      });
    }

    window.setTimeout(tryHide, 8000);
  }

  function logoPath(logo) {
    return "assets/" + logo;
  }

  var ICON_PLAY =
    '<svg class="platform-card__btn-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="currentColor" d="M10.25 8.65L16.2 12l-5.95 3.35V8.65z"/></svg>';
  var ICON_HEADSET =
    '<svg class="platform-card__btn-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" d="M3 18v-6a9 9 0 0 1 18 0v6"/><path stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>';
  var ICON_CART =
    '<svg class="platform-card__btn-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="21" r="1.25" fill="currentColor"/><circle cx="18" cy="21" r="1.25" fill="currentColor"/><path stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l1.2 9.6A2 2 0 0 0 8.2 16h8.6a2 2 0 0 0 1.97-1.64L21 7H7"/></svg>';

  function renderPlatforms(list) {
    if (!grid || !Array.isArray(list)) return;
    grid.innerHTML = "";
    list.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "platform-card";
      card.setAttribute("data-name", p.name);

      var media = document.createElement("div");
      media.className = "platform-card__media";

      var img = document.createElement("img");
      img.className = "platform-card__hero-img";
      img.alt = "";
      img.loading = "lazy";
      img.src = logoPath(p.logo);
      img.addEventListener("error", function onErr() {
        img.removeEventListener("error", onErr);
        img.replaceWith(heroFallback(p.name));
      });

      media.appendChild(img);

      var info = document.createElement("div");
      info.className = "platform-card__info";

      var title = document.createElement("h3");
      title.className = "platform-card__name";
      title.textContent = p.name;

      info.appendChild(title);

      var actions = document.createElement("div");
      actions.className = "platform-card__actions";

      var play = document.createElement("a");
      play.className = "platform-card__btn platform-card__btn--secondary";
      play.href = p.playerUrl;
      play.target = "_blank";
      play.rel = "noopener noreferrer";
      play.innerHTML = ICON_PLAY + '<span class="platform-card__btn-label">Play</span>';

      var agent = document.createElement("a");
      agent.className = "platform-card__btn platform-card__btn--secondary";
      agent.href = p.agentUrl;
      agent.target = "_blank";
      agent.rel = "noopener noreferrer";
      agent.innerHTML = ICON_HEADSET + '<span class="platform-card__btn-label">Agent</span>';

      var buy = document.createElement("button");
      buy.type = "button";
      buy.className = "platform-card__btn platform-card__btn--primary";
      buy.innerHTML = ICON_CART + '<span class="platform-card__btn-label">Buy</span>';
      buy.addEventListener("click", function () {
        openBuyModal(p);
      });

      actions.appendChild(play);
      actions.appendChild(agent);
      actions.appendChild(buy);

      card.appendChild(media);
      card.appendChild(info);
      card.appendChild(actions);
      grid.appendChild(card);
    });
  }

  function heroFallback(name) {
    var el = document.createElement("div");
    el.className = "platform-card__hero-fallback";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", name);
    el.textContent = name;
    return el;
  }

  function openBuyModal(platform) {
    selectedPlatform = platform;
    if (modalPlatform) modalPlatform.textContent = platform.name;
    if (creditAmount) {
      creditAmount.value = "";
      creditAmount.focus();
    }
    if (creditEmail) creditEmail.value = "";
    if (creditNote) creditNote.value = "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeBuyModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    selectedPlatform = null;
  }

  function wireModal() {
    modal.querySelectorAll("[data-close-modal]").forEach(function (el) {
      el.addEventListener("click", closeBuyModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeBuyModal();
    });
  }

  buyForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!selectedPlatform) return;
    var amount = creditAmount.value.trim();
    var email = (creditEmail && creditEmail.value) ? creditEmail.value.trim() : "";
    var note = (creditNote.value || "").trim();
    var handle = telegramUsernameFromConfig(TELEGRAM_USERNAME);
    if (!handle) {
      window.alert(
        "Telegram is not configured yet. Set TELEGRAM_USERNAME at the top of js/app.js to your @username (without @)."
      );
      return;
    }
    var message =
      "You have a message from Velvets Vault\n\n" +
      email +
      " is interested in buying " +
      amount +
      " for platform " +
      selectedPlatform.name +
      (note ? "\n\n" + note : "");
    var url = "https://t.me/" + encodeURIComponent(handle) + "?text=" + encodeURIComponent(message);
    /* Do not use window.open(..., "noopener") — it often returns null, which made the old code fall back to location.href and hijack this tab. */
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    closeBuyModal();
  });

  initSplash();
  wireModal();

  fetch("platsforms.json")
    .then(function (r) {
      if (!r.ok) throw new Error("Bad response");
      return r.json();
    })
    .then(renderPlatforms)
    .catch(function () {
      if (grid) {
        grid.innerHTML =
          '<p style="color:var(--text-muted);font-size:0.9rem;">Could not load platforms. Check that platsforms.json is available.</p>';
      }
    });
})();
