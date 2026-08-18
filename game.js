// =====================================================
// Shadow Survivors - Main (merged)
// Stable sprites + Jules rooms/boss/XP/dash/prologue
// =====================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  const c = document.getElementById('game-container');
  canvas.width = c.clientWidth;
  canvas.height = c.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// ---------- HEROES ----------
const HEROES = {
  kael: {
    id: 'kael', name: 'Kael', color: '#9b7bff', accent: '#a070ff',
    weapon: 'Bare Hands', role: 'Balanced DPS',
    hp: 120, walkSpeed: 2.6, runSpeed: 5.2, jumpForce: -11.8, doubleJumpForce: -10.5,
    dashSpeed: 13, damageMult: 1.0, attackRange: 78
  },
  lyra: {
    id: 'lyra', name: 'Lyra', color: '#e080ff', accent: '#c040ff',
    weapon: 'Twin Daggers', role: 'Fast Assassin',
    hp: 85, walkSpeed: 3.2, runSpeed: 6.4, jumpForce: -12.2, doubleJumpForce: -11.0,
    dashSpeed: 16, damageMult: 0.9, attackRange: 70
  },
  vex: {
    id: 'vex', name: 'Vex', color: '#ff6644', accent: '#ff4422',
    weapon: 'Gauntlets', role: 'Heavy Tank',
    hp: 160, walkSpeed: 2.0, runSpeed: 4.0, jumpForce: -10.5, doubleJumpForce: -9.5,
    dashSpeed: 10, damageMult: 1.35, attackRange: 85
  },
  nyx: {
    id: 'nyx', name: 'Nyx', color: '#66aaff', accent: '#4488ff',
    weapon: 'Energy Pistols', role: 'Ranged DPS',
    hp: 90, walkSpeed: 2.8, runSpeed: 5.5, jumpForce: -11.5, doubleJumpForce: -10.2,
    dashSpeed: 14, damageMult: 1.1, attackRange: 150
  }
};

let selectedHero = 'kael';

// ---------- SPRITES (horizontal strips) ----------
const sprites = { kael: null, lyra: null, leech: null, loaded: 0, total: 2 };
let KAEL_FW = 128, KAEL_FH = 170, KAEL_FRAMES = 10;
let LYRA_FW = 128, LYRA_FH = 170, LYRA_FRAMES = 10;
let LEECH_FW = 64, LEECH_FH = 64;

function loadSprites(callback) {
  let pending = 2;
  function oneDone() {
    pending--;
    if (pending <= 0 && callback) callback();
  }
  function stripWhite(img, cb) {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const data = g.getImageData(0, 0, c.width, c.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 225 && d[i+1] > 225 && d[i+2] > 225) d[i+3] = 0;
        else if (d[i] < 28 && d[i+1] < 28 && d[i+2] < 28) d[i+3] = 0;
      }
      g.putImageData(data, 0, 0);
      const out = new Image();
      out.onload = () => cb(out);
      out.src = c.toDataURL('image/png');
    } catch (e) { cb(img); }
  }

  sprites.kael = new Image();
  sprites.kael.onload = () => {
    stripWhite(sprites.kael, (cleaned) => {
      sprites.kael = cleaned;
      // auto frames: prefer 22 if divides evenly else 10
      const w = cleaned.naturalWidth;
      if (w % 22 === 0) { KAEL_FRAMES = 22; KAEL_FW = w / 22; }
      else if (w % 10 === 0) { KAEL_FRAMES = 10; KAEL_FW = w / 10; }
      else { KAEL_FRAMES = 10; KAEL_FW = Math.floor(w / 10); }
      KAEL_FH = cleaned.naturalHeight;
      console.log('Kael', KAEL_FW, KAEL_FH, KAEL_FRAMES);
      oneDone();
    });
  };
  sprites.kael.onerror = () => oneDone();
  sprites.kael.src = 'kael_sheet.png';

  sprites.leech = new Image();
  sprites.leech.onload = () => {
    LEECH_FW = Math.floor(sprites.leech.naturalWidth / 5) || 64;
    LEECH_FH = sprites.leech.naturalHeight || 64;
    oneDone();
  };
  sprites.leech.onerror = () => oneDone();
  sprites.leech.src = 'leech_sheet.png';

  sprites.lyra = new Image();
  sprites.lyra.onload = () => {
    const w = sprites.lyra.naturalWidth;
    if (w % 22 === 0) { LYRA_FRAMES = 22; LYRA_FW = w / 22; }
    else if (w % 21 === 0) { LYRA_FRAMES = 21; LYRA_FW = w / 21; }
    else if (w % 10 === 0) { LYRA_FRAMES = 10; LYRA_FW = w / 10; }
    else { LYRA_FRAMES = 10; LYRA_FW = Math.floor(w / 10); }
    LYRA_FH = sprites.lyra.naturalHeight;
    console.log('Lyra', LYRA_FW, LYRA_FH, LYRA_FRAMES);
  };
  sprites.lyra.src = 'lyra_sheet.png';
}

