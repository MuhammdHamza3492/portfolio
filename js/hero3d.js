(function () {
  var container = document.getElementById("hero3d");
  if (!container) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.getElementById("hero3d-canvas");
  var ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  container.addEventListener(
    "wheel",
    function (e) {
      e.stopPropagation();
    },
    { capture: true, passive: true }
  );

  var GLYPHS = [
    "{", "}", "[", "]", "(", ")", "<", ">",
    "0", "1", "/", "*", "=", ";",
    "=>", "fn", "AI", "||", "::",
    "#", "@", "<>", "++", "λ",
  ];

  var COLORS = [
    "rgba(87, 227, 160, 0.95)",
    "rgba(91, 140, 255, 0.92)",
    "rgba(165, 117, 255, 0.88)",
    "rgba(200, 230, 255, 0.8)",
    "rgba(87, 227, 160, 0.6)",
  ];

  // Dense bot silhouette in normalized figure space
  function botTargets() {
    var pts = [];
    function fillRect(x0, y0, x1, y1, step, w) {
      for (var y = y0; y <= y1; y += step) {
        for (var x = x0; x <= x1; x += step) {
          pts.push({ x: x, y: y, w: w || 1, kind: "body" });
        }
      }
    }
    function ring(x0, y0, x1, y1, step, w) {
      for (var x = x0; x <= x1; x += step) {
        pts.push({ x: x, y: y0, w: w, kind: "body" });
        pts.push({ x: x, y: y1, w: w, kind: "body" });
      }
      for (var y = y0 + step; y < y1; y += step) {
        pts.push({ x: x0, y: y, w: w, kind: "body" });
        pts.push({ x: x1, y: y, w: w, kind: "body" });
      }
    }

    // Antenna
    fillRect(0.48, 0.04, 0.52, 0.12, 0.025, 1.1);
    pts.push({ x: 0.5, y: 0.03, w: 1.5, kind: "core" });

    // Head shell
    ring(0.3, 0.13, 0.7, 0.4, 0.028, 1.05);
    fillRect(0.34, 0.17, 0.66, 0.36, 0.045, 0.75);

    // Eyes
    pts.push({ x: 0.4, y: 0.25, w: 2.1, kind: "eye" });
    pts.push({ x: 0.6, y: 0.25, w: 2.1, kind: "eye" });
    pts.push({ x: 0.38, y: 0.25, w: 1.2, kind: "eye" });
    pts.push({ x: 0.42, y: 0.25, w: 1.2, kind: "eye" });
    pts.push({ x: 0.58, y: 0.25, w: 1.2, kind: "eye" });
    pts.push({ x: 0.62, y: 0.25, w: 1.2, kind: "eye" });

    // Mouth grille
    for (var mx = 0.38; mx <= 0.62; mx += 0.03) {
      pts.push({ x: mx, y: 0.33, w: 0.85, kind: "body" });
    }

    // Neck
    fillRect(0.46, 0.4, 0.54, 0.46, 0.03, 0.9);

    // Torso
    ring(0.26, 0.46, 0.74, 0.74, 0.03, 1.1);
    fillRect(0.32, 0.5, 0.68, 0.7, 0.04, 0.7);

    // Chest core
    pts.push({ x: 0.5, y: 0.58, w: 2.2, kind: "core" });
    pts.push({ x: 0.5, y: 0.62, w: 1.4, kind: "core" });
    fillRect(0.44, 0.55, 0.56, 0.64, 0.035, 1.15);

    // Arms
    fillRect(0.14, 0.48, 0.24, 0.72, 0.03, 1);
    fillRect(0.76, 0.48, 0.86, 0.72, 0.03, 1);
    pts.push({ x: 0.16, y: 0.74, w: 1.3, kind: "body" });
    pts.push({ x: 0.84, y: 0.74, w: 1.3, kind: "body" });

    // Legs
    fillRect(0.34, 0.76, 0.44, 0.96, 0.03, 1);
    fillRect(0.56, 0.76, 0.66, 0.96, 0.03, 1);
    pts.push({ x: 0.39, y: 0.98, w: 1.2, kind: "body" });
    pts.push({ x: 0.61, y: 0.98, w: 1.2, kind: "body" });

    return pts;
  }

  var particles = [];
  var pointer = { x: 0.55, y: 0.4, tx: 0.55, ty: 0.4 };
  var assemble = 0;
  var t0 = performance.now();
  var dpr = 1;
  var W = 0;
  var H = 0;
  var running = true;
  var figure = { ox: 0, oy: 0, w: 0, h: 0 };

  function resize() {
    var rect = container.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutParticles();
  }

  function layoutParticles() {
    var targets = botTargets();
    figure.w = Math.min(W * 0.78, 360);
    figure.h = Math.min(H * 0.82, 560);
    figure.ox = W * 0.54 - figure.w * 0.5;
    figure.oy = H * 0.48 - figure.h * 0.5;

    var driftCount = Math.max(24, Math.floor((W * H) / 9000));
    var count = targets.length + driftCount;

    while (particles.length < count) particles.push(makeParticle());
    particles.length = count;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (i < targets.length) {
        var tg = targets[i];
        p.tx = figure.ox + tg.x * figure.w;
        p.ty = figure.oy + tg.y * figure.h;
        p.role = "bot";
        p.kind = tg.kind;
        p.weight = tg.w;
      } else {
        p.tx = Math.random() * W;
        p.ty = Math.random() * H;
        p.role = "drift";
        p.kind = "drift";
        p.weight = 0.5 + Math.random() * 0.35;
      }
      if (p.x == null) {
        p.x = W * 0.5 + (Math.random() - 0.5) * W * 1.2;
        p.y = H * 0.5 + (Math.random() - 0.5) * H * 1.2;
      }
    }
  }

  function makeParticle() {
    return {
      x: null,
      y: null,
      tx: 0,
      ty: 0,
      vx: 0,
      vy: 0,
      glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      color: COLORS[(Math.random() * COLORS.length) | 0],
      size: 10 + Math.random() * 7,
      phase: Math.random() * Math.PI * 2,
      role: "drift",
      kind: "drift",
      weight: 1,
    };
  }

  function onPointer(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.tx = (clientX - rect.left) / rect.width;
    pointer.ty = (clientY - rect.top) / rect.height;
  }

  window.addEventListener(
    "pointermove",
    function (e) {
      if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      onPointer(e.clientX, e.clientY);
    },
    { passive: true }
  );
  window.addEventListener("pointerdown", function (e) { onPointer(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) {
      t0 = performance.now();
      requestAnimationFrame(frame);
    }
  });
  window.addEventListener("resize", resize);

  function drawGhostShell(lookX, lookY, alpha) {
    var ox = figure.ox + lookX * 0.25;
    var oy = figure.oy + lookY * 0.25;
    var fw = figure.w;
    var fh = figure.h;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(87, 227, 160, 0.35)";
    ctx.lineWidth = 1.25;
    // Head
    roundRect(ox + fw * 0.3, oy + fh * 0.13, fw * 0.4, fh * 0.27, 10);
    ctx.stroke();
    // Torso
    roundRect(ox + fw * 0.26, oy + fh * 0.46, fw * 0.48, fh * 0.28, 12);
    ctx.stroke();
    // Arms
    roundRect(ox + fw * 0.14, oy + fh * 0.48, fw * 0.1, fh * 0.24, 6);
    ctx.stroke();
    roundRect(ox + fw * 0.76, oy + fh * 0.48, fw * 0.1, fh * 0.24, 6);
    ctx.stroke();
    // Legs
    roundRect(ox + fw * 0.34, oy + fh * 0.76, fw * 0.1, fh * 0.2, 6);
    ctx.stroke();
    roundRect(ox + fw * 0.56, oy + fh * 0.76, fw * 0.1, fh * 0.2, 6);
    ctx.stroke();
    // Antenna
    ctx.beginPath();
    ctx.moveTo(ox + fw * 0.5, oy + fh * 0.13);
    ctx.lineTo(ox + fw * 0.5, oy + fh * 0.04);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ox + fw * 0.5, oy + fh * 0.03, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);

    var dt = Math.min(0.033, (now - t0) / 1000);
    t0 = now;
    var time = now * 0.001;

    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    assemble = Math.min(1, assemble + dt * 0.42);

    var lookX = (pointer.x - 0.5) * 40;
    var lookY = (pointer.y - 0.45) * 30;
    var assembleEase = assemble * assemble * (3 - 2 * assemble);

    ctx.clearRect(0, 0, W, H);

    var gx = figure.ox + figure.w * 0.5 + lookX * 0.25;
    var gy = figure.oy + figure.h * 0.45 + lookY * 0.25;
    var glow = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.min(W, H) * 0.42);
    glow.addColorStop(0, "rgba(87, 227, 160, 0.14)");
    glow.addColorStop(0.4, "rgba(91, 140, 255, 0.06)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    drawGhostShell(lookX, lookY, 0.18 + 0.22 * assembleEase);

    // Links between nearby bot particles
    ctx.lineWidth = 1;
    for (var c = 0; c < particles.length; c += 5) {
      var a = particles[c];
      if (a.role !== "bot") continue;
      for (var n = 1; n <= 3; n++) {
        var b = particles[c + n];
        if (!b || b.role !== "bot") continue;
        var dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > 42 || dist < 6) continue;
        ctx.strokeStyle = "rgba(91, 140, 255, " + (0.16 * assembleEase * (1 - dist / 42)).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var wobbleAmp = p.role === "drift" ? 12 : p.kind === "eye" ? 0.8 : 1.6;
      var wobbleX = Math.sin(time * 1.15 + p.phase) * wobbleAmp;
      var wobbleY = Math.cos(time * 0.95 + p.phase) * wobbleAmp * 0.85;
      var targetX = p.tx + (p.role === "bot" ? lookX * p.weight * 0.32 : 0) + wobbleX;
      var targetY = p.ty + (p.role === "bot" ? lookY * p.weight * 0.32 : 0) + wobbleY;

      if (p.role === "drift") {
        targetX += Math.sin(time * 0.35 + p.phase) * 22;
        targetY += Math.cos(time * 0.3 + p.phase * 1.2) * 16;
      }

      var pull = p.role === "bot" ? 0.12 + assembleEase * 0.18 : 0.018;
      p.vx += (targetX - p.x) * pull;
      p.vy += (targetY - p.y) * pull;
      p.vx *= 0.78;
      p.vy *= 0.78;
      p.x += p.vx;
      p.y += p.vy;

      if (Math.random() < 0.0035) {
        p.glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }

      var pulse = 0.82 + 0.18 * Math.sin(time * 2.2 + p.phase);
      var fontSize = p.size * (0.9 + 0.25 * p.weight) * pulse;
      var alpha = p.role === "bot" ? 0.45 + 0.55 * assembleEase : 0.22;

      if (p.kind === "eye" || p.kind === "core") {
        ctx.shadowColor = p.kind === "eye" ? "rgba(87, 227, 160, 0.7)" : "rgba(91, 140, 255, 0.55)";
        ctx.shadowBlur = p.kind === "eye" ? 16 : 12;
        fontSize *= 1.2;
        alpha = Math.min(1, alpha + 0.2);
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = Math.min(1, alpha * pulse);
      ctx.fillStyle = p.kind === "eye" ? "rgba(87, 227, 160, 1)" : p.color;
      ctx.font = "600 " + fontSize.toFixed(1) + "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.glyph, p.x, p.y);

      if (p.kind === "eye") {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.28 * assembleEase;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11 + 2.5 * Math.sin(time * 3 + p.phase), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(87, 227, 160, 0.3)";
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    var scanY = ((time * 38) % (H + 90)) - 45;
    var scan = ctx.createLinearGradient(0, scanY - 28, 0, scanY + 28);
    scan.addColorStop(0, "rgba(87, 227, 160, 0)");
    scan.addColorStop(0.5, "rgba(87, 227, 160, 0.08)");
    scan.addColorStop(1, "rgba(87, 227, 160, 0)");
    ctx.fillStyle = scan;
    ctx.fillRect(0, scanY - 28, W, 56);
  }

  resize();
  container.classList.add("loaded");
  requestAnimationFrame(frame);
})();
