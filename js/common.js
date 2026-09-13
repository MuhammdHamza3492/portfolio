(function () {
  const data = window.PORTFOLIO;
  if (!data) return;

  const VOICE_SLUG = { engineer: "SE", pm: "PM" };
  const SLUG_VOICE = { SE: "engineer", PM: "pm", se: "engineer", pm: "pm" };

  let voice = voiceFromLocation();
  let wordTimer;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function html(strings, ...values) {
    return strings.reduce((out, str, i) => out + str + (values[i] ?? ""), "");
  }

  function pathSegments() {
    return location.pathname.split("/").filter(Boolean);
  }

  function getBasePath() {
    const parts = pathSegments();
    if (parts.length && SLUG_VOICE[parts[parts.length - 1]]) parts.pop();
    if (parts.length && parts[parts.length - 1].toLowerCase() === "index.html") parts.pop();
    return parts.length ? `/${parts.join("/")}/` : "/";
  }

  function voiceFromLocation() {
    if (window.__INITIAL_VOICE === "engineer" || window.__INITIAL_VOICE === "pm") {
      return window.__INITIAL_VOICE;
    }
    const parts = pathSegments();
    const last = parts[parts.length - 1];
    if (last && SLUG_VOICE[last]) return SLUG_VOICE[last];
    return "pm";
  }

  function voiceUrl(next) {
    return `${getBasePath()}${VOICE_SLUG[next]}`;
  }

  function syncUrl(next, replace) {
    const url = voiceUrl(next) + location.search + location.hash;
    const state = { voice: next };
    if (replace) history.replaceState(state, "", url);
    else if (location.pathname.replace(/\/+$/, "") !== voiceUrl(next).replace(/\/+$/, "")) {
      history.pushState(state, "", url);
    } else {
      history.replaceState(state, "", url);
    }
  }

  function setVoice(next, opts = {}) {
    if (next !== "engineer" && next !== "pm") return;
    voice = next;
    $$("[data-voice-btn]").forEach((btn) => {
      btn.classList.toggle("on", btn.dataset.voiceBtn === voice);
    });
    if (opts.updateUrl !== false) syncUrl(voice, !!opts.replace);
    renderVoice();
  }

  function renderVoice() {
    const intro = $("[data-bind=intro]");
    if (intro) intro.innerHTML = data.intro[voice];

    const stats = $("[data-bind=stats]");
    if (stats) {
      stats.innerHTML = data.stats[voice]
        .map(
          (s) => html`
            <div class="stat-row">
              <span class="stat-value">${s.value}</span>
              <span class="stat-label">${s.label}</span>
            </div>`
        )
        .join("");
    }

    const about = $("[data-bind=about]");
    if (about) {
      about.innerHTML = data.about[voice].map((p) => `<p>${p}</p>`).join("");
    }

    const cta = $("[data-bind=cta]");
    if (cta) cta.innerHTML = data.contact.cta[voice];

    $$("[data-role]").forEach((el) => {
      const i = Number(el.dataset.role);
      const item = data.featured[i];
      if (item) el.innerHTML = item.role[voice];
    });

    $$("[data-lede]").forEach((el) => {
      const i = Number(el.dataset.lede);
      const item = data.featured[i];
      if (!item) return;
      if (item.bullets?.[voice]?.length) {
        el.innerHTML = "";
        el.hidden = true;
        return;
      }
      el.hidden = false;
      const extra = item.more ? ` <span class="more-text">${item.more[voice]}</span>` : "";
      el.innerHTML = item.lede[voice] + extra;
    });

    $$("[data-points]").forEach((el) => {
      const i = Number(el.dataset.points);
      const item = data.featured[i];
      const pts = item?.bullets?.[voice];
      if (!pts?.length) {
        el.innerHTML = "";
        el.hidden = true;
        return;
      }
      el.hidden = false;
      el.innerHTML = pts
        .map(
          (pt, idx) =>
            `<li class="${idx === 0 ? "" : "more-text"}">${pt}</li>`
        )
        .join("");
    });

    $$("[data-tech]").forEach((el) => {
      const i = Number(el.dataset.tech);
      const item = data.featured[i];
      if (!item) return;
      const tags =
        voice === "pm" && item.techPm?.length ? item.techPm : item.tech || [];
      el.innerHTML = tags.map((t) => `<span class="tech">${t}</span>`).join("");
    });

    $$("[data-sub]").forEach((el) => {
      const i = Number(el.dataset.sub);
      const item = data.featured[i];
      if (item?.subproject) el.innerHTML = item.subproject.body[voice];
    });

    $$("[data-bind=title]").forEach((el) => {
      el.textContent = voice === "pm" ? data.titleAlt : data.title;
    });

    const verb = $("[data-bind=verb]");
    if (verb) verb.textContent = voice === "pm" ? "ship" : "build";

    const sub = $("[data-bind=sub]");
    if (sub) {
      const text = typeof data.sub === "string" ? data.sub : data.sub?.[voice];
      if (typeof text === "string") sub.innerHTML = text;
    }

    renderSkills();
    renderEarlier();
    renderWords();
  }

  function renderStatic() {
    $$("[data-bind=name]").forEach((el) => {
      el.textContent = data.name;
    });
    $$("[data-bind=title]").forEach((el) => {
      el.textContent = data.title;
    });
    $$("[data-bind=initials]").forEach((el) => {
      el.textContent = data.initials;
    });
    $$("[data-bind=status]").forEach((el) => {
      el.textContent = data.status;
    });
    $$("[data-bind=year]").forEach((el) => {
      el.textContent = data.year;
    });
    $$("[data-bind=email]").forEach((el) => {
      if (el.tagName === "A") el.href = "mailto:" + data.contact.email;
      el.innerHTML = data.contact.email + ' <span class="ar">→</span>';
    });
    $$("[data-email]").forEach((el) => {
      el.href = "mailto:" + data.contact.email;
    });
    $$("[data-bind=linkedin]").forEach((el) => {
      if (el.tagName === "A") el.href = data.contact.linkedin;
    });
    $$("[data-phone]").forEach((el) => {
      if (!data.contact.phone) return;
      el.href = "tel:" + data.contact.phone.replace(/\s/g, "");
      el.innerHTML = data.contact.phone + ' <span class="ar">→</span>';
    });

    const sub = $("[data-bind=sub]");
    if (sub) {
      const text = typeof data.sub === "string" ? data.sub : data.sub?.[voice];
      if (typeof text === "string") sub.innerHTML = text;
    }

    renderSkills();
    renderEarlier();

    const work = $("[data-bind=work]");
    if (work) {
      work.innerHTML = data.featured
        .map((item, i) => {
          const metrics = (item.metrics || [])
            .map(
              (m) => html`
                <div class="metric">
                  <div class="metric-n">${m.value}</div>
                  <div class="metric-l">${m.label}</div>
                </div>`
            )
            .join("");
          const bulletCount = Math.max(
            item.bullets?.engineer?.length || 0,
            item.bullets?.pm?.length || 0
          );
          const moreBtn =
            item.more || bulletCount > 1
              ? `<button class="more-btn" type="button" data-more="${i}">Read more →</button>`
              : "";
          const metricsBlock = metrics
            ? `<div class="metrics">${metrics}</div>`
            : "";
          const imgSlot =
            item.images && item.images.length
              ? `<div class="img-stack-slot" data-card="${item.id || i}"></div>`
              : "";
          const mediaRow =
            metrics || imgSlot
              ? `<div class="metrics-row">${metricsBlock}${imgSlot}</div>`
              : "";
          const sub = item.subproject
            ? html`
                <div class="subproj">
                  <div class="sp-head">
                    <span class="sp-kicker">${item.subproject.kicker}</span>
                    <h4>${item.subproject.title}</h4>
                  </div>
                  <p data-sub="${i}"></p>
                </div>`
            : "";
          const index =
            document.body.dataset.theme === "editorial"
              ? `<span class="case-index">${String(i + 1).padStart(2, "0")}</span>`
              : "";
          return html`
            <article class="case reveal">
              ${index}
              <div class="case-top">
                <h3>${item.title}</h3>
                <span class="tag">${item.kicker}</span>
              </div>
              <p class="lede" data-lede="${i}"></p>
              <ul class="case-points" data-points="${i}" hidden></ul>
              ${moreBtn}
              ${mediaRow}
              <p class="role-line">
                <span class="role-k">role</span>
                <span data-role="${i}"></span>
              </p>
              ${sub}
              <div class="techrow" data-tech="${i}"></div>
            </article>`;
        })
        .join("");
      buildImageStacks();
    }
  }

  function renderEarlier() {
    const earlier = $("[data-bind=earlier]");
    if (!earlier) return;
    const list = Array.isArray(data.earlier)
      ? data.earlier
      : data.earlier?.[voice] || data.earlier?.engineer || [];
    earlier.innerHTML = list
      .map(
        (item) => html`
          <article class="ew reveal">
            <div class="ew-top">
              <h4><span class="ew-mark">›</span> ${item.title}</h4>
              <span class="etag">${item.kicker}</span>
            </div>
            <p>${item.blurb}</p>
          </article>`
      )
      .join("");
    // Re-bind reveal so voice switches don't leave cards at opacity 0
    observeReveal($$(".reveal", earlier));
  }

  function renderSkills() {
    const skills = $("[data-bind=skills]");
    if (!skills) return;
    const list = voice === "pm" && data.skillsPm ? data.skillsPm : data.skills;
    const groups =
      voice === "pm" && data.skillGroupsPm ? data.skillGroupsPm : data.skillGroups || [];
    skills.innerHTML =
      list.map((s) => `<span class="chip">${s}</span>`).join("") +
      groups
        .map(
          (g) =>
            `<div class="skill-group"><span class="skill-group-label">${g.label}</span>${g.items
              .map((item) => `<span class="chip">${item}</span>`)
              .join("")}</div>`
        )
        .join("");
  }

  function renderWords() {
    const wrap = $("[data-bind=words]");
    if (!wrap) return;
    const list =
      voice === "pm" && data.headlineWordsPm ? data.headlineWordsPm : data.headlineWords;
    wrap.innerHTML = `<span class="wr-w">${list[0]}</span>`;
    rotateWords(list);
  }

  function rotateWords(list) {
    const wrap = $("[data-bind=words]");
    if (!wrap) return;
    clearInterval(wordTimer);
    if (!list || list.length < 2) return;
    let i = 0;
    wordTimer = setInterval(() => {
      const current = $(".wr-w", wrap);
      if (!current) return;
      i = (i + 1) % list.length;
      current.classList.add("is-exit");
      window.setTimeout(() => {
        current.textContent = list[i];
        current.classList.remove("is-exit");
        current.classList.add("is-enter");
        // force reflow so enter transition runs
        void current.offsetWidth;
        current.classList.remove("is-enter");
      }, 280);
    }, 2600);
  }

  function setupMore() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-more]");
      if (!btn) return;
      const card = btn.closest(".case");
      card.classList.toggle("is-open");
      btn.textContent = card.classList.contains("is-open") ? "Show less ←" : "Read more →";
    });
  }

  function setupVoice() {
    // SE/PM toggle is hidden — voice is locked to URL (/SE or /PM) or page default.
    // No click handlers so visitors cannot switch profiles.
  }

  let revealObserver;

  function observeReveal(nodes) {
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("in"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
    }
    nodes.forEach((el) => {
      // If already on-screen (e.g. SE/PM toggle), show immediately
      const rect = el.getBoundingClientRect();
      const visible = rect.top < window.innerHeight && rect.bottom > 0;
      if (visible) el.classList.add("in");
      else revealObserver.observe(el);
    });
  }

  function setupReveal() {
    observeReveal($$(".reveal"));
  }

  function setupIntro() {
    const overlay = $("[data-intro]");
    const openBtns = $$("[data-open-intro]");
    const closeBtn = $("[data-close-intro]");
    if (!overlay || !openBtns.length) return;
    const close = () => overlay.classList.remove("open");
    openBtns.forEach((btn) => btn.addEventListener("click", () => overlay.classList.add("open")));
    closeBtn?.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function setupSpotlight() {
    const spot = $("[data-spotlight]");
    if (!spot) return;
    window.addEventListener(
      "pointermove",
      (e) => {
        spot.style.setProperty("--mx", e.clientX + "px");
        spot.style.setProperty("--my", e.clientY + "px");
      },
      { passive: true }
    );
  }

  function setupHeader() {
    const header = $("[data-header]");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function setupProgress() {
    const bar = $("[data-progress]");
    if (!bar) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : "0";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function setupYear() {
    $$("[data-bind=year]").forEach((el) => {
      el.textContent = data.year;
    });
  }

  const cardImages = Object.fromEntries(
    (data.featured || [])
      .filter((item) => item.id && item.images?.length)
      .map((item) => [item.id, item.images])
  );

  let lbCard = null;
  let lbCur = 0;
  let lbZoom = 1;

  function privacyMaskHtml(masks) {
    if (!masks?.length) return "";
    return masks
      .map(
        (m) =>
          `<span class="shot-blur" style="left:${m.left};top:${m.top};width:${m.width};height:${m.height}"></span>`
      )
      .join("");
  }

  function buildImageStacks() {
    $$(".img-stack-slot").forEach((slot) => {
      const cid = slot.getAttribute("data-card");
      const imgs = cardImages[cid];
      if (!imgs?.length) {
        slot.remove();
        return;
      }
      const stack = document.createElement("div");
      stack.className = "img-stack";
      stack.setAttribute("data-card", cid);
      stack.setAttribute("role", "button");
      stack.setAttribute("tabindex", "0");
      stack.setAttribute("aria-label", `View ${imgs.length} screenshots`);
      const show = imgs.slice(0, 3).reverse();
      show.forEach((img) => {
        const si = document.createElement("div");
        si.className = "si";
        const masks = privacyMaskHtml(img.privacyMasks);
        si.innerHTML = masks
          ? `<div class="shot-wrap"><img src="${img.src}" alt="${img.label || ""}" loading="lazy" /><div class="shot-masks">${masks}</div></div>`
          : `<img src="${img.src}" alt="${img.label || ""}" loading="lazy" />`;
        stack.appendChild(si);
      });
      const ct = document.createElement("div");
      ct.className = "img-stack-ct";
      ct.textContent = `${imgs.length} photo${imgs.length === 1 ? "" : "s"} ↗`;
      stack.appendChild(ct);
      const open = () => lbOpen(cid, 0);
      stack.addEventListener("click", open);
      stack.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
      slot.replaceWith(stack);
    });
  }

  function lbEls() {
    return {
      overlay: $("#lb-overlay"),
      shot: $("#lb-shot"),
      img: $("#lb-img"),
      masks: $("#lb-masks"),
      title: $("#lb-title"),
      count: $("#lb-count"),
      dots: $("#lb-dots"),
      level: $("#lb-zoom-level"),
    };
  }

  function lbResetZoom() {
    lbZoom = 1;
    const { shot, level } = lbEls();
    if (shot) {
      shot.style.transform = "scale(1)";
      shot.style.cursor = "zoom-in";
    }
    if (level) level.textContent = "100%";
  }

  function lbApplyZoom() {
    const { shot, level } = lbEls();
    if (!shot) return;
    shot.style.transform = `scale(${lbZoom})`;
    shot.style.cursor = lbZoom > 1 ? "zoom-out" : "zoom-in";
    if (level) level.textContent = `${Math.round(lbZoom * 100)}%`;
  }

  function lbRender() {
    const imgs = cardImages[lbCard] || [];
    if (!imgs.length) return;
    const d = imgs[lbCur];
    const { img, masks, title, count, dots } = lbEls();
    if (img) {
      img.src = d.src;
      img.alt = d.label || "";
    }
    if (masks) masks.innerHTML = privacyMaskHtml(d.privacyMasks);
    if (title) title.textContent = d.label || "Screenshot";
    if (count) count.textContent = `${lbCur + 1} / ${imgs.length}`;
    if (dots) {
      dots.innerHTML = imgs
        .map(
          (_, i) =>
            `<button type="button" class="lb-dot${i === lbCur ? " on" : ""}" data-lb-dot="${i}" aria-label="Image ${i + 1}"></button>`
        )
        .join("");
    }
    lbResetZoom();
  }

  function lbOpen(cid, idx) {
    if (!cardImages[cid]?.length) return;
    lbCard = cid;
    lbCur = idx || 0;
    const { overlay } = lbEls();
    if (!overlay) return;
    overlay.hidden = false;
    overlay.classList.add("open");
    lbRender();
  }

  function lbClose() {
    const { overlay } = lbEls();
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.hidden = true;
    lbResetZoom();
  }

  function lbNext() {
    const imgs = cardImages[lbCard] || [];
    if (!imgs.length) return;
    lbCur = (lbCur + 1) % imgs.length;
    lbRender();
  }

  function lbPrev() {
    const imgs = cardImages[lbCard] || [];
    if (!imgs.length) return;
    lbCur = (lbCur - 1 + imgs.length) % imgs.length;
    lbRender();
  }

  function setupLightbox() {
    const { overlay } = lbEls();
    if (!overlay) return;
    $("#lb-close")?.addEventListener("click", lbClose);
    $("#lb-next")?.addEventListener("click", lbNext);
    $("#lb-prev")?.addEventListener("click", lbPrev);
    $("#lb-zoom-in")?.addEventListener("click", () => {
      lbZoom = Math.min(3, lbZoom + 0.25);
      lbApplyZoom();
    });
    $("#lb-zoom-out")?.addEventListener("click", () => {
      lbZoom = Math.max(1, lbZoom - 0.25);
      lbApplyZoom();
    });
    $("#lb-zoom-level")?.addEventListener("click", lbResetZoom);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) lbClose();
    });
    overlay.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-lb-dot]");
      if (!dot) return;
      lbCur = Number(dot.dataset.lbDot);
      lbRender();
    });
    $("#lb-img-area")?.addEventListener("click", (e) => {
      if (e.target.closest(".lb-zoom-bar")) return;
      lbZoom = lbZoom > 1 ? 1 : 2;
      lbApplyZoom();
    });
    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") lbClose();
      if (e.key === "ArrowRight") lbNext();
      if (e.key === "ArrowLeft") lbPrev();
      if (e.key === "+" || e.key === "=") {
        lbZoom = Math.min(3, lbZoom + 0.25);
        lbApplyZoom();
      }
      if (e.key === "-") {
        lbZoom = Math.max(1, lbZoom - 0.25);
        lbApplyZoom();
      }
      if (e.key === "0") lbResetZoom();
    });
  }

  renderStatic();
  setVoice(voice, { replace: true });
  setupVoice();
  setupMore();
  setupLightbox();
  setupIntro();
  setupHeader();
  setupProgress();
  setupSpotlight();
  setupYear();
  requestAnimationFrame(setupReveal);
})();