// ---------- STATE ----------
let gameState = 'menu'; // menu | playing | dead | transition
let kills = 0, souls = 0;
let cameraX = 0;
let levelComplete = false;

const player = {
  x: 120, y: 0, w: 70, h: 100,
  vx: 0, vy: 0,
  walkSpeed: 2.6, runSpeed: 5.2, running: false,
  jumpForce: -11.8, doubleJumpForce: -10.5,
  onGround: false, jumpsLeft: 2, facing: 1,
  hp: 100, maxHp: 100, invuln: 0,
  attacking: false, attackTimer: 0, attackType: 0,
  comboCount: 0, comboTimer: 0, lastAttackTime: 0,
  damageMult: 1, attackRange: 78, heroId: 'kael', heroColor: '#9b7bff',
  animFrame: 0,
  dashTimer: 0, dashCooldown: 0, level: 1, xp: 0, nextXp: 100
};

const ATTACKS = {
  jab:      { damage: 10, duration: 12, range: 70 },
  cross:    { damage: 14, duration: 14, range: 78 },
  spinKick: { damage: 20, duration: 18, range: 88 },
  heavy:    { damage: 32, duration: 22, range: 95 }
};
const COMBO_WINDOW = 55;
const GRAVITY = 0.55;

let lastDirTap = 0, lastDirTapTime = 0;
const DIR_TAP_MS = 280;

function applyHero(id) {
  const h = HEROES[id] || HEROES.kael;
  selectedHero = h.id;
  player.heroId = h.id;
  player.heroColor = h.color;
  player.maxHp = h.hp; player.hp = h.hp;
  player.walkSpeed = h.walkSpeed; player.runSpeed = h.runSpeed;
  player.jumpForce = h.jumpForce; player.doubleJumpForce = h.doubleJumpForce;
  player.damageMult = h.damageMult; player.attackRange = h.attackRange;
  const wl = document.getElementById('weapon-label');
  if (wl) wl.textContent = h.weapon;
  const hpEl = document.getElementById('hp');
  if (hpEl) hpEl.textContent = Math.floor(player.hp);
  const hl = document.getElementById('hero-label');
  if (hl) hl.textContent = h.name;
}

function addXp(n) {
  player.xp += n;
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level++;
    player.nextXp = Math.floor(player.nextXp * 1.45);
    player.maxHp += 8;
    player.hp = Math.min(player.maxHp, player.hp + 20);
    spawnParticles(player.x + 30, player.y + 40, '#ffcc66', 16);
    showBanner('LEVEL UP! Lv ' + player.level);
  }
  const ld = document.getElementById('level-display');
  if (ld) ld.textContent = 'Lv ' + player.level;
}

function getComboMultiplier() {
  if (player.comboCount >= 3) return 1.35;
  if (player.comboCount >= 2) return 1.15;
  return 1;
}

function getCurrentAttackDamage() {
  let base = 10;
  if (player.attackType === 1) base = ATTACKS.jab.damage;
  else if (player.attackType === 2) base = ATTACKS.cross.damage;
  else if (player.attackType === 3) base = ATTACKS.spinKick.damage;
  else if (player.attackType === 4) base = ATTACKS.heavy.damage;
  return Math.floor(base * (player.damageMult || 1) * getComboMultiplier());
}

function showBanner(text) {
  const el = document.getElementById('combo-display');
  if (!el) return;
  el.textContent = text;
  el.style.opacity = 1;
  setTimeout(() => { el.style.opacity = 0; }, 1000);
}

