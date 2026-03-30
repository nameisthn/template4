/* ── Build grouped hour blocks ── */
(function buildTimeline() {
  const wrap = document.getElementById('blocks-wrap');
  if (!wrap) return;

  for (let h = 0; h <= 23; h++) {
    const dh   = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? 'AM' : 'PM';

    const block = document.createElement('div');
    block.className = 'hour-block';

    /* Hour label row */
    const label = document.createElement('div');
    label.className = 'hour-label';
    label.innerHTML = `
      <span class="hour-badge">${dh}:00 ${ampm}</span>
      <div class="hour-line"></div>
      <span class="hour-gem">✦</span>
    `;
    block.appendChild(label);

    /* :30 sub-row */
    const half = document.createElement('div');
    half.className = 'half-row';
    half.innerHTML = `
      <div class="half-dot"></div>
      <span class="half-time">${dh}:30 ${ampm}</span>
      <span class="half-event"></span>
    `;
    block.appendChild(half);

    wrap.appendChild(block);
  }
})();


/* ── Magic confetti & glowing orbs animation ── */
(function setupAnimation() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  function rnd(a, b) { return a + Math.random() * (b - a); }

  const SHAPES = ['✦', '·', '✧', '♡', '˖'];
  const HUES   = [270, 285, 310, 330, 200];

  /* Drifting confetti */
  const conf = Array.from({ length: 60 }, () => ({
    x:      rnd(0, 1), y: rnd(0, 1),
    shape:  SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size:   rnd(8, 18),
    speedY: rnd(0.0004, 0.0011),
    speedX: rnd(-0.0002, 0.0002),
    rot:    rnd(0, Math.PI * 2),
    rotSpd: rnd(-0.015, 0.015),
    alpha:  rnd(0.10, 0.30),
    hue:    HUES[Math.floor(Math.random() * HUES.length)],
    wobble: rnd(0.006, 0.016),
    age:    rnd(0, 999),
  }));

  /* Glowing orbs */
  const orbs = Array.from({ length: 18 }, () => ({
    x:     rnd(0, 1), y: rnd(0, 1),
    r:     rnd(20, 60),
    hue:   HUES[Math.floor(Math.random() * HUES.length)],
    phase: rnd(0, Math.PI * 2),
    spd:   rnd(0.006, 0.016),
    drift: rnd(-0.00015, 0.00015),
    rise:  rnd(-0.00025, -0.00008),
  }));

  /* Click burst: confetti explosion */
  const bursts = [];
  document.addEventListener('click', e => {
    for (let i = 0; i < 22; i++) {
      const ang = (i / 22) * Math.PI * 2 + rnd(-0.2, 0.2);
      bursts.push({
        x:      e.clientX, y: e.clientY,
        vx:     Math.cos(ang) * rnd(2, 6),
        vy:     Math.sin(ang) * rnd(2, 6),
        shape:  SHAPES[Math.floor(Math.random() * SHAPES.length)],
        size:   rnd(10, 20),
        hue:    HUES[Math.floor(Math.random() * HUES.length)],
        rot:    rnd(0, Math.PI * 2),
        rotSpd: rnd(-0.1, 0.1),
        life:   0,
        max:    rnd(40, 80),
      });
    }
    while (bursts.length > 250) bursts.shift();
  });

  let t = 0;
  function loop() {
    t++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height;

    /* Glowing orbs */
    for (const o of orbs) {
      o.x += o.drift; o.y += o.rise;
      if (o.y < -0.1) { o.y = 1.1; o.x = rnd(0, 1); }

      const glow = 0.25 + 0.75 * Math.abs(Math.sin(o.phase + t * o.spd));
      const g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r);
      g.addColorStop(0, `hsla(${o.hue},65%,72%,${glow * 0.18})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x * W, o.y * H, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* Confetti pieces */
    for (const c of conf) {
      c.age++;
      c.x += c.speedX + Math.sin(c.age * c.wobble) * 0.0002;
      c.y += c.speedY;
      c.rot += c.rotSpd;
      if (c.y > 1.05) { c.y = -0.05; c.x = rnd(0, 1); }

      ctx.save();
      ctx.translate(c.x * W, c.y * H);
      ctx.rotate(c.rot);
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle   = `hsl(${c.hue},60%,65%)`;
      ctx.font        = `${c.size}px serif`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.shape, 0, 0);
      ctx.restore();
    }

    /* Burst particles */
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life++; b.x += b.vx; b.y += b.vy; b.vy += 0.07;
      b.rot += b.rotSpd;
      const a = 1 - b.life / b.max;

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle   = `hsl(${b.hue},65%,62%)`;
      ctx.font        = `${b.size}px serif`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.shape, 0, 0);
      ctx.restore();

      if (b.life >= b.max) bursts.splice(i, 1);
    }

    requestAnimationFrame(loop);
  }
  loop();
})();
