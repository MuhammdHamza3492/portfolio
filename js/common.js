(function () {
  const data = window.PORTFOLIO;
  if (!data) return;

  let voice = "pm";
  let wordTimer;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function html(strings, ...values) {
    return strings.reduce((out, str, i) => out + str + (values[i] ?? ""), "");
  }

  function setVoice(next) {
    voice = next;
    $$("[data-voice-btn]").forEach((btn) => {
      btn.classList.toggle("on", btn.dataset.voiceBtn === voice);
    });
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
      const extra = item.more ? ` <span class="more-text">${item.more[voice]}</span>` : "";
      el.innerHTML = item.lede[voice] + extra;
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
          const tech = (item.tech || [])
            .map((t) => `<span class="tech">${t}</span>`)
            .join("");
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
          const moreBtn = item.more
            ? `<button class="more-btn" type="button" data-more="${i}">Read more →</button>`
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
              ${moreBtn}
              <div class="metrics">${metrics}</div>
              <p class="role-line">
                <span class="role-k">role</span>
                <span data-role="${i}"></span>
              </p>
              ${sub}
              <div class="techrow">${tech}</div>
            </article>`;
        })
        .join("");
    }

    const earlier = $("[data-bind=earlier]");
    if (earlier) {
      earlier.innerHTML = data.earlier
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
    }

    renderWords();
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
    $$("[data-voice-btn]").forEach((btn) => {
      btn.addEventListener("click", () => setVoice(btn.dataset.voiceBtn));
    });
  }

  function setupReveal() {
    const nodes = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach((el) => io.observe(el));
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

  renderStatic();
  renderVoice();
  setupVoice();
  setupMore();
  setupIntro();
  setupHeader();
  setupProgress();
  setupSpotlight();
  setupYear();
  requestAnimationFrame(setupReveal);
})();