function updateComboUI() {
  const counter = document.getElementById('combo-counter');
  const num = document.getElementById('combo-num');
  const multEl = document.getElementById('combo-mult');
  if (!counter) return;
  if (player.comboCount >= 2) {
    counter.style.display = 'block';
    if (num) num.textContent = player.comboCount;
    if (multEl) multEl.textContent = 'x' + getComboMultiplier().toFixed(2);
  } else counter.style.display = 'none';
}

function registerAttack(type) {
  const now = performance.now();
  if (now - player.lastAttackTime > 750) player.comboCount = 0;
  player.lastAttackTime = now;
  player.attacking = true;
  player.attackType = type;
  if (type === 4) {
    player.attackTimer = ATTACKS.heavy.duration;
    player.comboCount = 0;
    player.animFrame = 8;
    showBanner('HEAVY!');
  } else {
    player.comboCount = Math.min(player.comboCount + 1, 3);
    player.comboTimer = COMBO_WINDOW;
    if (type === 1) { player.attackTimer = ATTACKS.jab.duration; player.animFrame = 5; }
    else if (type === 2) { player.attackTimer = ATTACKS.cross.duration; player.animFrame = 6; }
    else { player.attackTimer = ATTACKS.spinKick.duration; player.animFrame = 7; }
    if (player.comboCount === 3 && type === 3) showBanner('3-HIT COMBO!');
  }
  updateComboUI();
}

// ---------- WORLD ----------
const ROOMS = {
  level_1: {
    name: 'Level 1 – Dust of Champions',
    width: 2000,
    platforms: [
      { x: 0, y: 400, w: 2000, h: 40 },
      { x: 280, y: 320, w: 120, h: 18 },
      { x: 520, y: 260, w: 100, h: 18 },
      { x: 750, y: 300, w: 140, h: 18 },
      { x: 1100, y: 250, w: 120, h: 18 },
      { x: 1400, y: 320, w: 160, h: 18 },
      { x: 1650, y: 280, w: 120, h: 18 }
    ],
    exit: { x: 1900, y: 320, w: 50, h: 80 },
    spawn: { x: 100, y: 300 },
    enemies: () => {
      const list = [];
      list.push(createLeech(380, 340));
      list.push(createLeech(500, 340));
      list.push(createSkeleton(650, 330));
      list.push(createLeech(900, 340));
      list.push(createSkeleton(1050, 330));
      list.push(createLeech(1250, 340));
      list.push(createSkeleton(1450, 330));
      list.push(createLeech(1600, 340));
      list.push(createSkeleton(1750, 330));
      return list;
    }
  },
  level_2: {
    name: 'Level 2 – Collapsing Stands',
    width: 2200,
    platforms: [
      { x: 0, y: 400, w: 2200, h: 40 },
      { x: 200, y: 300, w: 100, h: 18 },
      { x: 400, y: 240, w: 100, h: 18 },
      { x: 650, y: 300, w: 150, h: 18 },
      { x: 950, y: 220, w: 120, h: 18 },
      { x: 1300, y: 300, w: 180, h: 18 },
      { x: 1700, y: 260, w: 140, h: 18 }
    ],
    exit: { x: 2100, y: 320, w: 50, h: 80 },
    spawn: { x: 80, y: 300 },
    enemies: () => {
      const list = [];
      for (let i = 0; i < 6; i++) list.push(createLeech(350 + i * 250, 340));
      for (let i = 0; i < 5; i++) list.push(createSkeleton(450 + i * 280, 330));
      return list;
    }
  },
  boss_1: {
    name: 'Boss – Void Knight',
    width: 1400,
    platforms: [{ x: 0, y: 400, w: 1400, h: 40 }],
    exit: null,
    spawn: { x: 200, y: 300 },
    enemies: () => [],
    onEnter: () => {
      boss = createBoss(900, 280, 'Void Knight', 220, '#ff4455');
      showBanner('BOSS: VOID KNIGHT');
      const bu = document.getElementById('boss-ui');
      if (bu) bu.style.display = 'block';
      const bn = document.getElementById('boss-name-ui');
      if (bn) bn.textContent = 'Void Knight';
    }
  }
};

let currentRoomId = 'level_1';
let currentRoom = ROOMS.level_1;
let platforms = [];
let enemies = [];
let particles = [];
let damageTexts = [];
let boss = null;

