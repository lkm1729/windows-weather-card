/* ============================================================
 * bganimate.js — 天气背景动画层（canvas，零依赖）
 * 依据天气码 + 昼夜启动对应粒子系统：
 *   雨/阵雨/雷暴 → 斜落雨丝（雷暴加整屏闪电）
 *   雪 → 摇摆飘雪
 *   雾 → 流动雾带
 *   多云/阴 → 漂浮云团（昼白色 / 夜高可见度）
 *   晴（夜） → 星空闪烁 + 流星
 *   晴（昼） → 暖金色光斑漂浮（马卡龙背景上清晰可见）
 * 支持 devicePixelRatio 高分屏渲染。
 * ============================================================ */

const BGAnimate = (() => {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let rafId = null;
  let mode = null;      // rain | snow | fog | clouds | stars | sun | thunder
  let W = 0, H = 0;     // 逻辑尺寸（CSS 像素）
  let flashUntil = 0;   // 雷电闪光截止时间
  let frames = 0;       // 已渲染帧数（调试用）

  function resize() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 之后全部按 CSS 像素绘制
  }

  function setCanvas(el) {
    canvas = el;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function clear() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    particles = [];
    mode = null;
    frames = 0;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  /* ---------- 粒子工厂 ---------- */
  function makeDrop() {
    return {
      x: Math.random() * (W + 60) - 30,
      y: Math.random() * H,
      len: 12 + Math.random() * 20,
      speed: 11 + Math.random() * 8,
      alpha: 0.3 + Math.random() * 0.25,
    };
  }

  function makeFlake() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1.5 + Math.random() * 3,
      speed: 0.8 + Math.random() * 1.6,
      drift: 0.6 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.5 + Math.random() * 0.45,
    };
  }

  function makeCloud() {
    return {
      x: Math.random() * W,
      y: Math.random() * H * 0.6,
      r: 80 + Math.random() * 110,
      speed: 0.12 + Math.random() * 0.28,
      alpha: 0.1 + Math.random() * 0.1,
    };
  }

  function makeFogBand() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      w: 220 + Math.random() * 320,
      h: 50 + Math.random() * 80,
      speed: 0.2 + Math.random() * 0.4,
      alpha: 0.08 + Math.random() * 0.08,
    };
  }

  function makeStar() {
    return {
      x: Math.random() * W,
      y: Math.random() * H * 0.85,
      r: 0.6 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.5 + Math.random() * 1.5,
      alpha: 0.35 + Math.random() * 0.6,
    };
  }

  function makeMote() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 2 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: 0.25 + Math.random() * 0.25,
    };
  }

  function makeMeteor() {
    return {
      meteor: true,
      x: W * (0.2 + Math.random() * 0.7),
      y: -20,
      len: 90 + Math.random() * 90,
      speed: 9 + Math.random() * 6,
      alpha: 0.8,
      active: true,
    };
  }

  /* ---------- 各模式绘制循环 ---------- */
  function loop(ts) {
    if (!ctx) return;
    frames++;
    ctx.clearRect(0, 0, W, H);

    if (mode === "rain" || mode === "thunder") {
      particles.forEach((p) => {
        p.y += p.speed;
        if (p.y > H + 30) { Object.assign(p, makeDrop(), { y: -30 }); }
        ctx.strokeStyle = `rgba(200, 220, 255, ${p.alpha})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 2, p.y + p.len); // 斜落更自然
        ctx.stroke();
      });
      // 雷电：随机整屏白闪
      if (mode === "thunder") {
        if (ts < flashUntil) {
          ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.1})`;
          ctx.fillRect(0, 0, W, H);
        } else if (Math.random() < 0.004) {
          flashUntil = ts + 160;
        }
      }
    }

    if (mode === "snow") {
      particles.forEach((p) => {
        p.phase += 0.02;
        p.y += p.speed;
        p.x += Math.sin(p.phase) * p.drift;
        if (p.y > H + 8) { Object.assign(p, makeFlake(), { y: -8 }); }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    if (mode === "clouds") {
      particles.forEach((p) => {
        p.x += p.speed;
        if (p.x - p.r > W) p.x = -p.r;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255,255,255,${p.alpha})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (mode === "fog") {
      particles.forEach((p) => {
        p.x += p.speed;
        if (p.x - p.w > W) p.x = -p.w;
        const g = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, `rgba(255,255,255,${p.alpha})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(p.x + p.w / 2, p.y, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (mode === "stars") {
      particles.forEach((p) => {
        p.phase += 0.02 * p.twinkle;
        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      // 流星（独立数组段，避免与星星混写）
      if (Math.random() < 0.005) particles.push(makeMeteor());
      for (let i = particles.length - 1; i >= 0; i--) {
        const m = particles[i];
        if (!m.meteor) continue;
        m.y += m.speed;
        m.x += m.speed * 0.5;
        if (m.y > H + 40) { particles.splice(i, 1); continue; }
        const g = ctx.createLinearGradient(m.x, m.y, m.x - m.len * 0.5, m.y - m.len);
        g.addColorStop(0, `rgba(255,255,255,${m.alpha})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.len * 0.5, m.y - m.len);
        ctx.stroke();
      }
    }

    if (mode === "sun") {
      // 暖金色光斑——在马卡龙浅色背景上清晰可见
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20 || p.x > W + 20) p.vx *= -1;
        if (p.y < -20 || p.y > H + 20) p.vy *= -1;
        const R = p.r * 7;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
        g.addColorStop(0, `rgba(255, 205, 120, ${p.alpha})`);
        g.addColorStop(1, "rgba(255, 205, 120, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    rafId = requestAnimationFrame(loop);
  }

  /* ---------- 启动入口 ---------- */
  function start(weatherCode, isDay) {
    if (!ctx) return null;
    clear();

    let target;
    if (weatherCode >= 95) target = "thunder";
    else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) target = "rain";
    else if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) target = "snow";
    else if (weatherCode === 45 || weatherCode === 48) target = "fog";
    else if (weatherCode === 2 || weatherCode === 3) target = "clouds";
    else if (!isDay) target = "stars";
    else target = "sun";

    mode = target;
    const counts = {
      rain: 140, thunder: 140, snow: 100, fog: 9,
      clouds: 9, stars: 120, sun: 14,
    };
    const factory = {
      rain: makeDrop, thunder: makeDrop, snow: makeFlake, fog: makeFogBand,
      clouds: makeCloud, stars: makeStar, sun: makeMote,
    };
    particles = Array.from({ length: counts[target] }, factory[target]);
    rafId = requestAnimationFrame(loop);
    return target;
  }

  const MODE_NAMES = {
    rain: "雨", thunder: "雷暴", snow: "雪", fog: "雾",
    clouds: "云", stars: "星空", sun: "晴光",
  };

  return {
    setCanvas, start, clear,
    getMode: () => mode,
    getModeName: () => MODE_NAMES[mode] || "—",
    isRunning: () => rafId !== null,
    getFrames: () => frames,
  };
})();
