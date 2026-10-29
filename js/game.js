/* ============================================================
   ČÍSELNÉ BLUDIŠTĚ – hlavní logika hry
   ============================================================ */
(function () {
  "use strict";

  const D = window.GameData;
  const QE = window.QuestionEngine;
  const MB = window.MazeBuilder;
  const TILE = D.TILE;
  const COLS = D.COLS;
  const ROWS = D.ROWS;
  const W = COLS * TILE;
  const H = ROWS * TILE;
  const TAU = Math.PI * 2;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (min, max) => min + Math.random() * (max - min);
  const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const dist2 = (ax, ay, bx, by) => {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  };
  const formatScore = new Intl.NumberFormat("cs-CZ");
  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  const DIRS = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
  };

  /* ---------- ukládání ---------- */
  const Store = {
    data: { best: {}, sound: true, lastLevel: "trida34" },
    load() {
      try {
        const raw = localStorage.getItem(D.SAVE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            this.data = {
              best: parsed.best && typeof parsed.best === "object" ? parsed.best : {},
              sound: parsed.sound !== false,
              lastLevel: parsed.lastLevel || "trida34"
            };
          }
        }
      } catch (e) { /* localStorage může být vypnuté */ }
    },
    save() {
      try { localStorage.setItem(D.SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
    },
    best(id) { return Number(this.data.best[id]) || 0; },
    setBest(id, score) {
      if (score > this.best(id)) {
        this.data.best[id] = score;
        this.save();
        return true;
      }
      return false;
    }
  };
  Store.load();

  /* ---------- zvuk ---------- */
  const AudioFX = (() => {
    let ac = null;
    let master = null;
    let enabled = Store.data.sound;

    function init() {
      if (ac) {
        if (ac.state === "suspended") ac.resume().catch(() => {});
        return;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain();
        master.gain.value = enabled ? 0.45 : 0;
        master.connect(ac.destination);
      } catch (e) { ac = null; }
    }

    function setEnabled(value) {
      enabled = !!value;
      Store.data.sound = enabled;
      Store.save();
      if (master) master.gain.value = enabled ? 0.45 : 0;
      if (enabled) init();
    }

    function isEnabled() { return enabled; }

    function tone(freq, dur, type, vol, slideTo, when) {
      if (!enabled) return;
      init();
      if (!ac || !master) return;
      const t0 = ac.currentTime + (when || 0);
      try {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(Math.max(30, freq), t0);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(vol == null ? 0.06 : vol, t0 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.03);
      } catch (e) { /* ignore */ }
    }

    return {
      init, setEnabled, isEnabled,
      click() { tone(520, 0.05, "triangle", 0.03, 620); },
      shoot() { tone(720, 0.055, "square", 0.025, 400); },
      hit() { tone(240, 0.06, "square", 0.035, 120); },
      enemyDown() {
        tone(330, 0.1, "sawtooth", 0.045, 90);
        tone(180, 0.14, "triangle", 0.03, 60, 0.03);
      },
      hurt() {
        tone(160, 0.22, "sawtooth", 0.07, 55);
        tone(90, 0.18, "square", 0.04, 45, 0.02);
      },
      shieldBreak() {
        tone(880, 0.12, "sine", 0.05, 440);
        tone(660, 0.16, "triangle", 0.04, 220, 0.04);
      },
      pickup() { tone(880, 0.07, "sine", 0.045, 1320); },
      weapon() {
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.13, "triangle", 0.045, null, i * 0.06));
      },
      heal() {
        [440, 554, 659].forEach((f, i) => tone(f, 0.12, "sine", 0.04, null, i * 0.07));
      },
      chest() {
        [392, 494, 587, 784].forEach((f, i) => tone(f, 0.16, "triangle", 0.045, null, i * 0.07));
      },
      correct() {
        [659, 784, 1047].forEach((f, i) => tone(f, 0.16, "sine", 0.055, null, i * 0.07));
      },
      wrong() {
        tone(180, 0.16, "square", 0.05, 120);
        tone(140, 0.2, "sawtooth", 0.035, 90, 0.08);
      },
      tick() { tone(880, 0.035, "sine", 0.018, null); },
      portal() {
        [220, 330, 440, 660, 880].forEach((f, i) => tone(f, 0.22, "sine", 0.04, f * 1.5, i * 0.09));
      },
      win() {
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.24, "triangle", 0.055, null, i * 0.1));
      },
      dead() {
        [330, 262, 196, 131].forEach((f, i) => tone(f, 0.25, "sawtooth", 0.05, f * 0.7, i * 0.12));
      }
    };
  })();

  /* ---------- DOM ---------- */
  const ui = {
    startScreen: $("startScreen"), gameShell: $("gameShell"), hud: $("hud"),
    hudLevel: $("hudLevel"), hpFill: $("hpFill"), hpText: $("hpText"),
    shieldChip: $("shieldChip"), shieldCount: $("shieldCount"),
    objectiveText: $("objectiveText"), chestCount: $("chestCount"), chestFill: $("chestFill"),
    weaponIcon: $("weaponIcon"), weaponName: $("weaponName"), weaponMeta: $("weaponMeta"),
    scoreText: $("scoreText"), streakChip: $("streakChip"), streakText: $("streakText"),
    soundBtn: $("soundBtn"), pauseBtn: $("pauseBtn"),
    touchControls: $("touchControls"), touchOpen: $("touchOpen"), touchFire: $("touchFire"),
    levelGrid: $("levelGrid"), selectedSummary: $("selectedSummary"), startBtn: $("startBtn"),
    mathOverlay: $("mathOverlay"), mathPanel: $("mathPanel"), mathLevelChip: $("mathLevelChip"),
    mathSeconds: $("mathSeconds"), mathTimer: $("mathTimer"), mathTimerFill: $("mathTimerFill"),
    mathQuestion: $("mathQuestion"), mathHint: $("mathHint"), mathHintBtn: $("mathHintBtn"),
    mathAnswers: $("mathAnswers"), mathFeedback: $("mathFeedback"),
    pauseOverlay: $("pauseOverlay"), resumeBtn: $("resumeBtn"), restartBtn: $("restartBtn"), menuBtn: $("menuBtn"),
    endOverlay: $("endOverlay"), endIcon: $("endIcon"), endEyebrow: $("endEyebrow"),
    endTitle: $("endTitle"), endSub: $("endSub"), endStats: $("endStats"), endScore: $("endScore"),
    retryBtn: $("retryBtn"), endMenuBtn: $("endMenuBtn"),
    toastStack: $("toastStack"), rotateHint: $("rotateHint"),
    canvas: $("gameCanvas"), canvasFrame: $("canvasFrame")
  };

  function syncSoundButton() {
    const on = AudioFX.isEnabled();
    ui.soundBtn.textContent = on ? "🔊" : "🔇";
    ui.soundBtn.title = on ? "Vypnout zvuk" : "Zapnout zvuk";
    ui.soundBtn.setAttribute("aria-label", ui.soundBtn.title);
  }
  syncSoundButton();

  function toast(message, type, icon) {
    const el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    if (icon) {
      const ic = document.createElement("span");
      ic.className = "ticon";
      ic.textContent = icon;
      el.appendChild(ic);
    }
    const text = document.createElement("span");
    text.textContent = message;
    el.appendChild(text);
    ui.toastStack.appendChild(el);
    while (ui.toastStack.children.length > 4) ui.toastStack.firstElementChild.remove();
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 340);
    }, 2700);
  }
  function clearToasts() { ui.toastStack.innerHTML = ""; }

  /* ---------- výběr úrovně ---------- */
  let selectedLevelId = D.LEVELS.some((l) => l.id === Store.data.lastLevel)
    ? Store.data.lastLevel
    : "trida34";

  function buildLevelCards() {
    ui.levelGrid.innerHTML = "";
    D.LEVELS.forEach((level, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "level-card";
      card.dataset.id = level.id;
      card.style.setProperty("--card-color", level.color);
      card.style.setProperty("--card-glow", level.glow);
      const best = Store.best(level.id);
      const topics = level.topics.map((t) => `<li>${t}</li>`).join("");
      const dots = Array.from({ length: 6 }, (_, i) => `<i class="${i < level.difficulty ? "on" : ""}"></i>`).join("");
      card.innerHTML = `
        <span class="check">✓</span>
        <div class="level-top">
          <div class="level-icon">${level.icon}</div>
          <div>
            <p class="level-name">${level.grade}</p>
            <p class="level-age">${level.label} · ${level.age}</p>
          </div>
        </div>
        <ul class="level-topics">${topics}</ul>
        <div class="level-meta">
          <span class="enemies">👾 ${level.enemies} nepřátel</span>
          <span class="diff-dots" title="Obtížnost">${dots}</span>
        </div>
        <div class="best-score">${best ? "★ Rekord: " + formatScore.format(best) : ""}</div>
      `;
      card.addEventListener("click", () => {
        selectedLevelId = level.id;
        AudioFX.init();
        AudioFX.click();
        updateSelectionUI();
      });
      ui.levelGrid.appendChild(card);
    });
  }

  function selectedLevel() {
    return D.LEVELS.find((l) => l.id === selectedLevelId) || D.LEVELS[2];
  }

  function updateSelectionUI() {
    Array.from(ui.levelGrid.children).forEach((card) => {
      card.classList.toggle("selected", card.dataset.id === selectedLevelId);
    });
    const level = selectedLevel();
    ui.selectedSummary.innerHTML =
      `Vybráno: <b>${level.grade}</b><span class="sep">•</span>` +
      `${level.chests} truhel<span class="sep">•</span>${level.enemies} nepřátel<span class="sep">•</span>` +
      `${level.mathTime} s na příklad`;
    ui.startBtn.innerHTML = `Spustit hru <span>→</span>`;
    ui.startBtn.setAttribute("aria-label", `Spustit hru za ${level.grade}`);
  }

  buildLevelCards();
  updateSelectionUI();

  /* ---------- plátno ---------- */
  const canvas = ui.canvas;
  const ctx = canvas.getContext("2d");
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }
  resizeCanvas();

  /* ---------- vstup ---------- */
  const input = {
    dir: null,
    held: [],
    shoot: false,
    clear() {
      this.dir = null;
      this.held.length = 0;
      this.shoot = false;
    }
  };

  function setDirDown(name) {
    if (!input.held.includes(name)) input.held.push(name);
    input.dir = DIRS[name];
  }
  function setDirUp(name) {
    const i = input.held.indexOf(name);
    if (i >= 0) input.held.splice(i, 1);
    const last = input.held[input.held.length - 1];
    input.dir = last ? DIRS[last] : null;
  }

  /* ---------- start / menu ---------- */
  function resetStartScroll() {
    if (ui.startScreen) ui.startScreen.scrollTop = 0;
  }

  function beginSelected() {
    AudioFX.init();
    AudioFX.click();
    const level = selectedLevel();
    Store.data.lastLevel = level.id;
    Store.save();
    clearToasts();
    ui.startScreen.classList.add("hidden");
    ui.gameShell.classList.remove("hidden");
    ui.endOverlay.classList.add("hidden");
    ui.pauseOverlay.classList.add("hidden");
    game.start(level);
  }

  ui.startBtn.addEventListener("click", beginSelected);
  ui.soundBtn.addEventListener("click", () => {
    AudioFX.init();
    AudioFX.setEnabled(!AudioFX.isEnabled());
    syncSoundButton();
    if (AudioFX.isEnabled()) AudioFX.click();
  });

  /* ============================================================
     KRESLENÍ – pomocné funkce
     ============================================================ */
  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
    const num = parseInt(full, 16);
    return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
  }

  function hash2(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function glowBall(c, x, y, radius, color, alpha) {
    const g = c.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, hexToRgba(color, alpha));
    g.addColorStop(0.45, hexToRgba(color, alpha * 0.32));
    g.addColorStop(1, hexToRgba(color, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, radius, 0, TAU);
    c.fill();
  }

  /* ============================================================
     STATICKÉ VYKRESLENÍ BLUDIŠTĚ
     ============================================================ */
  function buildMazeCanvas(maze, dpr) {
    const cnv = document.createElement("canvas");
    cnv.width = Math.round(W * dpr);
    cnv.height = Math.round(H * dpr);
    const c = cnv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#081120");
    bg.addColorStop(0.55, "#060d19");
    bg.addColorStop(1, "#050a14");
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    // podlaha
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (maze.isWall(x, y)) continue;
        const h = hash2(x, y);
        c.fillStyle = (x + y) % 2 === 0 ? "rgba(11,22,39,.55)" : "rgba(8,17,31,.55)";
        c.fillRect(x * TILE, y * TILE, TILE, TILE);
        c.strokeStyle = "rgba(84,130,190,.035)";
        c.lineWidth = 1;
        c.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
        if (h > 0.86) {
          c.fillStyle = "rgba(120,170,240,.13)";
          c.beginPath();
          c.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 1, 0, TAU);
          c.fill();
        }
      }
    }

    // startovní místnost – jemný kruh
    const sx = (maze.spawn.x + 0.5) * TILE;
    const sy = (maze.spawn.y + 0.5) * TILE;
    const startGlow = c.createRadialGradient(sx, sy, 2, sx, sy, TILE * 1.55);
    startGlow.addColorStop(0, "rgba(56,232,255,.09)");
    startGlow.addColorStop(1, "rgba(56,232,255,0)");
    c.fillStyle = startGlow;
    c.fillRect(sx - TILE * 2, sy - TILE * 2, TILE * 4, TILE * 4);
    c.strokeStyle = "rgba(56,232,255,.14)";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(sx, sy, TILE * 0.95, 0, TAU);
    c.stroke();

    // zdi
    const wallGrad = c.createLinearGradient(0, 0, 0, H);
    wallGrad.addColorStop(0, "#142b48");
    wallGrad.addColorStop(0.5, "#0e2038");
    wallGrad.addColorStop(1, "#0a1729");
    c.save();
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!maze.isWall(x, y)) continue;
        const px = x * TILE, py = y * TILE;
        c.save();
        c.shadowColor = "rgba(37,99,160,.22)";
        c.shadowBlur = 7;
        c.fillStyle = wallGrad;
        roundRect(c, px + 1.2, py + 1.2, TILE - 2.4, TILE - 2.4, 5.5);
        c.fill();
        c.restore();

        c.strokeStyle = "rgba(126,170,235,.075)";
        c.lineWidth = 1;
        roundRect(c, px + 1.7, py + 1.7, TILE - 3.4, TILE - 3.4, 5);
        c.stroke();

        // světlé hrany směrem do chodeb
        const top = !maze.isWall(x, y - 1), bottom = !maze.isWall(x, y + 1);
        const left = !maze.isWall(x - 1, y), right = !maze.isWall(x + 1, y);
        c.lineWidth = 1.7;
        c.shadowBlur = 5;
        if (top) {
          c.strokeStyle = "rgba(56,232,255,.30)";
          c.shadowColor = "rgba(56,232,255,.45)";
          c.beginPath(); c.moveTo(px + 4, py + 2.2); c.lineTo(px + TILE - 4, py + 2.2); c.stroke();
        }
        if (bottom) {
          c.strokeStyle = "rgba(167,139,250,.22)";
          c.shadowColor = "rgba(167,139,250,.4)";
          c.beginPath(); c.moveTo(px + 4, py + TILE - 2.2); c.lineTo(px + TILE - 4, py + TILE - 2.2); c.stroke();
        }
        if (left) {
          c.strokeStyle = "rgba(56,232,255,.18)";
          c.shadowColor = "rgba(56,232,255,.35)";
          c.beginPath(); c.moveTo(px + 2.2, py + 4); c.lineTo(px + 2.2, py + TILE - 4); c.stroke();
        }
        if (right) {
          c.strokeStyle = "rgba(167,139,250,.16)";
          c.shadowColor = "rgba(167,139,250,.3)";
          c.beginPath(); c.moveTo(px + TILE - 2.2, py + 4); c.lineTo(px + TILE - 2.2, py + TILE - 4); c.stroke();
        }
        c.shadowBlur = 0;
      }
    }
    c.restore();

    // dekorace – krystaly a runy
    const runes = ["π", "√", "∑", "×", "÷", "∞", "Δ"];
    for (const d of maze.decor) {
      const px = (d.x + 0.5) * TILE, py = (d.y + 0.5) * TILE;
      if (d.type === "crystal") {
        const col = d.hue < 0.5 ? "#38e8ff" : "#a78bfa";
        c.save();
        c.translate(px, py);
        c.rotate(Math.PI / 4);
        c.fillStyle = hexToRgba(col, 0.3);
        c.shadowColor = col;
        c.shadowBlur = 9;
        c.fillRect(-3, -3, 6, 6);
        c.fillStyle = hexToRgba(col, 0.75);
        c.fillRect(-1.5, -1.5, 3, 3);
        c.restore();
      } else {
        c.save();
        c.globalAlpha = 0.16;
        c.fillStyle = d.hue < 0.5 ? "#7dd3fc" : "#c4b5fd";
        c.font = "700 13px 'Segoe UI', sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(runes[Math.floor(d.hue * runes.length) % runes.length], px, py + 1);
        c.restore();
      }
    }

    // jemná mřížka přes zdi pro texturu
    c.save();
    c.globalAlpha = 0.12;
    c.strokeStyle = "#5b8bc4";
    c.lineWidth = 0.6;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!maze.isWall(x, y)) continue;
        if (hash2(x + 9, y + 3) > 0.65) {
          c.beginPath();
          c.moveTo(x * TILE + 8, y * TILE + TILE - 8);
          c.lineTo(x * TILE + TILE - 8, y * TILE + 8);
          c.stroke();
        }
      }
    }
    c.restore();

    // vinětace
    const vig = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9);
    vig.addColorStop(0, "rgba(2,5,12,0)");
    vig.addColorStop(1, "rgba(2,5,12,.55)");
    c.fillStyle = vig;
    c.fillRect(0, 0, W, H);

    return cnv;
  }

  /* ============================================================
     HRA
     ============================================================ */
  class Game {
    constructor() {
      this.state = "menu";
      this.runId = 0;
      this.t = 0;
      this.level = null;
      this.maze = null;
      this.mazeCanvas = null;
      this.player = null;
      this.weapon = null;
      this.chests = [];
      this.enemies = [];
      this.projectiles = [];
      this.pickups = [];
      this.particles = [];
      this.floaters = [];
      this.shockwaves = [];
      this.ambient = [];
      this.respawnQueue = [];
      this.portal = null;
      this.math = null;
      this.nearChest = null;
      this.score = 0;
      this.chestsOpened = 0;
      this.kills = 0;
      this.correct = 0;
      this.wrong = 0;
      this.streak = 0;
      this.elapsed = 0;
      this.shake = 0;
      this.hudCache = {};
    }

    start(level) {
      this.runId++;
      const run = this.runId;
      this.level = level;
      this.state = "playing";
      this.maze = MB.generate(COLS, ROWS, level.chests);
      this.mazeCanvas = buildMazeCanvas(this.maze, DPR);

      const spawnX = MB.toPx(this.maze.spawn.x);
      const spawnY = MB.toPx(this.maze.spawn.y);
      this.player = {
        x: spawnX, y: spawnY, r: D.PLAYER_RADIUS,
        speed: D.PLAYER_SPEED, dir: { x: 1, y: 0 },
        hp: level.maxHp, maxHp: level.maxHp,
        invuln: 1.5, fireCd: 0.25, shield: 0, flash: 0,
        lastDamage: 0, moving: false, magnet: 0
      };
      this.weapon = Object.assign({}, D.STARTING_WEAPON, { level: 1 });
      this.score = 0;
      this.chestsOpened = 0;
      this.kills = 0;
      this.correct = 0;
      this.wrong = 0;
      this.streak = 0;
      this.elapsed = 0;
      this.shake = 0;
      this.math = null;
      this.nearChest = null;
      this.enemies = [];
      this.projectiles = [];
      this.pickups = [];
      this.particles = [];
      this.floaters = [];
      this.shockwaves = [];
      this.respawnQueue = [];
      this.hudCache = {};

      this.chests = this.maze.chestSpots.map((tile, i) => ({
        x: MB.toPx(tile.x), y: MB.toPx(tile.y),
        opened: false, lockedUntil: 0, openAt: 0, phase: i * 1.7
      }));
      this.portal = {
        x: MB.toPx(this.maze.exit.x),
        y: MB.toPx(this.maze.exit.y),
        active: false, pulse: 0
      };

      this.makeAmbient();
      for (let i = 0; i < level.enemies; i++) {
        this.spawnEnemy(level.enemyMix[i % level.enemyMix.length], false);
      }

      ui.hudLevel.textContent = level.grade;
      ui.startScreen.classList.add("hidden");
      ui.mathOverlay.classList.add("hidden");
      ui.pauseOverlay.classList.add("hidden");
      ui.endOverlay.classList.add("hidden");
      ui.mathPanel.classList.remove("success", "failed", "shake");
      ui.gameShell.classList.remove("hidden");
      const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      ui.touchControls.classList.toggle("hidden", !(coarse || navigator.maxTouchPoints > 0));
      input.clear();
      this.updateHUD(true);

      setTimeout(() => {
        if (this.runId === run && this.state === "playing") {
          toast("Najdi truhlu, stiskni E a vyřeš příklad.", "info", "🧰");
        }
      }, 600);
      setTimeout(() => {
        if (this.runId === run && this.state === "playing") {
          toast("Pozor na příšery – střílej mezerníkem.", "danger", "👾");
        }
      }, 4800);
    }

    makeAmbient() {
      this.ambient = [];
      for (let i = 0; i < 46; i++) {
        this.ambient.push({
          x: rnd(0, W), y: rnd(0, H), r: rnd(0.5, 1.7),
          phase: rnd(0, TAU), speed: rnd(0.15, 0.5),
          color: Math.random() < 0.6 ? "#38e8ff" : "#a78bfa"
        });
      }
    }

    /* ---------- pomocné ---------- */
    circleHitsWall(x, y, radius) {
      const minX = Math.floor((x - radius) / TILE);
      const maxX = Math.floor((x + radius) / TILE);
      const minY = Math.floor((y - radius) / TILE);
      const maxY = Math.floor((y + radius) / TILE);
      for (let ty = minY; ty <= maxY; ty++) {
        for (let tx = minX; tx <= maxX; tx++) {
          if (!this.maze.isWall(tx, ty)) continue;
          const nx = clamp(x, tx * TILE, tx * TILE + TILE);
          const ny = clamp(y, ty * TILE, ty * TILE + TILE);
          const dx = x - nx, dy = y - ny;
          if (dx * dx + dy * dy < radius * radius - 0.001) return true;
        }
      }
      return false;
    }

    canStand(x, y, radius) {
      if (x - radius < 2 || y - radius < 2 || x + radius > W - 2 || y + radius > H - 2) return false;
      return !this.circleHitsWall(x, y, radius);
    }

    pickEnemySpawn(minDistance) {
      const p = this.player;
      let options = this.maze.enemySpawns.filter((t) => {
        const x = MB.toPx(t.x), y = MB.toPx(t.y);
        return dist2(x, y, p.x, p.y) > minDistance * minDistance;
      });
      if (!options.length) {
        options = this.maze.enemySpawns.slice().sort((a, b) => {
          const da = dist2(MB.toPx(a.x), MB.toPx(a.y), p.x, p.y);
          const db = dist2(MB.toPx(b.x), MB.toPx(b.y), p.x, p.y);
          return db - da;
        }).slice(0, 12);
      }
      return options.length ? pick(options) : this.maze.spawn;
    }

    spawnEnemy(typeId, withEffect) {
      const type = D.ENEMY_TYPES[typeId] || D.ENEMY_TYPES.slime;
      const tile = this.pickEnemySpawn(withEffect ? 250 : 210);
      const x = MB.toPx(tile.x), y = MB.toPx(tile.y);
      const e = {
        type, x, y, r: type.radius,
        hp: type.hp, maxHp: type.hp,
        baseSpeed: type.speed * this.level.enemySpeed,
        speed: type.speed * this.level.enemySpeed,
        damage: Math.max(3, Math.round(type.damage * this.level.enemyDamage)),
        score: type.score,
        target: null, dir: { x: 0, y: 1 },
        slowTimer: 0, hitFlash: 0, spawnGrace: withEffect ? 1.1 : 0.75,
        wobble: rnd(0, TAU), dead: false
      };
      this.enemies.push(e);
      if (withEffect) {
        this.spawnBurst(x, y, type.color, 12, 90, 2);
        this.addShockwave(x, y, 26, type.color);
      }
      return e;
    }

    randomWeaponId() {
      return pick(Object.keys(D.WEAPONS));
    }

    findDropPosition(x, y) {
      for (let i = 0; i < 22; i++) {
        const angle = rnd(0, TAU), radius = rnd(10, 34);
        const px = clamp(x + Math.cos(angle) * radius, 18, W - 18);
        const py = clamp(y + Math.sin(angle) * radius, 18, H - 18);
        if (!this.circleHitsWall(px, py, 7)) return { x: px, y: py };
      }
      return { x, y };
    }

    addPickup(kind, x, y, weaponId, amount) {
      const pos = this.findDropPosition(x, y);
      this.pickups.push({
        kind, x: pos.x, y: pos.y,
        weaponId: weaponId || null,
        amount: amount || 0,
        phase: rnd(0, TAU),
        bornAt: this.elapsed,
        spawnDelay: 0.65
      });
      this.spawnBurst(pos.x, pos.y, kind === "weapon" ? D.WEAPONS[weaponId].color : D.LOOT_META[kind].color, 8, 60, 1.6);
    }

    addShockwave(x, y, radius, color) {
      this.shockwaves.push({ x, y, radius, color, life: 0.55, maxLife: 0.55 });
    }

    spawnBurst(x, y, color, count, power, size) {
      const n = count || 10;
      for (let i = 0; i < n; i++) {
        const a = rnd(0, TAU), sp = rnd((power || 100) * 0.25, power || 100);
        this.particles.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: rnd(0.25, 0.7), maxLife: 0.7,
          size: rnd(1, size || 2.6), color
        });
      }
    }

    addFloater(x, y, text, color) {
      this.floaters.push({ x, y, text, color: color || "#fff", life: 0.9, maxLife: 0.9 });
    }

    /* ---------- aktualizace ---------- */
    tick(dt) {
      this.t += dt;
      if (this.state === "playing") {
        this.elapsed += dt;
        this.shake = Math.max(0, this.shake - dt * 26);
        this.updatePlayer(dt);
        this.updateEnemies(dt);
        if (this.state !== "playing") return;
        this.updateProjectiles(dt);
        this.updatePickups(dt);
        this.updateChests(dt);
        this.updatePortal(dt);
        this.updateEffects(dt);
        this.updateRespawns(dt);
        this.cleanup();
        this.updateHUD();
      } else if (this.state === "math") {
        this.updateMath(dt);
      }
    }

    updatePlayer(dt) {
      const p = this.player;
      p.invuln = Math.max(0, p.invuln - dt);
      p.flash = Math.max(0, p.flash - dt * 3);
      p.fireCd = Math.max(0, p.fireCd - dt);
      if (input.shoot) this.tryShoot();

      const desired = input.dir;
      if (desired) {
        if (desired.x !== p.dir.x || desired.y !== p.dir.y) {
          if (this.canStand(p.x + desired.x * 5, p.y + desired.y * 5, p.r)) {
            p.dir = { x: desired.x, y: desired.y };
          }
        }
        const step = p.speed * dt;
        const nx = p.x + p.dir.x * step;
        const ny = p.y + p.dir.y * step;
        if (this.canStand(nx, ny, p.r)) {
          p.x = nx; p.y = ny; p.moving = true;
        } else {
          p.moving = false;
        }
      } else {
        p.moving = false;
      }

      // pomalé samoléčení do 50 % života
      if (p.hp > 0 && p.hp < p.maxHp * 0.5 && this.elapsed - p.lastDamage > 9) {
        p.hp = Math.min(p.maxHp * 0.5, p.hp + dt * 2.2);
      }
    }

    findAimAngle() {
      const p = this.player;
      let best = null, bestD = Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = dist2(p.x, p.y, e.x, e.y);
        if (d < 360 * 360 && d < bestD && this.maze.hasLineOfSight(p.x, p.y, e.x, e.y)) {
          best = e; bestD = d;
        }
      }
      if (best) return Math.atan2(best.y - p.y, best.x - p.x);
      return Math.atan2(p.dir.y, p.dir.x);
    }

    tryShoot() {
      const p = this.player;
      if (this.state !== "playing" || p.fireCd > 0) return;
      const w = this.weapon;
      p.fireCd = w.cooldown;
      const aim = this.findAimAngle();
      const count = w.count || 1;
      const spread = w.spread || 0;
      for (let i = 0; i < count; i++) {
        const offset = count > 1 ? (i - (count - 1) / 2) * spread : 0;
        const angle = aim + offset;
        this.projectiles.push({
          x: p.x + Math.cos(angle) * (p.r + 4),
          y: p.y + Math.sin(angle) * (p.r + 4),
          vx: Math.cos(angle), vy: Math.sin(angle),
          speed: w.speed, r: w.radius || 5,
          damage: w.damage, color: w.color, slow: w.slow || 0,
          explode: w.explode || null, life: 1.5, dead: false
        });
      }
      this.spawnBurst(p.x + Math.cos(aim) * 14, p.y + Math.sin(aim) * 14, w.color, 4, 55, 1.8);
      AudioFX.shoot();
    }

    hurtPlayer(damage, source) {
      const p = this.player;
      if (this.state !== "playing" || p.invuln > 0) return;
      if (p.shield > 0) {
        p.shield--;
        p.invuln = 1;
        this.addShockwave(p.x, p.y, 34, "#38e8ff");
        this.spawnBurst(p.x, p.y, "#38e8ff", 16, 130, 2.2);
        this.addFloater(p.x, p.y - 18, "ŠTÍT!", "#a9f4ff");
        AudioFX.shieldBreak();
        this.shake = Math.max(this.shake, 5);
        this.updateHUD(true);
        return;
      }
      const dmg = Math.max(1, Math.round(damage));
      p.hp = Math.max(0, p.hp - dmg);
      p.invuln = 1.2;
      p.flash = 1;
      p.lastDamage = this.elapsed;
      this.shake = Math.max(this.shake, 8);
      this.spawnBurst(p.x, p.y, "#fb7185", 14, 120, 2.4);
      this.addFloater(p.x, p.y - 16, "−" + dmg, "#ff9aa8");
      AudioFX.hurt();
      if (source) {
        const angle = Math.atan2(p.y - source.y, p.x - source.x);
        for (let i = 0; i < 8; i++) {
          const nx = p.x + Math.cos(angle) * 4;
          const ny = p.y + Math.sin(angle) * 4;
          if (!this.canStand(nx, ny, p.r)) break;
          p.x = nx; p.y = ny;
        }
      }
      this.updateHUD(true);
      if (p.hp <= 0) this.endGame(false);
    }

    updateEnemies(dt) {
      const p = this.player;
      for (const e of this.enemies) {
        if (e.dead) continue;
        e.hitFlash = Math.max(0, e.hitFlash - dt);
        e.slowTimer = Math.max(0, e.slowTimer - dt);
        if (e.spawnGrace > 0) {
          e.spawnGrace -= dt;
          continue;
        }
        const et = { x: Math.floor(e.x / TILE), y: Math.floor(e.y / TILE) };
        const pt = { x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE) };
        if (!e.target) this.chooseEnemyStep(e, et, pt);
        if (e.target) {
          const tx = MB.toPx(e.target.x), ty = MB.toPx(e.target.y);
          const dx = tx - e.x, dy = ty - e.y;
          const d = Math.hypot(dx, dy);
          const speed = e.baseSpeed * (e.slowTimer > 0 ? 0.45 : 1);
          if (d < 2) {
            e.x = tx; e.y = ty; e.target = null;
          } else {
            const step = Math.min(speed * dt, d);
            e.x += (dx / d) * step;
            e.y += (dy / d) * step;
            e.dir = { x: dx / d, y: dy / d };
          }
        }
        const reach = e.r + p.r + 1;
        if (dist2(e.x, e.y, p.x, p.y) < reach * reach) {
          this.hurtPlayer(e.damage, e);
          if (this.state !== "playing") return;
        }
      }
    }

    chooseEnemyStep(e, et, pt) {
      const tileDist = Math.abs(et.x - pt.x) + Math.abs(et.y - pt.y);
      const behavior = e.type.behavior;
      let chase = false;
      if (behavior === "hunt") chase = true;
      else if (behavior === "chase") chase = tileDist <= e.type.aggro;
      else if (behavior === "erratic") chase = tileDist <= e.type.aggro && Math.random() < 0.58;
      else chase = tileDist <= e.type.aggro && Math.random() < 0.5;

      if (chase) {
        const path = this.maze.findPath(et.x, et.y, pt.x, pt.y);
        if (path && path.length) {
          e.target = path[0];
          return;
        }
      }
      const neighbors = this.maze.neighbors(et.x, et.y);
      if (neighbors.length) e.target = pick(neighbors);
    }

    updateProjectiles(dt) {
      for (const pr of this.projectiles) {
        if (pr.dead) continue;
        pr.life -= dt;
        if (pr.life <= 0) { pr.dead = true; continue; }
        let remaining = pr.speed * dt;
        while (remaining > 0 && !pr.dead) {
          const step = Math.min(6, remaining);
          remaining -= step;
          pr.x += pr.vx * step;
          pr.y += pr.vy * step;
          if (this.circleHitsWall(pr.x, pr.y, pr.r * 0.65)) {
            pr.dead = true;
            this.spawnBurst(pr.x, pr.y, pr.color, 3, 45, 1.4);
            break;
          }
          let hit = null;
          for (const e of this.enemies) {
            if (e.dead || e.spawnGrace > 0) continue;
            const rr = e.r + pr.r;
            if (dist2(pr.x, pr.y, e.x, e.y) < rr * rr) { hit = e; break; }
          }
          if (hit) {
            this.damageEnemy(hit, pr.damage, pr);
            if (pr.explode) this.explodeAt(pr.x, pr.y, pr.explode);
            pr.dead = true;
            this.spawnBurst(pr.x, pr.y, pr.color, 5, 70, 1.6);
            break;
          }
          if (pr.x < -10 || pr.y < -10 || pr.x > W + 10 || pr.y > H + 10) pr.dead = true;
        }
      }
      this.projectiles = this.projectiles.filter((pr) => !pr.dead);
    }

    damageEnemy(enemy, damage, projectile) {
      if (!enemy || enemy.dead) return;
      enemy.hp -= damage;
      enemy.hitFlash = 0.16;
      if (projectile && projectile.slow) enemy.slowTimer = Math.max(enemy.slowTimer, projectile.slow);
      this.addFloater(enemy.x, enemy.y - enemy.r - 4, String(Math.round(damage)), "#ffe9a8");
      this.spawnBurst(enemy.x, enemy.y, enemy.type.color, 4, 55, 1.5);
      if (enemy.hp <= 0) {
        this.killEnemy(enemy);
      } else {
        AudioFX.hit();
      }
    }

    killEnemy(enemy) {
      if (enemy.dead) return;
      enemy.dead = true;
      this.kills++;
      const gain = Math.round(enemy.type.score * (1 + this.level.mathTier * 0.06));
      this.score += gain;
      this.addFloater(enemy.x, enemy.y - enemy.r - 9, "+" + gain, "#ffd166");
      this.spawnBurst(enemy.x, enemy.y, enemy.type.color, 20, 160, 2.4);
      this.addShockwave(enemy.x, enemy.y, 30, enemy.type.color);
      AudioFX.enemyDown();
      if (Math.random() < 0.18) this.addPickup("heal", enemy.x, enemy.y, null, 12);
      this.respawnQueue.push({ at: this.elapsed + rnd(7, 11) });
    }

    explodeAt(x, y, explode) {
      this.addShockwave(x, y, explode.radius, "#c4b5fd");
      this.spawnBurst(x, y, "#c4b5fd", 12, 120, 2);
      for (const e of this.enemies) {
        if (e.dead) continue;
        const rr = explode.radius + e.r;
        if (dist2(x, y, e.x, e.y) < rr * rr) this.damageEnemy(e, explode.damage, null);
      }
    }

    updatePickups(dt) {
      const p = this.player;
      const reach = p.r + 17 + p.magnet;
      const reach2 = reach * reach;
      for (const item of this.pickups) {
        if (item.collected) continue;
        item.phase += dt * 2.4;
        if (item.spawnDelay > 0) {
          item.spawnDelay -= dt;
          continue;
        }
        if (dist2(item.x, item.y, p.x, p.y) < reach2) {
          item.collected = true;
          this.collectPickup(item);
        }
      }
      this.pickups = this.pickups.filter((i) => !i.collected);
    }

    collectPickup(item) {
      const p = this.player;
      const meta = item.kind === "weapon"
        ? { name: D.WEAPONS[item.weaponId].name, icon: D.WEAPONS[item.weaponId].icon, color: D.WEAPONS[item.weaponId].color }
        : D.LOOT_META[item.kind];
      if (!meta) return;
      this.spawnBurst(item.x, item.y, meta.color, 12, 95, 2);
      this.addShockwave(item.x, item.y, 22, meta.color);
      AudioFX.pickup();

      if (item.kind === "weapon") {
        const tpl = D.WEAPONS[item.weaponId];
        if (!tpl) return;
        if (this.weapon.id === tpl.id) {
          this.weapon.level += 1;
          this.weapon.damage = Math.round(this.weapon.damage * 1.22);
          this.weapon.cooldown = Math.max(0.12, this.weapon.cooldown * 0.93);
          toast(`Vylepšeno: ${tpl.name} Lv. ${this.weapon.level}`, "gold", tpl.icon);
        } else {
          this.weapon = Object.assign({}, tpl, { level: 1 });
          toast(`Nová zbraň: ${tpl.name}`, "gold", tpl.icon);
        }
        AudioFX.weapon();
        this.addFloater(p.x, p.y - 20, tpl.name, "#ffe9a8");
        this.updateHUD(true);
        return;
      }

      if (item.kind === "heal") {
        const amount = item.amount || 30;
        const real = Math.min(amount, Math.max(0, p.maxHp - p.hp));
        if (real > 0) {
          p.hp = Math.min(p.maxHp, p.hp + amount);
          this.addFloater(p.x, p.y - 20, "+" + Math.round(real) + " HP", "#86efac");
          toast(`+${Math.round(real)} HP`, "success", "❤️");
          AudioFX.heal();
        } else {
          this.score += 20;
          toast("Zdraví je plné – +20 bodů", "gold", "❤️");
        }
      } else if (item.kind === "maxhp") {
        p.maxHp += 20;
        p.hp = Math.min(p.maxHp, p.hp + 20);
        this.addFloater(p.x, p.y - 20, "+20 MAX HP", "#f9a8d4");
        toast("Srdce obra: +20 max. HP", "success", "💖");
        AudioFX.heal();
      } else if (item.kind === "shield") {
        if (p.shield < 2) {
          p.shield++;
          this.addFloater(p.x, p.y - 20, "ŠTÍT +1", "#a9f4ff");
          toast("Ochranný štít +1", "success", "🛡️");
        } else {
          this.score += 40;
          toast("Štít je plný – +40 bodů", "gold", "🛡️");
        }
      } else if (item.kind === "speed") {
        if (p.speed < 230) {
          p.speed = Math.min(230, p.speed * 1.07);
          this.addFloater(p.x, p.y - 20, "RYCHLEJI!", "#bef264");
          toast("Křídlové boty: +7 % rychlosti", "success", "👟");
        } else {
          this.score += 40;
          toast("Maximální rychlost – +40 bodů", "gold", "👟");
        }
      } else if (item.kind === "magnet") {
        if (p.magnet < 90) {
          p.magnet = Math.min(90, p.magnet + 35);
          this.addFloater(p.x, p.y - 20, "MAGNET", "#d8b4fe");
          toast("Magnet na poklady: větší dosah", "success", "🧲");
        } else {
          this.score += 40;
          toast("Magnet je plný – +40 bodů", "gold", "🧲");
        }
      } else if (item.kind === "gem") {
        this.score += 75;
        this.addFloater(p.x, p.y - 20, "+75", "#fde047");
        toast("Zlatý drahokam +75 bodů", "gold", "💎");
      }
      this.updateHUD(true);
    }

    updateChests() {
      this.nearChest = null;
      if (this.state !== "playing") return;
      let best = Infinity;
      const reach = TILE * 1.65;
      for (const c of this.chests) {
        if (c.opened) continue;
        const d = dist2(c.x, c.y, this.player.x, this.player.y);
        if (d < reach * reach && d < best) {
          best = d;
          this.nearChest = c;
        }
      }
    }

    interact() {
      if (this.state !== "playing") return;
      const chest = this.nearChest;
      if (!chest) return;
      if (this.elapsed < chest.lockedUntil) {
        const left = Math.ceil(chest.lockedUntil - this.elapsed);
        toast(`Truhla je zamčená ještě ${left} s.`, "danger", "🔒");
        AudioFX.wrong();
        return;
      }
      this.openMath(chest);
    }

    activatePortal() {
      if (!this.portal || this.portal.active) return;
      this.portal.active = true;
      this.addShockwave(this.portal.x, this.portal.y, 90, "#a78bfa");
      this.spawnBurst(this.portal.x, this.portal.y, "#a78bfa", 28, 190, 2.6);
      this.spawnBurst(this.portal.x, this.portal.y, "#38e8ff", 20, 150, 2);
      this.shake = Math.max(this.shake, 9);
      AudioFX.portal();
      toast("Všechny truhly jsou otevřené! Najdi portál.", "gold", "🌀");
    }

    updatePortal(dt) {
      if (!this.portal) return;
      if (!this.portal.active) return;
      this.portal.pulse += dt;
      if (Math.random() < dt * 10) {
        const a = rnd(0, TAU), r = rnd(8, 30);
        this.particles.push({
          x: this.portal.x + Math.cos(a) * r, y: this.portal.y + Math.sin(a) * r,
          vx: Math.cos(a + 1.4) * 14, vy: Math.sin(a + 1.4) * 14,
          life: rnd(0.6, 1.3), maxLife: 1.3, size: rnd(1, 2.4),
          color: Math.random() < 0.5 ? "#a78bfa" : "#38e8ff"
        });
      }
      if (dist2(this.portal.x, this.portal.y, this.player.x, this.player.y) < 26 * 26) {
        this.endGame(true);
      }
    }

    updateEffects(dt) {
      for (const pt of this.particles) {
        if (pt.life <= 0) continue;
        pt.life -= dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= Math.max(0, 1 - 2.8 * dt);
        pt.vy *= Math.max(0, 1 - 2.8 * dt);
      }
      this.particles = this.particles.filter((pt) => pt.life > 0);

      for (const f of this.floaters) {
        f.life -= dt;
        f.y -= 24 * dt;
      }
      this.floaters = this.floaters.filter((f) => f.life > 0);

      for (const s of this.shockwaves) s.life -= dt;
      this.shockwaves = this.shockwaves.filter((s) => s.life > 0);
    }

    updateRespawns() {
      if (!this.respawnQueue.length) return;
      let current = this.enemies.filter((e) => !e.dead).length;
      const due = this.respawnQueue.filter((r) => r.at <= this.elapsed);
      for (const entry of due) {
        if (current >= this.level.enemies) break;
        this.spawnEnemy(pick(this.level.enemyMix), true);
        current++;
      }
      this.respawnQueue = this.respawnQueue.filter((r) => r.at > this.elapsed);
    }

    cleanup() {
      this.enemies = this.enemies.filter((e) => !e.dead);
    }

    /* ---------- truhly, matematika ---------- */
    openMath(chest) {
      if (this.state !== "playing" || !chest || chest.opened) return;
      this.state = "math";
      input.clear();
      let question;
      try {
        question = QE.create(this.level);
      } catch (e) {
        console.error(e);
        question = { text: "2 + 2 = ?", answer: "4", choices: ["4", "3", "5", "6"], hint: "Sečti obě čísla." };
      }
      this.math = {
        chest, question,
        timeLeft: this.level.mathTime,
        initialTime: this.level.mathTime,
        solved: false, failed: false,
        closeTimer: 0, hintUsed: false, gain: 0
      };
      ui.mathPanel.classList.remove("success", "failed", "shake");
      ui.mathLevelChip.textContent = this.level.grade;
      ui.mathHint.classList.add("hidden");
      ui.mathHint.textContent = "";
      ui.mathHintBtn.disabled = false;
      ui.mathFeedback.className = "math-feedback";
      ui.mathFeedback.textContent = "Vyber správnou odpověď.";
      ui.mathQuestion.textContent = question.text;
      ui.mathQuestion.style.fontSize = question.text.length > 42
        ? "clamp(19px,3.1vw,28px)"
        : question.text.length > 26
          ? "clamp(23px,3.9vw,36px)"
          : "";
      ui.mathAnswers.innerHTML = "";
      question.choices.forEach((choice, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "answer-btn";
        const label = document.createElement("span");
        label.textContent = choice;
        const key = document.createElement("span");
        key.className = "key";
        key.textContent = String(index + 1);
        btn.appendChild(label);
        btn.appendChild(key);
        btn.addEventListener("click", () => this.answerMath(index));
        ui.mathAnswers.appendChild(btn);
      });
      ui.mathOverlay.classList.remove("hidden");
      this.updateMathTimerUI();
      AudioFX.pickup();
      const first = ui.mathAnswers.querySelector(".answer-btn");
      if (first) first.focus({ preventScroll: true });
    }

    setMathFeedback(text, type) {
      ui.mathFeedback.className = "math-feedback" + (type ? " " + type : "");
      ui.mathFeedback.textContent = text;
    }

    updateMathTimerUI() {
      if (!this.math) return;
      const m = this.math;
      const ratio = clamp(m.timeLeft / m.initialTime, 0, 1);
      ui.mathTimerFill.style.width = (ratio * 100).toFixed(1) + "%";
      ui.mathSeconds.textContent = String(Math.max(0, Math.ceil(m.timeLeft)));
      const warn = m.timeLeft <= 6;
      ui.mathTimer.classList.toggle("warn", warn);
      ui.mathTimerFill.classList.toggle("warn", warn);
      if (!m.solved && !m.failed) {
        ui.mathHintBtn.disabled = m.hintUsed || m.timeLeft <= 5.5;
      }
    }

    answerMath(index) {
      if (this.state !== "math" || !this.math) return;
      const m = this.math;
      if (m.solved || m.failed) return;
      const buttons = Array.from(ui.mathAnswers.querySelectorAll(".answer-btn"));
      const btn = buttons[index];
      if (!btn || btn.disabled) return;
      const chosen = m.question.choices[index];
      if (chosen === m.question.answer) {
        m.solved = true;
        this.correct++;
        this.streak++;
        const streakBonus = Math.max(0, this.streak - 1) * 30;
        const gain = Math.round((80 + Math.round(m.timeLeft * 6) + streakBonus) * (1 + this.level.mathTier * 0.06));
        m.gain = gain;
        m.closeTimer = 1.4;
        this.score += gain;
        buttons.forEach((b) => { b.disabled = true; });
        btn.classList.add("correct");
        ui.mathPanel.classList.add("success");
        this.setMathFeedback(`Správně! +${formatScore.format(gain)} bodů · série ×${this.streak}`, "good");
        AudioFX.correct();
        this.spawnBurst(m.chest.x, m.chest.y, "#34d399", 22, 155, 2.4);
        this.updateHUD(true);
      } else {
        btn.disabled = true;
        btn.classList.add("wrong");
        this.wrong++;
        this.streak = 0;
        m.timeLeft = Math.max(0, m.timeLeft - 4);
        this.setMathFeedback("Špatně! Ztrácíš 4 sekundy. Zkus jinou odpověď.", "bad");
        ui.mathPanel.classList.add("shake");
        setTimeout(() => ui.mathPanel.classList.remove("shake"), 420);
        AudioFX.wrong();
        this.updateMathTimerUI();
        this.updateHUD(true);
        if (m.timeLeft <= 0) {
          this.failMath("Čas vypršel! Truhla zůstala zamčená.");
        }
      }
    }

    useMathHint() {
      if (this.state !== "math" || !this.math) return;
      const m = this.math;
      if (m.hintUsed || m.solved || m.failed) return;
      m.hintUsed = true;
      m.timeLeft = Math.max(0, m.timeLeft - 5);
      ui.mathHint.textContent = m.question.hint;
      ui.mathHint.classList.remove("hidden");
      ui.mathHintBtn.disabled = true;
      this.setMathFeedback("Nápověda odečtena: −5 sekundy.", "tip");
      AudioFX.tick();
      this.updateMathTimerUI();
      if (m.timeLeft <= 0) {
        this.wrong++;
        this.failMath("Čas vypršel! Truhla zůstala zamčená.");
      }
    }

    updateMath(dt) {
      const m = this.math;
      if (!m) return;
      if (m.solved || m.failed) {
        m.closeTimer -= dt;
        if (m.closeTimer <= 0) this.finishMath();
        return;
      }
      const before = Math.ceil(m.timeLeft);
      m.timeLeft -= dt;
      const after = Math.ceil(m.timeLeft);
      if (after !== before && after > 0 && after <= 5) AudioFX.tick();
      this.updateMathTimerUI();
      if (m.timeLeft <= 0) {
        m.timeLeft = 0;
        this.wrong++;
        this.failMath("Čas vypršel! Truhla zůstala zamčená.");
      }
    }

    failMath(reason) {
      if (!this.math) return;
      const m = this.math;
      if (m.solved || m.failed) return;
      m.failed = true;
      m.closeTimer = 2.1;
      this.streak = 0;
      m.chest.lockedUntil = this.elapsed + 12;
      const buttons = Array.from(ui.mathAnswers.querySelectorAll(".answer-btn"));
      buttons.forEach((b) => {
        b.disabled = true;
        if (b.querySelector("span").textContent === m.question.answer) b.classList.add("correct");
      });
      ui.mathPanel.classList.add("failed");
      this.setMathFeedback(reason, "bad");
      this.updateMathTimerUI();
      AudioFX.wrong();
      this.updateHUD(true);
    }

    finishMath() {
      const m = this.math;
      if (!m) return;
      const chest = m.chest;
      ui.mathOverlay.classList.add("hidden");
      this.math = null;
      this.state = "playing";
      input.clear();
      if (m.solved) {
        chest.opened = true;
        chest.openAt = this.elapsed;
        this.chestsOpened++;
        this.spawnBurst(chest.x, chest.y, "#fbbf24", 26, 170, 2.6);
        this.addShockwave(chest.x, chest.y, 48, "#fbbf24");
        AudioFX.chest();
        toast(`Truhla otevřena! +${formatScore.format(m.gain)} bodů`, "gold", "🧰");
        this.dropChestLoot(chest, this.chestsOpened === 1);
        if (this.chestsOpened >= this.chests.length) this.activatePortal();
      } else {
        toast("Truhla je zamčená. Zkus to znovu za 12 s.", "danger", "🔒");
      }
      this.updateHUD(true);
    }

    dropChestLoot(chest, firstChest) {
      const items = [];
      if (firstChest || Math.random() < 0.33) {
        items.push({ kind: "weapon", weaponId: this.randomWeaponId() });
      }
      const lowHp = this.player.hp < this.player.maxHp * 0.55;
      let util;
      if (lowHp && Math.random() < 0.6) {
        util = "heal";
      } else {
        const roll = Math.random();
        if (roll < 0.2) util = "heal";
        else if (roll < 0.4) util = "shield";
        else if (roll < 0.54) util = "speed";
        else if (roll < 0.67) util = "maxhp";
        else if (roll < 0.8) util = "magnet";
        else util = "gem";
      }
      items.push({ kind: util });
      if (Math.random() < 0.32) items.push({ kind: Math.random() < 0.72 ? "gem" : "heal" });
      if (firstChest && !items.some((i) => i.kind === "heal")) items.push({ kind: "heal" });
      items.forEach((item, index) => {
        this.addPickup(item.kind, chest.x, chest.y, item.weaponId);
      });
    }

    /* ---------- HUD ---------- */
    updateHUD(force) {
      const p = this.player;
      if (!p) return;
      const cache = this.hudCache;
      const set = (el, key, value) => {
        if (force || cache[key] !== value) {
          el.textContent = value;
          cache[key] = value;
        }
      };
      const hp = Math.max(0, Math.ceil(p.hp));
      const hpPct = Math.round((p.hp / p.maxHp) * 100);
      set(ui.hpText, "hp", String(hp));
      const w = hpPct + "%";
      if (cache.hpWidth !== w) {
        ui.hpFill.style.width = w;
        cache.hpWidth = w;
      }
      const low = p.hp / p.maxHp < 0.3;
      if (cache.hpLow !== low) {
        ui.hpFill.classList.toggle("low", low);
        cache.hpLow = low;
      }
      set(ui.scoreText, "score", formatScore.format(this.score));
      set(ui.chestCount, "chestCount", `${this.chestsOpened} / ${this.chests.length}`);
      const chestPct = this.chests.length ? Math.round((this.chestsOpened / this.chests.length) * 100) : 0;
      const cw = chestPct + "%";
      if (cache.chestWidth !== cw) {
        ui.chestFill.style.width = cw;
        cache.chestWidth = cw;
      }
      const label = this.portal && this.portal.active ? "Portál aktivní – najdi východ! " : "Otevři truhly ";
      if (ui.objectiveText.firstChild && cache.objective !== label) {
        ui.objectiveText.firstChild.nodeValue = label;
        cache.objective = label;
      }
      set(ui.weaponIcon, "weaponIcon", this.weapon.icon);
      set(ui.weaponName, "weaponName", this.weapon.name);
      set(ui.weaponMeta, "weaponMeta", `DMG ${this.weapon.damage} · Lv. ${this.weapon.level}`);
      const showShield = p.shield > 0;
      if (cache.shieldShown !== showShield) {
        ui.shieldChip.classList.toggle("hidden", !showShield);
        cache.shieldShown = showShield;
      }
      set(ui.shieldCount, "shield", String(p.shield));
      const showStreak = this.streak >= 2;
      if (cache.streakShown !== showStreak) {
        ui.streakChip.classList.toggle("hidden", !showStreak);
        cache.streakShown = showStreak;
      }
      set(ui.streakText, "streak", "×" + this.streak);
      ui.hpText.title = `${hp} / ${Math.round(p.maxHp)} HP`;
    }

    /* ---------- pauza / konec ---------- */
    pause() {
      if (this.state !== "playing") return;
      this.state = "paused";
      input.clear();
      ui.pauseOverlay.classList.remove("hidden");
      AudioFX.click();
    }

    resume() {
      if (this.state !== "paused") return;
      this.state = "playing";
      input.clear();
      ui.pauseOverlay.classList.add("hidden");
      AudioFX.click();
    }

    togglePause() {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    }

    restart() {
      if (!this.level) return;
      ui.pauseOverlay.classList.add("hidden");
      ui.endOverlay.classList.add("hidden");
      clearToasts();
      this.start(this.level);
    }

    returnToMenu() {
      this.state = "menu";
      input.clear();
      ui.pauseOverlay.classList.add("hidden");
      ui.endOverlay.classList.add("hidden");
      ui.mathOverlay.classList.add("hidden");
      ui.gameShell.classList.add("hidden");
      ui.startScreen.classList.remove("hidden");
      resetStartScroll();
      clearToasts();
      buildLevelCards();
      updateSelectionUI();
      AudioFX.click();
    }

    endGame(won) {
      if (this.state === "won" || this.state === "gameover") return;
      let bonus = 0;
      if (won) {
        bonus = 500 + Math.round(this.player.hp) * 2 + this.chestsOpened * 50;
        this.score += bonus;
        this.state = "won";
        this.spawnBurst(this.portal.x, this.portal.y, "#fbbf24", 36, 220, 3);
        this.addShockwave(this.portal.x, this.portal.y, 100, "#fde047");
        AudioFX.win();
      } else {
        this.state = "gameover";
        AudioFX.dead();
      }
      this.updateHUD(true);
      const isRecord = Store.setBest(this.level.id, this.score);
      buildLevelCards();
      updateSelectionUI();
      this.showEnd(won, isRecord, bonus);
    }

    showEnd(won, isRecord, bonus) {
      const modal = ui.endOverlay.querySelector(".end-modal");
      modal.classList.toggle("win", won);
      ui.endIcon.textContent = won ? "🏆" : "💀";
      ui.endEyebrow.textContent = won ? "Vítězství" : "Konec hry";
      ui.endTitle.textContent = won ? "Utekl jsi!" : "Chycen!";
      const totalQuestions = this.correct + this.wrong;
      const accuracy = totalQuestions ? Math.round((this.correct / totalQuestions) * 100) : 0;
      ui.endSub.textContent = won
        ? `Bludištěm jsi prošel za ${formatTime(this.elapsed)}. Bonus ${formatScore.format(bonus)} bodů.`
        : `Truhly: ${this.chestsOpened} z ${this.chests.length}. Zkus to znovu – bludiště i příklady budou nové.`;
      ui.endStats.innerHTML = `
        <div class="stat"><b>${this.chestsOpened} / ${this.chests.length}</b><small>Truhly</small></div>
        <div class="stat"><b>${this.kills}</b><small>Poražení</small></div>
        <div class="stat"><b>${totalQuestions ? accuracy + " %" : "–"}</b><small>Přesnost</small></div>
      `;
      ui.endScore.innerHTML = `${formatScore.format(this.score)}<small>BODY${isRecord ? " · NOVÝ REKORD" : " · ČAS " + formatTime(this.elapsed)}</small>`;
      ui.endOverlay.classList.remove("hidden");
      setTimeout(() => ui.retryBtn.focus({ preventScroll: true }), 100);
    }

    /* ---------- vykreslování ---------- */
    render() {
      if (!this.maze || !this.mazeCanvas || !this.player) return;
      const now = performance.now() / 1000;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#050a14";
      ctx.fillRect(0, 0, W, H);

      const shakeX = this.shake > 0 ? rnd(-this.shake, this.shake) : 0;
      const shakeY = this.shake > 0 ? rnd(-this.shake, this.shake) : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      ctx.drawImage(this.mazeCanvas, 0, 0, W, H);

      // jemné světlo kolem hráče
      const p = this.player;
      const light = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 220);
      light.addColorStop(0, "rgba(56,232,255,.075)");
      light.addColorStop(0.5, "rgba(56,232,255,.025)");
      light.addColorStop(1, "rgba(56,232,255,0)");
      ctx.fillStyle = light;
      ctx.fillRect(p.x - 230, p.y - 230, 460, 460);

      // ambientní částečky
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const a of this.ambient) {
        const alpha = 0.06 + 0.12 * (0.5 + 0.5 * Math.sin(now * 0.6 + a.phase));
        const x = a.x + Math.sin(now * a.speed + a.phase) * 8;
        const y = a.y + Math.cos(now * a.speed * 0.7 + a.phase) * 6;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(x, y, a.r, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      this.drawPortal(now);
      this.drawChests(now);
      this.drawPickups(now);
      for (const e of this.enemies) this.drawEnemy(e, now);
      this.drawProjectiles(now);
      this.drawPlayer(now);
      this.drawEffects(now);
      if (this.state === "playing") {
        this.drawChestPrompt(now);
        this.drawExitArrow(now);
      }

      ctx.restore();

      if (this.player.flash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(251,113,133,${0.12 * this.player.flash})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }

    drawPortal(now) {
      const p = this.portal;
      if (!p) return;
      ctx.save();
      if (!p.active) {
        ctx.globalAlpha = 0.55;
        glowBall(ctx, p.x, p.y, 34, "#a78bfa", 0.18);
        ctx.strokeStyle = "rgba(167,139,250,.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 17, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(167,139,250,.5)";
        ctx.font = "11px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🔒", p.x, p.y + 1);
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(now * 4);
        glowBall(ctx, p.x, p.y, 54, "#a78bfa", 0.45);
        glowBall(ctx, p.x, p.y, 29, "#38e8ff", 0.4);
        ctx.globalCompositeOperation = "lighter";
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = i === 0 ? "rgba(167,139,250,.9)" : i === 1 ? "rgba(56,232,255,.8)" : "rgba(251,191,36,.55)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 13 + i * 6 + pulse * 2, now * (1.5 + i * 0.7), now * (1.5 + i * 0.7) + 2.2);
          ctx.stroke();
        }
        const core = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 15);
        core.addColorStop(0, "rgba(255,255,255,.95)");
        core.addColorStop(0.35, "rgba(167,139,250,.75)");
        core.addColorStop(1, "rgba(167,139,250,0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.22 + pulse * 0.15;
        const beam = ctx.createLinearGradient(p.x, p.y - 70, p.x, p.y + 20);
        beam.addColorStop(0, "rgba(167,139,250,0)");
        beam.addColorStop(0.7, "rgba(167,139,250,.8)");
        beam.addColorStop(1, "rgba(56,232,255,.7)");
        ctx.strokeStyle = beam;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 80);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawChests(now) {
      for (const c of this.chests) {
        const locked = !c.opened && this.elapsed < c.lockedUntil;
        const y = c.y + (c.opened ? 0 : Math.sin(now * 2.2 + c.phase) * 1.4);
        ctx.save();
        if (!c.opened) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 2.6 + c.phase);
          glowBall(ctx, c.x, y, 27 + pulse * 5, locked ? "#fb7185" : "#fbbf24", locked ? 0.18 : 0.24 + pulse * 0.1);
        }
        ctx.fillStyle = "rgba(0,0,0,.28)";
        ctx.beginPath();
        ctx.ellipse(c.x, c.y + 14, 15, 4.5, 0, 0, TAU);
        ctx.fill();

        if (c.opened) {
          // otevřená truhla
          ctx.fillStyle = "#4a2f17";
          roundRect(ctx, c.x - 13, y - 7, 26, 17, 4);
          ctx.fill();
          ctx.strokeStyle = "rgba(251,191,36,.35)";
          ctx.lineWidth = 1;
          roundRect(ctx, c.x - 13, y - 7, 26, 17, 4);
          ctx.stroke();
          ctx.fillStyle = "#171017";
          roundRect(ctx, c.x - 11, y - 6, 22, 7, 2);
          ctx.fill();
          ctx.save();
          ctx.translate(c.x - 13, y - 6);
          ctx.rotate(-0.42);
          ctx.fillStyle = "#5a371a";
          roundRect(ctx, 0, -12, 26, 12, 4);
          ctx.fill();
          ctx.strokeStyle = "rgba(251,191,36,.32)";
          ctx.lineWidth = 1;
          roundRect(ctx, 0, -12, 26, 12, 4);
          ctx.stroke();
          ctx.restore();
        } else {
          const bodyGrad = ctx.createLinearGradient(c.x, y - 12, c.x, y + 10);
          bodyGrad.addColorStop(0, locked ? "#6b3b3b" : "#9a6529");
          bodyGrad.addColorStop(0.6, locked ? "#4b2929" : "#6d431d");
          bodyGrad.addColorStop(1, locked ? "#341c1c" : "#4b2d12");
          ctx.fillStyle = bodyGrad;
          roundRect(ctx, c.x - 13, y - 3, 26, 15, 3.5);
          ctx.fill();
          ctx.strokeStyle = locked ? "rgba(251,113,133,.5)" : "rgba(253,224,71,.65)";
          ctx.lineWidth = 1.2;
          roundRect(ctx, c.x - 13, y - 3, 26, 15, 3.5);
          ctx.stroke();

          const lidGrad = ctx.createLinearGradient(c.x, y - 13, c.x, y);
          lidGrad.addColorStop(0, locked ? "#7b4141" : "#b07a35");
          lidGrad.addColorStop(1, locked ? "#4f2929" : "#70451d");
          ctx.fillStyle = lidGrad;
          ctx.beginPath();
          ctx.moveTo(c.x - 13, y - 1);
          ctx.lineTo(c.x - 13, y - 6);
          ctx.quadraticCurveTo(c.x - 13, y - 13, c.x - 4, y - 13);
          ctx.lineTo(c.x + 4, y - 13);
          ctx.quadraticCurveTo(c.x + 13, y - 13, c.x + 13, y - 6);
          ctx.lineTo(c.x + 13, y - 1);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = locked ? "rgba(251,113,133,.5)" : "rgba(253,224,71,.65)";
          ctx.stroke();

          // kování
          ctx.fillStyle = locked ? "rgba(251,113,133,.55)" : "rgba(251,191,36,.7)";
          ctx.fillRect(c.x - 9, y - 11, 2.5, 21);
          ctx.fillRect(c.x + 6.5, y - 11, 2.5, 21);
          ctx.fillStyle = locked ? "#3b1f24" : "#3c260f";
          roundRect(ctx, c.x - 4, y - 2, 8, 8, 2);
          ctx.fill();
          ctx.fillStyle = locked ? "#fb7185" : "#fde047";
          ctx.beginPath();
          ctx.arc(c.x, y + 1.5, 1.5, 0, TAU);
          ctx.fill();

          // otazník
          ctx.globalAlpha = 0.75 + 0.25 * Math.sin(now * 3 + c.phase);
          ctx.fillStyle = locked ? "#fb7185" : "#fde047";
          ctx.shadowColor = locked ? "rgba(251,113,133,.8)" : "rgba(253,224,71,.8)";
          ctx.shadowBlur = 10;
          ctx.font = "800 15px 'Segoe UI', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("?", c.x, y - 22 + Math.sin(now * 2.4 + c.phase) * 2);
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      }
    }

    drawPickups(now) {
      for (const item of this.pickups) {
        if (item.collected) continue;
        const meta = item.kind === "weapon"
          ? D.WEAPONS[item.weaponId]
          : D.LOOT_META[item.kind];
        if (!meta) continue;
        const bob = Math.sin(now * 3 + item.phase) * 3;
        const y = item.y + bob;
        ctx.save();
        glowBall(ctx, item.x, y, 22, meta.color, 0.32);
        ctx.fillStyle = "rgba(7,13,25,.9)";
        ctx.beginPath();
        ctx.arc(item.x, y, 11, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(meta.color, 0.85);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(item.x, y, 11, 0, TAU);
        ctx.stroke();
        ctx.font = "14px 'Segoe UI Emoji', 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(meta.icon, item.x, y + 1);
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(now * 4 + item.phase);
        ctx.fillStyle = meta.color;
        ctx.beginPath();
        ctx.arc(item.x + 9, y - 9, 1.4, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    drawEnemy(e, now) {
      const bob = Math.sin(now * 3.1 + e.wobble) * 2;
      const spawn = e.spawnGrace > 0 ? clamp(1 - e.spawnGrace / 1.1, 0.15, 1) : 1;
      const x = e.x, y = e.y + bob;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(spawn, spawn);
      glowBall(ctx, 0, 0, e.r * 2.4, e.type.color, 0.28);
      const r = e.r;

      if (e.type.id === "slime") {
        const squash = 1 + Math.sin(now * 4 + e.wobble) * 0.07;
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 1, 0, 0, r * 1.4);
        grad.addColorStop(0, "#b9f6ca");
        grad.addColorStop(0.45, e.type.color);
        grad.addColorStop(1, "#15803d");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 1, r * 1.05, r * 0.9 * squash, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.22)";
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.16, -0.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#052e16";
        ctx.beginPath();
        ctx.arc(-r * 0.32, -r * 0.12, r * 0.2, 0, TAU);
        ctx.arc(r * 0.32, -r * 0.12, r * 0.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-r * 0.28, -r * 0.18, r * 0.07, 0, TAU);
        ctx.arc(r * 0.36, -r * 0.18, r * 0.07, 0, TAU);
        ctx.fill();
      } else if (e.type.id === "bat") {
        const flap = Math.sin(now * 12 + e.wobble) * 0.35;
        ctx.fillStyle = "rgba(88,28,135,.95)";
        ctx.save();
        ctx.rotate(flap);
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -2);
        ctx.lineTo(-r * 2.1, -r * 0.75);
        ctx.lineTo(-r * 1.5, r * 0.25);
        ctx.lineTo(-r * 2.0, r * 0.7);
        ctx.lineTo(-r * 0.4, r * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.rotate(-flap);
        ctx.beginPath();
        ctx.moveTo(r * 0.5, -2);
        ctx.lineTo(r * 2.1, -r * 0.75);
        ctx.lineTo(r * 1.5, r * 0.25);
        ctx.lineTo(r * 2.0, r * 0.7);
        ctx.lineTo(r * 0.4, r * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        const grad = ctx.createRadialGradient(-2, -3, 1, 0, 0, r * 1.2);
        grad.addColorStop(0, "#e9d5ff");
        grad.addColorStop(0.5, e.type.color);
        grad.addColorStop(1, "#6b21a8");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.78, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#2e1065";
        ctx.beginPath();
        ctx.moveTo(-r * 0.55, -r * 0.45);
        ctx.lineTo(-r * 0.25, -r * 1.05);
        ctx.lineTo(-r * 0.02, -r * 0.5);
        ctx.closePath();
        ctx.moveTo(r * 0.55, -r * 0.45);
        ctx.lineTo(r * 0.25, -r * 1.05);
        ctx.lineTo(r * 0.02, -r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(-r * 0.24, -r * 0.05, r * 0.16, 0, TAU);
        ctx.arc(r * 0.24, -r * 0.05, r * 0.16, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#27103f";
        ctx.beginPath();
        ctx.arc(-r * 0.24, -r * 0.05, r * 0.07, 0, TAU);
        ctx.arc(r * 0.24, -r * 0.05, r * 0.07, 0, TAU);
        ctx.fill();
      } else if (e.type.id === "ghost") {
        const grad = ctx.createLinearGradient(0, -r, 0, r * 1.4);
        grad.addColorStop(0, "#bff8ff");
        grad.addColorStop(0.4, e.type.color);
        grad.addColorStop(1, "#0e7490");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, -r * 0.25, r * 0.9, Math.PI, 0);
        ctx.lineTo(r * 0.9, r * 1.1);
        const waves = 4;
        for (let i = 0; i < waves; i++) {
          const x1 = r * 0.9 - (i + 0.5) * (r * 1.8 / waves);
          const x2 = r * 0.9 - (i + 1) * (r * 1.8 / waves);
          ctx.quadraticCurveTo(x1, r * (0.6 + (i % 2) * 0.35), x2, r * 1.1);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(4,20,34,.9)";
        ctx.beginPath();
        ctx.ellipse(-r * 0.32, -r * 0.35, r * 0.22, r * 0.28, 0, 0, TAU);
        ctx.ellipse(r * 0.32, -r * 0.35, r * 0.22, r * 0.28, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-r * 0.27, -r * 0.42, r * 0.09, 0, TAU);
        ctx.arc(r * 0.37, -r * 0.42, r * 0.09, 0, TAU);
        ctx.fill();
      } else {
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r * 1.5);
        grad.addColorStop(0, "#fecdd3");
        grad.addColorStop(0.35, e.type.color);
        grad.addColorStop(1, "#4c0519");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.2);
        ctx.bezierCurveTo(r * 1.15, -r * 1.1, r * 1.1, r * 0.5, r * 0.55, r * 1.15);
        ctx.lineTo(r * 0.2, r * 0.65);
        ctx.lineTo(0, r * 1.2);
        ctx.lineTo(-r * 0.2, r * 0.65);
        ctx.lineTo(-r * 0.55, r * 1.15);
        ctx.bezierCurveTo(-r * 1.1, r * 0.5, -r * 1.15, -r * 1.1, 0, -r * 1.2);
        ctx.fill();
        ctx.fillStyle = "#fff1f2";
        ctx.shadowColor = "#fb7185";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(-r * 0.32, -r * 0.3, r * 0.14, r * 0.09, -0.2, 0, TAU);
        ctx.ellipse(r * 0.32, -r * 0.3, r * 0.14, r * 0.09, 0.2, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (e.slowTimer > 0) {
        ctx.strokeStyle = "rgba(125,211,252,.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r + 4, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = "#bae6fd";
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("❄", 0, -r - 6);
      }
      if (e.hitFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${clamp(e.hitFlash * 5, 0, 0.7)})`;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
      }

      if (e.hp < e.maxHp) {
        const bw = 24, bh = 3.5;
        ctx.fillStyle = "rgba(3,8,16,.75)";
        roundRect(ctx, -bw / 2, -r - 10, bw, bh, 2);
        ctx.fill();
        ctx.fillStyle = e.type.color;
        roundRect(ctx, -bw / 2, -r - 10, bw * clamp(e.hp / e.maxHp, 0, 1), bh, 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawPlayer(now) {
      const p = this.player;
      const angle = Math.atan2(p.dir.y, p.dir.x);
      ctx.save();
      if (p.invuln > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(now * 28);
      const bob = p.moving ? Math.sin(now * 12) * 1.2 : Math.sin(now * 3) * 0.8;
      const x = p.x, y = p.y + bob;

      glowBall(ctx, x, y, 30, "#ffd166", 0.38);
      ctx.fillStyle = "rgba(0,0,0,.3)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + p.r + 3, p.r * 0.85, 3.5, 0, 0, TAU);
      ctx.fill();

      // šála za hrdinou
      const fx = Math.cos(angle), fy = Math.sin(angle);
      const nx = -fy, ny = fx;
      ctx.save();
      ctx.strokeStyle = "#38e8ff";
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(56,232,255,.6)";
      ctx.shadowBlur = 7;
      for (let i = 0; i < 2; i++) {
        const sway = Math.sin(now * 8 + i * 1.4) * 3;
        ctx.beginPath();
        ctx.moveTo(x - fx * 8 + nx * (i === 0 ? -2 : 2), y - fy * 8 + ny * (i === 0 ? -2 : 2));
        ctx.quadraticCurveTo(
          x - fx * 16 + nx * (i === 0 ? -5 : 5) + sway,
          y - fy * 16 + ny * (i === 0 ? -5 : 5),
          x - fx * 23 + nx * (i === 0 ? -3 : 7) + sway,
          y - fy * 23 + ny * (i === 0 ? -3 : 3)
        );
        ctx.stroke();
      }
      ctx.restore();

      // tělo
      const body = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, p.r + 1);
      body.addColorStop(0, "#fff7cf");
      body.addColorStop(0.35, "#fde68a");
      body.addColorStop(0.75, "#fbbf24");
      body.addColorStop(1, "#d97706");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,251,235,.65)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // oči
      const lookX = fx * 2.8, lookY = fy * 2.8;
      const eyeSep = 3.9;
      const ex1 = x + lookX + nx * eyeSep, ey1 = y + lookY + ny * eyeSep;
      const ex2 = x + lookX - nx * eyeSep, ey2 = y + lookY - ny * eyeSep;
      ctx.fillStyle = "#fffdf5";
      ctx.beginPath();
      ctx.arc(ex1, ey1, 2.2, 0, TAU);
      ctx.arc(ex2, ey2, 2.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(ex1 + fx * 0.6, ey1 + fy * 0.6, 1, 0, TAU);
      ctx.arc(ex2 + fx * 0.6, ey2 + fy * 0.6, 1, 0, TAU);
      ctx.fill();

      // malý úsměv
      ctx.strokeStyle = "rgba(120,53,15,.65)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(x + fx * 2, y + fy * 2 + 4, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // štít
      if (p.shield > 0) {
        const pulse = 0.6 + 0.4 * Math.sin(now * 5);
        ctx.strokeStyle = `rgba(56,232,255,${0.5 + 0.3 * pulse})`;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = "rgba(56,232,255,.7)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, p.r + 7, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = `rgba(56,232,255,${0.06 + 0.04 * pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, p.r + 7, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    drawProjectiles(now) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const pr of this.projectiles) {
        const px = pr.x, py = pr.y;
        const tx = px - pr.vx * 15, ty = py - pr.vy * 15;
        const grad = ctx.createLinearGradient(tx, ty, px, py);
        grad.addColorStop(0, hexToRgba(pr.color, 0));
        grad.addColorStop(1, hexToRgba(pr.color, 0.75));
        ctx.strokeStyle = grad;
        ctx.lineWidth = pr.r * 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.stroke();
        glowBall(ctx, px, py, pr.r * 4, pr.color, 0.5);
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(px, py, pr.r * 0.55, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    drawEffects(now) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of this.shockwaves) {
        const t = 1 - s.life / s.maxLife;
        ctx.strokeStyle = hexToRgba(s.color, 0.55 * (1 - t));
        ctx.lineWidth = 3 * (1 - t) + 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(1, s.radius * t), 0, TAU);
        ctx.stroke();
      }
      for (const pt of this.particles) {
        const alpha = clamp(pt.life / pt.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (0.4 + alpha * 0.6), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "800 12px 'Segoe UI', sans-serif";
      for (const f of this.floaters) {
        const alpha = clamp(f.life / f.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.shadowColor = "rgba(0,0,0,.7)";
        ctx.shadowBlur = 4;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.restore();
    }

    drawChestPrompt(now) {
      const c = this.nearChest;
      if (!c) return;
      const locked = this.elapsed < c.lockedUntil;
      const label = locked ? `Zamčeno ${Math.ceil(c.lockedUntil - this.elapsed)} s` : "Otevřít truhlu";
      ctx.save();
      ctx.font = "650 11px 'Segoe UI', sans-serif";
      const textW = ctx.measureText(label).width;
      const keyW = 20, pad = 9, gap = 7, h = 27;
      const w = pad + (locked ? 0 : keyW + gap) + textW + pad;
      const x = clamp(c.x - w / 2, 6, W - w - 6);
      const y = c.y - 40;
      ctx.fillStyle = "rgba(6,12,24,.94)";
      ctx.strokeStyle = locked ? "rgba(251,113,133,.5)" : "rgba(251,191,36,.55)";
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, w, h, 9);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x - 4, y + h);
      ctx.lineTo(c.x, y + h + 5);
      ctx.lineTo(c.x + 4, y + h);
      ctx.closePath();
      ctx.fillStyle = "rgba(6,12,24,.94)";
      ctx.fill();

      let tx = x + pad;
      if (!locked) {
        ctx.fillStyle = "#fbbf24";
        roundRect(ctx, tx, y + (h - keyW) / 2, keyW, keyW, 5);
        ctx.fill();
        ctx.fillStyle = "#1d1607";
        ctx.font = "800 11px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("E", tx + keyW / 2, y + h / 2 + 0.5);
        tx += keyW + gap;
      }
      ctx.fillStyle = locked ? "#ffb3bd" : "#f8e6bb";
      ctx.font = "650 11px 'Segoe UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, tx, y + h / 2 + 0.5);
      ctx.restore();
    }

    drawExitArrow(now) {
      if (!this.portal || !this.portal.active) return;
      const p = this.player;
      const angle = Math.atan2(this.portal.y - p.y, this.portal.x - p.x);
      const pulse = 0.6 + 0.4 * Math.sin(now * 5);
      const r = 38 + Math.sin(now * 3) * 3;
      const x = p.x + Math.cos(angle) * r;
      const y = p.y + Math.sin(angle) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      glowBall(ctx, 0, 0, 16, "#fde047", 0.3 * pulse);
      ctx.fillStyle = `rgba(253,224,71,${0.65 + 0.3 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -5.5);
      ctx.lineTo(-1.5, 0);
      ctx.lineTo(-4, 5.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  const game = new Game();

  /* ---------- smyčka ---------- */
  let lastFrame = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (game.state === "playing" || game.state === "math") game.tick(dt);
    if (game.state !== "menu" && game.maze) game.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function toggleSound() {
    AudioFX.setEnabled(!AudioFX.isEnabled());
    syncSoundButton();
    if (AudioFX.isEnabled()) AudioFX.click();
  }

  /* ---------- tlačítka ---------- */
  ui.pauseBtn.addEventListener("click", () => game.togglePause());
  ui.resumeBtn.addEventListener("click", () => game.resume());
  ui.restartBtn.addEventListener("click", () => game.restart());
  ui.menuBtn.addEventListener("click", () => game.returnToMenu());
  ui.retryBtn.addEventListener("click", () => game.restart());
  ui.endMenuBtn.addEventListener("click", () => game.returnToMenu());
  ui.mathHintBtn.addEventListener("click", () => game.useMathHint());

  /* ---------- klávesnice ---------- */
  const KEY_TO_DIR = {
    arrowup: "up", w: "up",
    arrowdown: "down", s: "down",
    arrowleft: "left", a: "left",
    arrowright: "right", d: "right"
  };

  window.addEventListener("keydown", (e) => {
    AudioFX.init();
    const key = String(e.key || "").toLowerCase();
    if (game.state === "menu") {
      if (e.key === "Enter" && !(e.target && e.target.closest && e.target.closest("button"))) {
        e.preventDefault();
        beginSelected();
      }
      return;
    }
    if (game.state === "math") {
      if (/^[1-4]$/.test(e.key)) {
        e.preventDefault();
        game.answerMath(Number(e.key) - 1);
      }
      return;
    }
    if (game.state === "paused") {
      if (key === "escape" || key === "p") {
        e.preventDefault();
        game.resume();
      }
      return;
    }
    if (game.state === "gameover" || game.state === "won") {
      if (e.key === "Enter") {
        e.preventDefault();
        game.restart();
      } else if (key === "escape") {
        e.preventDefault();
        game.returnToMenu();
      }
      return;
    }
    if (game.state === "playing") {
      if (KEY_TO_DIR[key]) {
        e.preventDefault();
        setDirDown(KEY_TO_DIR[key]);
      } else if (e.code === "Space" || key === " ") {
        e.preventDefault();
        input.shoot = true;
      } else if (key === "e") {
        if (!e.repeat) game.interact();
      } else if (key === "escape" || key === "p") {
        e.preventDefault();
        game.pause();
      } else if (key === "m") {
        toggleSound();
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = String(e.key || "").toLowerCase();
    if (KEY_TO_DIR[key]) setDirUp(KEY_TO_DIR[key]);
    if (e.code === "Space" || key === " ") input.shoot = false;
  });

  window.addEventListener("blur", () => {
    input.shoot = false;
    input.dir = null;
    input.held.length = 0;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.state === "playing") game.pause();
  });

  /* ---------- dotykové ovládání ---------- */
  document.querySelectorAll(".dpad [data-dir]").forEach((btn) => {
    const dir = btn.dataset.dir;
    const down = (e) => {
      e.preventDefault();
      AudioFX.init();
      try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      setDirDown(dir);
    };
    const up = (e) => {
      e.preventDefault();
      setDirUp(dir);
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
  });

  const fireBtn = ui.touchFire;
  fireBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    AudioFX.init();
    try { fireBtn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    input.shoot = true;
  });
  const stopFire = (e) => {
    e.preventDefault();
    input.shoot = false;
  };
  fireBtn.addEventListener("pointerup", stopFire);
  fireBtn.addEventListener("pointercancel", stopFire);
  fireBtn.addEventListener("lostpointercapture", stopFire);
  ui.touchOpen.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    AudioFX.init();
    game.interact();
  });

  // při změně velikosti stačí, že se plátno škáluje přes CSS
  window.addEventListener("resize", () => {
    // případná změna DPR – překreslíme mezipaměť, aby zůstala ostrá
    const newDpr = Math.min(window.devicePixelRatio || 1, 2);
    if (Math.abs(newDpr - DPR) > 0.05) {
      DPR = newDpr;
      resizeCanvas();
      if (game.maze) game.mazeCanvas = buildMazeCanvas(game.maze, DPR);
    }
  });

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  resetStartScroll();
  window.addEventListener("load", () => {
    resetStartScroll();
    setTimeout(resetStartScroll, 80);
  });

  window.ciselneBludiste = { game, levels: D.LEVELS, input };
})();