function createLeech(x, y) {
  return {
    type: 'leech', x, y, w: 64, h: 56,
    hp: 28, maxHp: 28, speed: 1.15 + Math.random() * 0.3,
    facing: -1, hurtTimer: 0, animFrame: 0, animTimer: 0, dead: false
  };
}

function createSkeleton(x, y) {
  return {
    type: 'skeleton', x, y, w: 48, h: 70,
    hp: 42, maxHp: 42, speed: 1.35 + Math.random() * 0.4,
    facing: -1, hurtTimer: 0, animFrame: 0, animTimer: 0, dead: false
  };
}

function createBoss(x, y, name, hp, color) {
  return {
    x, y, w: 90, h: 120, name, hp, maxHp: hp, color,
    speed: 1.6, facing: -1, hurtTimer: 0, invuln: 0,
    attackTimer: 0, phase: 0, animFrame: 0, dead: false
  };
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      life: 20 + Math.random() * 15,
      color, size: 2 + Math.random() * 3
    });
  }
}

function spawnDamageText(x, y, text, color) {
  damageTexts.push({ x, y, text, color: color || '#fff', life: 40, vy: -1.2 });
}

function enterRoom(roomId) {
  const room = ROOMS[roomId];
  if (!room) return;
  currentRoomId = roomId;
  currentRoom = room;
  platforms = room.platforms.map(p => ({ ...p }));
  enemies = room.enemies ? room.enemies() : [];
  boss = null;
  player.x = room.spawn.x;
  player.y = room.spawn.y;
  player.vx = 0; player.vy = 0;
  cameraX = 0;
  levelComplete = false;
  const ln = document.getElementById('level-name');
  if (ln) ln.textContent = room.name;
  const bu = document.getElementById('boss-ui');
  if (bu) bu.style.display = 'none';
  if (room.onEnter) room.onEnter();
}

// ---------- INPUT ----------
const keys = {};
let joyDX = 0, joyActive = false;

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (!keys[k]) {
    if (k === 'a' || k === 'arrowleft') {
      const t = performance.now();
      if (lastDirTap === -1 && t - lastDirTapTime < DIR_TAP_MS) player.running = true;
      lastDirTap = -1; lastDirTapTime = t;
    }
    if (k === 'd' || k === 'arrowright') {
      const t = performance.now();
      if (lastDirTap === 1 && t - lastDirTapTime < DIR_TAP_MS) player.running = true;
      lastDirTap = 1; lastDirTapTime = t;
    }
  }
  keys[k] = true;
  if (['z', 'j'].includes(k)) tryAttack();
  if (k === 'x') tryHeavy();
  if (k === 'shift') tryDash();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function setupJoystick() {
  const area = document.getElementById('joystick-area');
  const knob = document.getElementById('joystick-knob');
  const base = document.getElementById('joystick-base');
  if (!area || !knob || !base) return;
  const start = (e) => {
    e.preventDefault();
    joyActive = true;
    move(e);
  };
  const move = (e) => {
    if (!joyActive) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const max = r.width / 2 - 10;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joyDX = dx / max;
    player.running = Math.abs(joyDX) > 0.65;
  };
  const end = () => {
    joyActive = false; joyDX = 0; player.running = false;
    knob.style.transform = 'translate(0,0)';
  };
  area.addEventListener('touchstart', start, { passive: false });
  area.addEventListener('touchmove', move, { passive: false });
  area.addEventListener('touchend', end);
  area.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}

function tryAttack() {
  if (gameState !== 'playing' || player.attacking) return;
  let type = 1;
  if (player.comboCount === 1) type = 2;
  else if (player.comboCount >= 2) type = 3;
  registerAttack(type);
}

function tryHeavy() {
  if (gameState !== 'playing' || player.attacking) return;
  registerAttack(4);
}

function tryDash() {
  if (gameState !== 'playing') return;
  if (player.dashCooldown > 0 || player.dashTimer > 0) return;
  const h = HEROES[player.heroId] || HEROES.kael;
  player.dashTimer = 10;
  player.dashCooldown = 45;
  player.invuln = Math.max(player.invuln, 12);
  player.vx = player.facing * (h.dashSpeed || 13);
  spawnParticles(player.x + 30, player.y + 50, player.heroColor, 10);
}

