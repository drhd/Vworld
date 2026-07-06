/* =========================================================================
   MAIN — renders content.js into the layout, draws the throughline,
   and runs the strata / reveal observers. No dependencies.
   -------------------------------------------------------------------------
   Sections:
     1. Render      — build the four acts from SITE[lang]
     2. Throughline — measure gate anchors, build the SVG path,
                      drive stroke-dashoffset from scroll
     3. Observers   — stratum crossfade + content reveals
     4. Language    — fa/rtl <-> en/ltr switching
   ========================================================================= */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const app = document.getElementById("app");
  const line = document.getElementById("throughline");

  let lang = SITE.defaultLang;
  try {
    const saved = localStorage.getItem("lang");
    if (saved && SITE[saved]) lang = saved;
  } catch (e) { /* private mode — keep default */ }

  /* ---- 1. Render --------------------------------------------------------- */

  function render() {
    const t = SITE[lang];
    const acts = t.acts;
    const g = SITE.gates;

    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')
      .setAttribute("content", t.meta.description);

    document.getElementById("wordmark").textContent = t.ui.wordmark;
    document.getElementById("skip-link").textContent = t.ui.skip;
    const toggle = document.getElementById("lang-toggle");
    toggle.textContent = t.ui.langToggle;
    toggle.setAttribute("aria-label", t.ui.langToggleAria);

    /* One phrase per act: the gate letter lives in the throughline node
       beside it, so the kicker carries only the act's name. Gate meanings
       (SITE.gates[i][lang]) stay in the data, ready for the real EDGE
       definitions. */
    const kicker = (label) => `
      <p class="gate-kicker"><span class="act-label">${label}</span></p>`;

    /* Act 1 — FRAME */
    const f = acts.frame;
    const act1 = `
      <section class="act act--frame" id="act-frame" data-stratum="frame" aria-label="${f.label}">
        <svg class="frame-strata" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path vector-effect="non-scaling-stroke" d="M0 24 C 22 22.6, 38 25.2, 58 24 S 86 22.8, 100 24.4" />
          <path vector-effect="non-scaling-stroke" d="M0 33 C 18 34.4, 42 31.8, 63 33.2 S 88 34.2, 100 32.8" />
          <path vector-effect="non-scaling-stroke" d="M0 42 C 26 40.8, 44 43.4, 66 42 S 90 41, 100 42.6" />
        </svg>
        ${kicker(f.label)}
        <p class="frame-kicker">${f.kicker}</p>
        <h1 class="frame-headline">
          ${f.headline.map((l, i) => `<span class="line"><span style="--i:${i}">${l}</span></span>`).join("")}
        </h1>
        <p class="frame-sub">
          <span class="name">${f.subName}</span>
          <span class="role">${f.subRole}</span>
        </p>
        <p class="frame-cue">${t.ui.followLine}</p>
      </section>`;

    /* Act 2 — ROOT */
    const r = acts.root;
    const act2 = `
      <section class="act act--root" id="act-root" data-stratum="root" aria-label="${r.label}">
        ${kicker(r.label)}
        <h2 class="act-thesis reveal">${r.thesis}</h2>
        <div class="root-blocks">
          ${r.blocks.map((b, i) => `
            <article class="root-block reveal" style="--i:${i + 1}">
              <p class="era">${b.era}</p>
              <h3>${b.title}</h3>
              <p>${b.body}</p>
              ${b.proof ? `<p class="proof">${b.proof}</p>` : ""}
              ${b.note ? `<p class="note">${b.note}</p>` : ""}
            </article>`).join("")}
        </div>
      </section>`;

    /* Act 3 — SYNTHESIS */
    const s = acts.synthesis;
    const act3 = `
      <section class="act act--synthesis" id="act-synthesis" data-stratum="synthesis" aria-label="${s.label}">
        ${kicker(s.label)}
        <h2 class="act-thesis reveal">${s.thesis}</h2>
        <div class="synth-ledger">
          ${s.rows.map((row, i) => `
            <div class="synth-row reveal" style="--i:${i + 1}">
              <h3 class="field">${row.field}</h3>
              <p class="engagements">${row.body}</p>
            </div>`).join("")}
        </div>
        <p class="synth-coda reveal" style="--i:4">${s.coda}</p>
      </section>`;

    /* Act 4 — METHOD + INVITATION */
    const m = acts.method;
    const act4 = `
      <section class="act act--method" id="act-method" data-stratum="method" aria-label="${m.label}">
        ${kicker(m.label)}
        <h2 class="act-thesis reveal">${m.thesis}</h2>
        <div class="method-grid">
          <div class="method-col reveal" style="--i:1">
            <h3>${m.frameworks.title}</h3>
            <ul class="framework-list">
              ${m.frameworks.items.map((x) => `<li>${x}</li>`).join("")}
            </ul>
          </div>
          <div class="method-col reveal" style="--i:2">
            <h3>${m.credentials.title}</h3>
            <ul class="credential-list">
              ${m.credentials.items.map((x) => `<li>${x}</li>`).join("")}
            </ul>
          </div>
          <div class="method-col reveal" style="--i:3">
            <h3>${m.books.title}</h3>
            ${m.books.items.map((b) => `
              <p class="book">
                <span class="book-name">${b.name}</span>
                <span class="book-desc">${b.desc}</span>
              </p>`).join("")}
            <p class="book-upcoming">${m.books.upcomingLabel} ${m.books.upcoming.join(" · ")}</p>
          </div>
        </div>
        <div class="method-close reveal" style="--i:4">
          <h2>${m.close.headline}</h2>
          <p class="close-body">${m.close.body}</p>
          <a class="cta" id="cta" href="mailto:${SITE.contact.email}">
            ${m.close.cta}<span class="cta-mark" aria-hidden="true">↗</span>
          </a>
          <p class="colophon">
            <span>${t.ui.wordmark}</span>
            <span>${SITE.contact.email}</span>
          </p>
        </div>
      </section>`;

    app.innerHTML = act1 + act2 + act3 + act4;
  }

  /* ---- 2. Throughline ------------------------------------------------------
     One path through five points: the top of the page, the four gate
     kickers (on the spine), and the CTA — where the line resolves.
     The drawn stroke leads the visitor at ~2/3 viewport height. */

  const svgNS = "http://www.w3.org/2000/svg";
  let pathLen = 0;
  let samples = [];      // [{y, len}] — y is monotonic, used to map scroll -> length
  let nodeMeta = [];     // [{el, len}] — gate nodes lit as the line reaches them
  let drawnPath = null;
  let currentOffset = 0;
  let targetOffset = 0;
  let rafId = null;

  function spineX() {
    // custom properties don't resolve clamp() via getComputedStyle,
    // so measure a probe element sized with var(--spine)
    const spine = document.getElementById("spine-probe").offsetWidth;
    return document.documentElement.dir === "rtl"
      ? document.documentElement.clientWidth - spine
      : spine;
  }

  function buildLine() {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.scrollHeight;
    const sx = spineX();

    // Gate points: on the spine, level with each act's gate kicker
    const gatePts = [...app.querySelectorAll(".gate-kicker")].map((el) => {
      const r = el.getBoundingClientRect();
      return { x: sx, y: r.top + window.scrollY + r.height / 2 };
    });

    // Resolution point: the line descends the spine past the text,
    // then turns and touches the CTA's near edge
    const rtl = document.documentElement.dir === "rtl";
    const cta = document.getElementById("cta");
    const cr = cta.getBoundingClientRect();
    const endPt = {
      x: (rtl ? cr.right + 5 : cr.left - 5) + window.scrollX,
      y: cr.top + window.scrollY + cr.height / 2,
    };
    const elbowR = Math.min(56, Math.abs(endPt.x - sx) + 24);
    const elbowPt = { x: sx, y: endPt.y - elbowR };

    const pts = [{ x: sx, y: 0 }, ...gatePts, elbowPt];

    // Vertical-tangent S-curves between consecutive points
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const my = (a.y + b.y) / 2;
      d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
    }
    // the elbow: vertical arrival turns horizontal into the button edge
    d += ` C ${sx} ${endPt.y}, ${sx} ${endPt.y}, ${endPt.x} ${endPt.y}`;

    line.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    const future = document.createElementNS(svgNS, "path");
    future.setAttribute("class", "line-future");
    future.setAttribute("d", d);

    drawnPath = document.createElementNS(svgNS, "path");
    drawnPath.setAttribute("class", "line-drawn");
    drawnPath.setAttribute("d", d);

    svg.append(future, drawnPath);

    pathLen = drawnPath.getTotalLength();
    drawnPath.style.strokeDasharray = String(pathLen);

    // Sample the path so scroll position maps to drawn length
    samples = [];
    const N = 220;
    for (let i = 0; i <= N; i++) {
      const l = (pathLen * i) / N;
      samples.push({ y: drawnPath.getPointAtLength(l).y, len: l });
    }

    // Gate nodes (letters) + the end dot
    nodeMeta = [];
    gatePts.forEach((p, i) => {
      const gNode = document.createElementNS(svgNS, "g");
      gNode.setAttribute("class", "gate-node");
      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", p.x);
      c.setAttribute("cy", p.y);
      c.setAttribute("r", 13);
      const tx = document.createElementNS(svgNS, "text");
      tx.setAttribute("x", p.x);
      tx.setAttribute("y", p.y);
      tx.setAttribute("dy", "0.35em");
      tx.textContent = SITE.gates[i].letter;
      gNode.append(c, tx);
      svg.append(gNode);
      nodeMeta.push({ el: gNode, len: lenAtY(p.y) });
    });
    const endNode = document.createElementNS(svgNS, "g");
    endNode.setAttribute("class", "gate-node gate-node--end");
    const ec = document.createElementNS(svgNS, "circle");
    ec.setAttribute("cx", endPt.x);
    ec.setAttribute("cy", endPt.y);
    ec.setAttribute("r", 4);
    endNode.append(ec);
    svg.append(endNode);
    nodeMeta.push({ el: endNode, len: pathLen - 2 });

    line.appendChild(svg);

    if (reduceMotion.matches) {
      currentOffset = targetOffset = 0;
      drawnPath.style.strokeDashoffset = "0";
      nodeMeta.forEach((n) => n.el.classList.add("is-lit"));
    } else {
      currentOffset = pathLen;
      updateTarget();
      drawnPath.style.strokeDashoffset = String(currentOffset);
      tick();
    }
  }

  function lenAtY(y) {
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].y >= y) return samples[i].len;
    }
    return pathLen;
  }

  function updateTarget() {
    // the lead point rides at ~2/3 viewport, stretching to the very end
    // of the document as the visitor reaches the bottom, so the line
    // fully resolves at the CTA
    const vh = window.innerHeight;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    const progress = Math.min(1, window.scrollY / maxScroll);
    const leadY = window.scrollY + vh * (0.68 + 0.34 * progress);
    targetOffset = pathLen - lenAtY(leadY);
  }

  function tick() {
    if (rafId) return;
    const step = () => {
      currentOffset += (targetOffset - currentOffset) * 0.14;
      if (Math.abs(targetOffset - currentOffset) < 0.5) {
        currentOffset = targetOffset;
        rafId = null;
      } else {
        rafId = requestAnimationFrame(step);
      }
      drawnPath.style.strokeDashoffset = String(currentOffset);
      const drawn = pathLen - currentOffset;
      nodeMeta.forEach((n) => n.el.classList.toggle("is-lit", drawn >= n.len - 6));
    };
    rafId = requestAnimationFrame(step);
  }

  /* ---- 3. Observers -------------------------------------------------------- */

  const themeColors = {
    frame: "#14151B",
    root: "#271B16",
    synthesis: "#18222E",
    method: "#ECE6DA",
  };

  function observe() {
    // Stratum: which act crosses the vertical center of the viewport
    const stratumIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const s = e.target.dataset.stratum;
            document.body.dataset.stratum = s;
            // wordmark recedes once past Act 1 so it can't overlap content
            document.body.dataset.scrolled = s === "frame" ? "false" : "true";
            document.querySelector('meta[name="theme-color"]')
              .setAttribute("content", themeColors[s]);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );

    // Reveals: once, on entry
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            revealIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    app.querySelectorAll(".act").forEach((el) => stratumIO.observe(el));
    if (reduceMotion.matches) {
      app.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
    } else {
      app.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));
    }
  }

  /* ---- 4. Language ----------------------------------------------------------- */

  function setLang(next) {
    lang = next;
    try {
      localStorage.setItem("lang", lang);
    } catch (e) { /* private mode — preference won't persist */ }
    boot();
  }

  document.getElementById("lang-toggle").addEventListener("click", () => {
    setLang(lang === "fa" ? "en" : "fa");
  });

  /* ---- Boot ------------------------------------------------------------------ */

  let resizeTimer = null;

  function boot() {
    render();
    observe();
    // two frames so layout settles before the path is measured
    requestAnimationFrame(() => requestAnimationFrame(() => {
      buildLine();
      document.body.classList.add("is-loaded");
    }));
  }

  window.addEventListener("scroll", () => {
    if (!pathLen || reduceMotion.matches) return;
    updateTarget();
    tick();
  }, { passive: true });

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildLine, 180);
  });

  reduceMotion.addEventListener("change", boot);

  boot();

  // rebuild once real glyph metrics have settled layout
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(buildLine);
  }
})();