function tryJump() {
  if (gameState !== 'playing') return;
  if (player.jumpsLeft > 0) {
    player.vy = player.jumpsLeft === 2 ? player.jumpForce : player.doubleJumpForce;
    player.jumpsLeft--;
    player.onGround = false;
  }
}

// ---------- UPDATE ----------
function update() {
  if (gameState !== 'playing') return;

  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.dashTimer > 0) player.dashTimer--;

  let move = 0;
  if (keys['a'] || keys['arrowleft']) move = -1;
  if (keys['d'] || keys['arrowright']) move = 1;
  if (joyActive) move = joyDX;

  if (Math.abs(move) < 0.15) player.running = false;

  if (player.dashTimer <= 0) {
    if (Math.abs(move) > 0.15) {
      const spd = player.running ? player.runSpeed : player.walkSpeed;
      player.vx = move * spd;
      player.facing = move > 0 ? 1 : -1;
    } else {
      player.vx *= 0.78;
    }
  }

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;
  for (const p of platforms) {
    if (player.vx > 0 && player.x + player.w > p.x && player.x < p.x &&
        player.y + player.h > p.y + 5 && player.y < p.y + p.h) player.x = p.x - player.w;
    if (player.vx < 0 && player.x < p.x + p.w && player.x + player.w > p.x + p.w &&
        player.y + player.h > p.y + 5 && player.y < p.y + p.h) player.x = p.x + p.w;
    if (player.vy >= 0 &&
        player.x + player.w > p.x + 4 && player.x < p.x + p.w - 4 &&
        player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + player.vy + 4) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumpsLeft = 2;
    }
  }

  if (player.x < 0) player.x = 0;
  if (player.x > currentRoom.width - player.w) player.x = currentRoom.width - player.w;
  if (player.y > 600) { player.hp = 0; }

  if (player.attacking) {
    player.attackTimer--;
    if (player.attackTimer <= 0) player.attacking = false;
  }
  if (player.comboTimer > 0) { player.comboTimer--; if (player.comboTimer <= 0) { player.comboCount = 0; updateComboUI(); } }
  if (player.invuln > 0) player.invuln--;

  // anim
  if (player.invuln > 20) player.animFrame = Math.min(KAEL_FRAMES - 1, 9);
  else if (player.attacking) { /* set in registerAttack */ }
  else if (!player.onGround) player.animFrame = (player.jumpsLeft <= 0) ? 4 : 3;
  else if (Math.abs(player.vx) > 0.8) player.animFrame = (Math.floor(performance.now() / 100) % 2 === 0) ? 1 : 2;
  else player.animFrame = 0;

  // enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dead) { enemies.splice(i, 1); continue; }
    e.animTimer++;
    if (e.animTimer % 12 === 0) e.animFrame = (e.animFrame + 1) % 5;
    if (e.hurtTimer > 0) e.hurtTimer--;

    const dx = player.x - e.x;
    e.facing = dx > 0 ? 1 : -1;
    e.x += e.facing * e.speed;

    // ground stick
    let onP = false;
    for (const p of platforms) {
      if (e.x + e.w > p.x && e.x < p.x + p.w && e.y + e.h >= p.y - 2 && e.y + e.h <= p.y + 20) {
        e.y = p.y - e.h; onP = true;
      }
    }
    if (!onP) e.y += 4;

    // player hit enemy
    if (player.attacking && player.attackTimer > 4 && e.hurtTimer <= 0) {
      const range = player.attackRange || 78;
      const sx = player.facing > 0 ? player.x + player.w - 10 : player.x - range + 10;
      if (sx < e.x + e.w && sx + range > e.x && player.y < e.y + e.h && player.y + player.h > e.y) {
        const dmg = getCurrentAttackDamage();
        e.hp -= dmg;
        e.hurtTimer = 15;
        e.x += player.facing * 12;
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#c9a0ff', 6);
        spawnDamageText(e.x + e.w / 2, e.y, dmg, '#fff');
        if (e.hp <= 0) {
          e.dead = true;
          kills++; souls += e.type === 'skeleton' ? 3 : 2;
          addXp(e.type === 'skeleton' ? 18 : 12);
          spawnParticles(e.x + 20, e.y + 20, '#ff66aa', 14);
          document.getElementById('kills').textContent = kills;
          document.getElementById('souls').textContent = souls;
        }
      }
    }

    // enemy hit player
    if (player.invuln <= 0 &&
        player.x < e.x + e.w && player.x + player.w > e.x &&
        player.y < e.y + e.h && player.y + player.h > e.y) {
      player.hp -= e.type === 'skeleton' ? 12 : 8;
      player.invuln = 40;
      player.vx = -player.facing * 6;
      spawnParticles(player.x + 30, player.y + 40, '#ff4444', 8);
      document.getElementById('hp').textContent = Math.max(0, Math.floor(player.hp));
      if (player.hp <= 0) gameOver();
    }
  }

  // boss
  if (boss && !boss.dead) {
    updateBoss();
  }

  // exit gate
  if (currentRoom.exit && !levelComplete) {
    const g = currentRoom.exit;
    if (player.x + player.w > g.x && player.x < g.x + g.w &&
        player.y + player.h > g.y && player.y < g.y + g.h) {
      levelComplete = true;
      if (currentRoomId === 'level_1') {
        showBanner('LEVEL 2');
        setTimeout(() => enterRoom('level_2'), 600);
      } else if (currentRoomId === 'level_2') {
        showBanner('BOSS FIGHT');
        setTimeout(() => enterRoom('boss_1'), 600);
      }
    }
  }

  // particles / damage text
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = damageTexts.length - 1; i >= 0; i--) {
    const t = damageTexts[i];
    t.y += t.vy; t.life--;
    if (t.life <= 0) damageTexts.splice(i, 1);
  }

  // camera
  cameraX = player.x - canvas.width * 0.35;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > currentRoom.width - canvas.width) cameraX = Math.max(0, currentRoom.width - canvas.width);
}

function updateBoss() {
  if (!boss || boss.dead) return;
  if (boss.hurtTimer > 0) boss.hurtTimer--;
  if (boss.invuln > 0) boss.invuln--;
  boss.phase++;

  const dx = player.x - boss.x;
  boss.facing = dx > 0 ? 1 : -1;

  if (boss.phase % 120 < 40) {
    // wind up / shoot
    if (boss.phase % 120 === 20) {
      // simple slam damage zone
      if (Math.abs(player.x - boss.x) < 120 && player.invuln <= 0) {
        player.hp -= 18;
        player.invuln = 35;
        document.getElementById('hp').textContent = Math.max(0, Math.floor(player.hp));
        if (player.hp <= 0) gameOver();
      }
      spawnParticles(boss.x + boss.w / 2, boss.y + boss.h, '#ff4455', 12);
    }
  } else {
    boss.x += boss.facing * boss.speed;
  }

  // ground
  for (const p of platforms) {
    if (boss.x + boss.w > p.x && boss.x < p.x + p.w && boss.y + boss.h >= p.y - 2) {
      boss.y = p.y - boss.h;
    }
  }

  // player hits boss
  if (player.attacking && player.attackTimer > 4 && boss.invuln <= 0) {
    const range = player.attackRange || 78;
    const sx = player.facing > 0 ? player.x + player.w - 10 : player.x - range + 10;
    if (sx < boss.x + boss.w && sx + range > boss.x &&
        player.y < boss.y + boss.h && player.y + player.h > boss.y) {
      const dmg = getCurrentAttackDamage();
      boss.hp -= dmg;
      boss.hurtTimer = 10;
      boss.invuln = 12;
      spawnParticles(boss.x + 40, boss.y + 40, '#ffaaaa', 10);
      spawnDamageText(boss.x + 40, boss.y, dmg, '#ffee88');
      const fill = document.getElementById('boss-hp-fill');
      if (fill) fill.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
      if (boss.hp <= 0) {
        boss.dead = true;
        kills += 10; souls += 25; addXp(100);
        spawnParticles(boss.x + 40, boss.y + 40, '#ff4455', 30);
        showBanner('VICTORY!');
        document.getElementById('boss-ui').style.display = 'none';
        setTimeout(() => {
          gameState = 'dead';
          const msg = document.getElementById('message');
          msg.style.display = 'flex';
          msg.innerHTML = `<h1>Victory</h1><p>Void Knight defeated</p><p>Kills: ${kills} | Souls: ${souls}</p><button id="start-btn" type="button">Play Again</button>`;
          bindStartBtn();
        }, 800);
      }
    }
  }

  // contact damage
  if (player.invuln <= 0 &&
      player.x < boss.x + boss.w && player.x + player.w > boss.x &&
      player.y < boss.y + boss.h && player.y + player.h > boss.y) {
    player.hp -= 14;
    player.invuln = 40;
    document.getElementById('hp').textContent = Math.max(0, Math.floor(player.hp));
    if (player.hp <= 0) gameOver();
  }
}

// ---------- DRAW ----------
function drawHeroStrip(img, frames, fw, fh, x, y) {
  if (!img || img.naturalWidth < 10) {
    ctx.fillStyle = player.heroColor || '#9b7bff';
    ctx.fillRect(x, y, player.w, player.h);
    return;
  }
  const frame = Math.max(0, Math.min(frames - 1, player.animFrame));
  const pad = 6;
  const sx = frame * fw + pad;
  const sw = Math.max(1, fw - pad * 2);
  const drawW = 100, drawH = 130;
  const drawX = x + (player.w - drawW) / 2;
  const drawY = y + player.h - drawH + 2;
  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.45;
  if (player.facing < 0) {
    ctx.translate(drawX + drawW, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, 0, sw, fh, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(img, sx, 0, sw, fh, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawPlayer() {
  const x = player.x, y = player.y;
  if (player.heroId === 'lyra' && sprites.lyra && sprites.lyra.naturalWidth > 10) {
    drawHeroStrip(sprites.lyra, LYRA_FRAMES, LYRA_FW, LYRA_FH, x, y);
  } else if (player.heroId === 'kael' && sprites.kael && sprites.kael.naturalWidth > 10) {
    drawHeroStrip(sprites.kael, KAEL_FRAMES, KAEL_FW, KAEL_FH, x, y);
  } else {
    // placeholder for Vex / Nyx
    ctx.save();
    ctx.fillStyle = player.heroColor || '#888';
    ctx.fillRect(x + 15, y + 25, 40, 50);
    ctx.beginPath();
    ctx.arc(x + 35, y + 18, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText((HEROES[player.heroId] || {}).name || '?', x + 18, y - 4);
    ctx.restore();
  }
}

function drawEnemy(e) {
  if (e.type === 'skeleton') {
    drawSkeleton(e);
    return;
  }
  if (!sprites.leech || sprites.leech.naturalWidth < 10) {
    ctx.fillStyle = '#6a3090';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2 - cameraX, e.y + e.h / 2, e.w / 2, e.h / 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const frame = Math.max(0, Math.min(4, e.animFrame));
  const sx = frame * LEECH_FW;
  const dw = 72, dh = 62;
  const dx = e.x + (e.w - dw) / 2 - cameraX;
  const dy = e.y + e.h - dh;
  ctx.save();
  if (e.facing < 0) {
    ctx.translate(dx + dw, dy); ctx.scale(-1, 1);
    ctx.drawImage(sprites.leech, sx, 0, LEECH_FW, LEECH_FH, 0, 0, dw, dh);
  } else {
    ctx.drawImage(sprites.leech, sx, 0, LEECH_FW, LEECH_FH, dx, dy, dw, dh);
  }
  ctx.restore();
}

function drawSkeleton(e) {
  const x = e.x - cameraX, y = e.y, w = e.w, h = e.h;
  ctx.save();
  if (e.facing < 0) { ctx.translate(x + w, y); ctx.scale(-1, 1); }
  else ctx.translate(x, y);
  ctx.fillStyle = e.hurtTimer > 0 ? '#fff0f0' : '#e8e0d4';
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.18, w * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(w * 0.38, h * 0.14, 5, 5);
  ctx.fillRect(w * 0.55, h * 0.14, 5, 5);
  ctx.fillStyle = e.hurtTimer > 0 ? '#fff0f0' : '#d4cbb8';
  ctx.fillRect(w * 0.32, h * 0.32, w * 0.36, h * 0.32);
  ctx.strokeStyle = '#e8e0d4'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.36); ctx.lineTo(w * 0.08, h * 0.55);
  ctx.moveTo(w * 0.68, h * 0.36); ctx.lineTo(w * 0.92, h * 0.5);
  const swing = Math.sin(e.animTimer * 0.25) * 8;
  ctx.moveTo(w * 0.4, h * 0.64); ctx.lineTo(w * 0.35, h * 0.95);
  ctx.moveTo(w * 0.6, h * 0.64); ctx.lineTo(w * 0.65, h * 0.95 + swing);
  ctx.stroke();
  ctx.fillStyle = '#c4b8a0';
  ctx.fillRect(w * 0.88, h * 0.42, 10, 28);
  ctx.restore();
}

function drawBoss() {
  if (!boss || boss.dead) return;
  const x = boss.x - cameraX, y = boss.y;
  ctx.save();
  ctx.fillStyle = boss.hurtTimer > 0 ? '#ffaaaa' : (boss.color || '#aa2244');
  ctx.fillRect(x + 10, y + 20, boss.w - 20, boss.h - 20);
  ctx.beginPath();
  ctx.arc(x + boss.w / 2, y + 25, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0000';
  ctx.fillRect(x + boss.w / 2 - 12, y + 20, 8, 8);
  ctx.fillRect(x + boss.w / 2 + 4, y + 20, 8, 8);
  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (gameState === 'menu') return;

  ctx.save();
  ctx.translate(-cameraX, 0);

  // bg panels
  ctx.fillStyle = '#12121c';
  for (let i = 0; i < currentRoom.width; i += 200) {
    ctx.fillRect(i, 80, 120, 200);
  }

  // platforms
  ctx.fillStyle = '#2a2a3a';
  for (const p of platforms) {
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.fillStyle = '#2a2a3a';
  }

  // exit
  if (currentRoom.exit) {
    const g = currentRoom.exit;
    ctx.fillStyle = 'rgba(160,112,255,0.35)';
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = '#a070ff';
    ctx.strokeRect(g.x, g.y, g.w, g.h);
  }

  enemies.forEach(drawEnemy);
  drawBoss();

  ctx.restore();

  // player in screen space via camera already applied in enemies; player needs camera too
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawPlayer();
  ctx.restore();

  // particles screen-space adjusted
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const t of damageTexts) {
    ctx.globalAlpha = Math.max(0, t.life / 40);
    ctx.fillStyle = t.color;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(t.text, t.x - cameraX, t.y);
  }
  ctx.globalAlpha = 1;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function startGame() {
  applyHero(selectedHero);
  const menu = document.getElementById('message');
  if (menu) menu.style.display = 'none';
  document.getElementById('ui').style.display = 'flex';
  document.getElementById('controls').style.display = 'flex';
  const ln = document.getElementById('level-name');
  if (ln) ln.style.display = 'block';
  gameState = 'playing';
  kills = 0; souls = 0;
  player.level = 1; player.xp = 0; player.nextXp = 100;
  player.dashCooldown = 0; player.dashTimer = 0;
  document.getElementById('kills').textContent = '0';
  document.getElementById('souls').textContent = '0';
  enterRoom('level_1');
}

function gameOver() {
  gameState = 'dead';
  const msg = document.getElementById('message');
  msg.style.display = 'flex';
  msg.innerHTML = `<h1>You Fell</h1><p>${currentRoom.name}</p><p>Kills: ${kills} | Souls: ${souls} | Lv ${player.level}</p><button id="start-btn" type="button">Try Again</button>`;
  bindStartBtn();
}

function bindStartBtn() {
  const btn = document.getElementById('start-btn');
  if (!btn) return;
  const handler = (e) => {
    if (e) e.preventDefault();
    startGame();
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchend', handler, { passive: false });
}

setupJoystick();
bindStartBtn();
loadSprites(() => console.log('Sprites ready'));
loop();

document.querySelectorAll('.hero-card').forEach(card => {
  const select = (e) => {
    if (e && e.type === 'touchend') e.preventDefault();
    document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedHero = card.dataset.hero;
    applyHero(selectedHero);
  };
  card.addEventListener('click', select);
  card.addEventListener('touchend', select, { passive: false });
});
applyHero('kael');

['attack-btn', 'jump-btn', 'special-btn'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('touchstart', e => {
    e.preventDefault();
    if (id === 'attack-btn') tryAttack();
    if (id === 'jump-btn') tryJump();
    if (id === 'special-btn') tryDash();
  }, { passive: false });
  el.addEventListener('mousedown', () => {
    if (id === 'attack-btn') tryAttack();
    if (id === 'jump-btn') tryJump();
    if (id === 'special-btn') tryDash();
  });
});
