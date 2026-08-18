// =====================================================
// Shadow Survivors - Level 1: Dust of Champions
// Real sprites: Kael + Void Leech
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

// ---------- SPRITES ----------
const sprites = {
  kael: null,
  lyra: null,
  vex: null,
  nyx: null,
  leech: null,
  bg_arena: null,
  bg_ruins: null,
  bosses: null,
  loaded: 0,
  total: 8
};

function loadSprites(callback) {
  sprites.kael = new Image();
  sprites.lyra = new Image();
  sprites.vex = new Image();
  sprites.nyx = new Image();
  sprites.leech = new Image();
  sprites.bg_arena = new Image();
  sprites.bg_ruins = new Image();
  sprites.bosses = new Image();
  let pending = 8;

  function oneDone() {
    pending--;
    if (pending <= 0 && callback) callback();
  }

  sprites.kael.onload = oneDone;
  sprites.lyra.onload = oneDone;
  sprites.vex.onload = oneDone;
  sprites.nyx.onload = oneDone;
  sprites.leech.onload = oneDone;
  sprites.bg_arena.onload = oneDone;
  sprites.bg_ruins.onload = oneDone;
  sprites.bosses.onload = oneDone;

  sprites.kael.src = 'kael_sheet.png';
  sprites.lyra.src = 'lyra_sheet.png';
  sprites.vex.src = 'vex_sheet.png';
  sprites.nyx.src = 'nyx_sheet.png';
  sprites.leech.src = 'leech_sheet.png';
  sprites.bg_arena.src = 'bg_arena.png';
  sprites.bg_ruins.src = 'bg_ruins.png';
  sprites.bosses.src = 'bosses.png';

  function stripWhite(img, cb) {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const data = g.getImageData(0, 0, c.width, c.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], gv = d[i+1], b = d[i+2];
        if (r > 225 && gv > 225 && b > 225) d[i+3] = 0;
        else if (r > 195 && gv > 195 && b > 195 && Math.abs(r-gv) < 15 && Math.abs(gv-b) < 15) d[i+3] = 0;
      }
      g.putImageData(data, 0, 0);
      const out = new Image();
      out.onload = () => cb(out);
      out.src = c.toDataURL('image/png');
    } catch (e) {
      console.warn('strip failed', e);
      cb(img);
    }
  }

  sprites.kael.onload = function() {
    stripWhite(sprites.kael, function(cleaned) {
      sprites.kael = cleaned;
      KAEL_FW = Math.floor(cleaned.naturalWidth / 22) || 332;
      KAEL_FH = cleaned.naturalHeight || 388;
      console.log('Kael OK', KAEL_FW, 'x', KAEL_FH);
      oneDone();
    });
  };
  sprites.kael.onerror = function() { console.warn('Kael FAIL'); oneDone(); };

  sprites.leech.onload = function() {
    LEECH_FW = Math.floor(sprites.leech.naturalWidth / 5) || 64;
    LEECH_FH = sprites.leech.naturalHeight || 64;
    console.log('Leech OK', LEECH_FW, LEECH_FH);
    oneDone();
  };
  sprites.leech.onerror = function() { console.warn('Leech FAIL'); oneDone(); };

  sprites.kael.src = 'kael_sheet.png';
  sprites.leech.src = 'leech_sheet.png';
  sprites.lyra = new Image();
  sprites.lyra.onload = () => console.log('Lyra sheet OK', sprites.lyra.naturalWidth);
  sprites.lyra.src = 'lyra_sheet.png';
}





// Frame sizes auto-detected from sheet after load
// Kael: 6 frames  |  Leech: 5 frames
let KAEL_FW = 332, KAEL_FH = 388;  // full 22-pose sheet
let LEECH_FW = 64, LEECH_FH = 64;
let LYRA_FW = 128, LYRA_FH = 170;

function detectFrameSizes() { /* disabled - sizes set in loadSprites */ }

// ---------- STATE ----------
let gameRunning = false;
let kills = 0;
let souls = 0;
let cameraX = 0;
let levelComplete = false;


// ---------- HEROES (from character roster) ----------
const HEROES = {
  kael: {
    id: 'kael',
    name: 'Kael',
    role: 'Balanced DPS',
    weapon: 'Bare Hands',
    style: 'Martial Arts',
    color: '#9b7bff',
    quote: 'Discipline Creates Power.',
    hp: 100,
    walkSpeed: 2.6,
    runSpeed: 5.2,
    jumpForce: -11.8,
    doubleJumpForce: -10.5,
    damageMult: 1.0,
    attackRange: 78,
    // sprite uses Kael sheet
    useKaelSprite: true
  },
  lyra: {
    id: 'lyra',
    name: 'Lyra',
    role: 'Fast Assassin',
    weapon: 'Twin Daggers',
    style: 'Ninjutsu',
    color: '#e080ff',
    quote: "Strike Before You're Seen.",
    hp: 80,
    walkSpeed: 3.2,
    runSpeed: 6.4,
    jumpForce: -12.2,
    doubleJumpForce: -11.0,
    damageMult: 0.9,
    attackRange: 70,
    useKaelSprite: false,
    bodyColor: '#2a1035',
    accent: '#c040ff'
  },
  vex: {
    id: 'vex',
    name: 'Vex',
    role: 'Heavy Tank',
    weapon: 'Gauntlets',
    style: 'Brawler',
    color: '#ff6644',
    quote: 'Stand. Break. Protect.',
    hp: 160,
    walkSpeed: 2.0,
    runSpeed: 4.0,
    jumpForce: -10.5,
    doubleJumpForce: -9.5,
    damageMult: 1.35,
    attackRange: 85,
    useKaelSprite: false,
    bodyColor: '#4a2010',
    accent: '#ff4422'
  },
  nyx: {
    id: 'nyx',
    name: 'Nyx',
    role: 'Ranged DPS',
    weapon: 'Energy Pistols',
    style: 'Tech & Magic',
    color: '#66aaff',
    quote: 'Precision. Power. Oblivion.',
    hp: 85,
    walkSpeed: 2.8,
    runSpeed: 5.5,
    jumpForce: -11.5,
    doubleJumpForce: -10.2,
    damageMult: 1.1,
    attackRange: 160,
    useKaelSprite: false,
    bodyColor: '#1a1a2e',
    accent: '#4488ff'
  }
};

let selectedHero = 'kael';

function applyHero(id) {
  const h = HEROES[id] || HEROES.kael;
  selectedHero = h.id;
  player.maxHp = h.hp;
  player.hp = h.hp;
  player.walkSpeed = h.walkSpeed;
  player.runSpeed = h.runSpeed;
  player.jumpForce = h.jumpForce;
  player.doubleJumpForce = h.doubleJumpForce;
  player.damageMult = h.damageMult || 1;
  player.attackRange = h.attackRange || 78;
  player.heroId = h.id;
  player.heroColor = h.color;
  const wl = document.getElementById('weapon-label');
  if (wl) wl.textContent = h.weapon;
  const hpEl = document.getElementById('hp');
  if (hpEl) hpEl.textContent = Math.floor(player.hp);
}

// ---------- PLAYER ----------
const player = {
  x: 120, y: 0, w: 70, h: 100,
  vx: 0, vy: 0,
  speed: 4.4,
  walkSpeed: 2.6,
  runSpeed: 5.2,
  running: false,
  jumpForce: -11.8,
  doubleJumpForce: -10.5,
  onGround: false,
  jumpsLeft: 2,
  facing: 1,
  hp: 100, maxHp: 100,
  invuln: 0,
  attacking: false,
  attackTimer: 0,
  attackType: 0,
  comboCount: 0,
  comboTimer: 0,
  lastAttackTime: 0,
  damageMult: 1,
  attackRange: 78,
  heroId: 'kael',
  heroColor: '#9b7bff',
  animFrame: 0,
  _jumpHeld: false
};

const COMBO_WINDOW = 55;
const ATTACKS = {
  jab:      { damage: 8,  range: 55, knockback: 2.2, duration: 14 },
  cross:    { damage: 14, range: 62, knockback: 4.5, duration: 18 },
  spinKick: { damage: 22, range: 72, knockback: 7.0, duration: 24 },
  heavy:    { damage: 26, range: 65, knockback: 8.5, duration: 28 }
};

function getComboMultiplier() {
  if (player.comboCount >= 3) return 1.35;
  if (player.comboCount >= 2) return 1.15;
  return 1.0;
}

function updateComboUI() {
  const counter = document.getElementById('combo-counter');
  const num = document.getElementById('combo-num');
  const multEl = document.getElementById('combo-mult');
  if (!counter || !num) return;
  if (player.comboCount >= 2) {
    counter.style.display = 'block';
    num.textContent = player.comboCount;
    const m = getComboMultiplier();
    if (multEl) multEl.textContent = m > 1 ? `x${m.toFixed(2)}` : '';
  } else {
    counter.style.display = 'none';
    if (multEl) multEl.textContent = '';
  }
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
    player.animFrame = 15;
  } else {
    player.comboCount = Math.min(player.comboCount + 1, 3);
    player.comboTimer = COMBO_WINDOW;
    if (type === 1) { player.attackTimer = ATTACKS.jab.duration; player.animFrame = 8; }
    else if (type === 2) { player.attackTimer = ATTACKS.cross.duration; player.animFrame = 9; }
    else { player.attackTimer = ATTACKS.spinKick.duration; player.animFrame = 10; }
  }

  updateComboUI();

  const comboEl = document.getElementById('combo-display');
  if (player.comboCount === 3 && type === 3) {
    comboEl.textContent = '3-HIT COMBO!';
    comboEl.style.opacity = 1;
    setTimeout(() => comboEl.style.opacity = 0, 900);
  } else if (type === 4) {
    comboEl.textContent = 'HEAVY FIST!';
    comboEl.style.opacity = 1;
    setTimeout(() => comboEl.style.opacity = 0, 700);
  }
}

function getCurrentAttackDamage() {
  let base = 8;
  if (player.attackType === 1) base = ATTACKS.jab.damage;
  else if (player.attackType === 2) base = ATTACKS.cross.damage;
  else if (player.attackType === 3) base = ATTACKS.spinKick.damage;
  else if (player.attackType === 4) base = ATTACKS.heavy.damage;
  return Math.round(base * getComboMultiplier());
}

// ---------- LEVEL ----------
const LEVEL_WIDTH = 2000;
const platforms = [
  { x: 0, y: 340, w: 2000, h: 50 },
  { x: 420, y: 270, w: 120, h: 18 },
  { x: 620, y: 220, w: 100, h: 18 },
  { x: 980, y: 280, w: 140, h: 18 },
  { x: 1250, y: 230, w: 110, h: 18 },
  { x: 1550, y: 270, w: 130, h: 18 },
  { x: 1780, y: 300, w: 160, h: 20 }
];
const exitGate = { x: 1860, y: 230, w: 50, h: 70 };

let enemies = [];
let particles = [];

function createSkeleton(x, y) {
  return {
    type: 'skeleton',
    x, y, w: 48, h: 70,
    hp: 40, maxHp: 40,
    speed: 1.4 + Math.random() * 0.4,
    facing: -1,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    dead: false,
    deathTimer: 0,
    attackCooldown: 0
  };
}

function createLeech(x, y) {
  return {
    type: 'leech',
    x, y, w: 64, h: 56,
    hp: 28, maxHp: 28,
    speed: 1.15 + Math.random() * 0.3,
    facing: -1,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    dead: false,
    deathTimer: 0
  };
}

function setupLevel1() {
  enemies = [];
  particles = [];
  kills = 0;
  souls = 0;
  levelComplete = false;
  cameraX = 0;

  player.x = 100;
  player.y = 240;
  player.vx = 0;
  player.vy = 0;
  player.hp = 100;
  player.jumpsLeft = 2;
  player.comboCount = 0;
  player.attacking = false;
  player.invuln = 0;
  player.animFrame = 0;

  enemies.push(createLeech(380, 300));
  enemies.push(createLeech(500, 300));
  enemies.push(createSkeleton(650, 280));
  enemies.push(createLeech(780, 190));
  enemies.push(createSkeleton(900, 280));
  enemies.push(createLeech(1050, 300));
  enemies.push(createSkeleton(1180, 280));
  enemies.push(createLeech(1300, 200));
  enemies.push(createSkeleton(1400, 280));
  enemies.push(createLeech(1550, 300));
  enemies.push(createSkeleton(1650, 280));
  enemies.push(createLeech(1750, 300));
  enemies.push(createSkeleton(1700, 220));
  enemies.push(createLeech(1480, 300));

  document.getElementById('hp').textContent = 100;
  document.getElementById('kills').textContent = 0;
  document.getElementById('souls').textContent = 0;
  updateComboUI();
}

function spawnParticles(x, y, color, n = 8, type = 'hit') {
  for (let i = 0; i < n; i++) {
    let vx, vy, size, life, gravity = 0;
    if (type === 'hit') {
      vx = (Math.random() - 0.5) * 9;
      vy = (Math.random() - 0.5) * 9;
      size = 2.5 + Math.random() * 3.5;
      life = 12 + Math.random() * 10;
    } else if (type === 'death') {
      vx = (Math.random() - 0.5) * 11;
      vy = (Math.random() - 0.7) * 9;
      size = 3.5 + Math.random() * 4;
      life = 18 + Math.random() * 14;
      gravity = 0.18;
    } else {
      vx = (Math.random() - 0.5) * 6;
      vy = (Math.random() - 0.5) * 6;
      size = 2.5 + Math.random() * 3;
      life = 12 + Math.random() * 10;
    }
    particles.push({ x, y, vx, vy, life, maxLife: life, color, size, gravity });
  }
}

// ---------- INPUT ----------
const keys = {};
let joyDX = 0, joyActive = false;
// Double-tap direction = run
let lastDirTap = 0;      // -1 left, 1 right, 0 none
let lastDirTapTime = 0;
const DIR_TAP_MS = 280;


window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (!keys[k]) {
    // fresh press for double-tap detect
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
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function setupJoystick() {
  const area = document.getElementById('joystick-area');
  const knob = document.getElementById('joystick-knob');
  const base = document.getElementById('joystick-base');
  let cx, cy;

  function start(e) {
    e.preventDefault();
    joyActive = true;
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  }
  function move(e) {
    if (!joyActive) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    let dx = t.clientX - cx;
    let dy = t.clientY - cy;
    const max = 32;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joyDX = dx / max;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function end() {
    joyActive = false;
    joyDX = 0;
    knob.style.transform = 'translate(0,0)';
  }
  area.addEventListener('touchstart', start, { passive: false });
  area.addEventListener('touchmove', move, { passive: false });
  area.addEventListener('touchend', end);
  area.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}

function tryAttack() {
  if (player.attackTimer > 6) return;
  let type = 1;
  if (player.comboCount === 1 && player.comboTimer > 0) type = 2;
  else if (player.comboCount === 2 && player.comboTimer > 0) type = 3;
  registerAttack(type);
}

function tryHeavy() {
  if (player.attackTimer > 4) return;
  registerAttack(4);
}

function tryJump() {
  if (player.jumpsLeft <= 0) return;
  if (player.onGround) {
    player.vy = player.jumpForce;
    player.jumpsLeft = 1;
    spawnParticles(player.x + player.w / 2, player.y + player.h, '#8888aa', 5, 'hit');
  } else {
    player.vy = player.doubleJumpForce;
    player.jumpsLeft = 0;
    spawnParticles(player.x + player.w / 2, player.y + player.h, '#a070ff', 7, 'hit');
  }
  player.onGround = false;
}

document.getElementById('attack-btn').addEventListener('touchstart', e => { e.preventDefault(); tryAttack(); });
document.getElementById('attack-btn').addEventListener('mousedown', tryAttack);
document.getElementById('jump-btn').addEventListener('touchstart', e => { e.preventDefault(); tryJump(); });
document.getElementById('jump-btn').addEventListener('mousedown', tryJump);
document.getElementById('special-btn').addEventListener('touchstart', e => { e.preventDefault(); tryHeavy(); });
document.getElementById('special-btn').addEventListener('mousedown', tryHeavy);

// ---------- UPDATE ----------
function update() {
  if (!gameRunning || levelComplete) return;

  let move = 0;
  if (keys['a'] || keys['arrowleft']) move = -1;
  if (keys['d'] || keys['arrowright']) move = 1;
  if (joyActive) move = joyDX;

  // Keyboard double-tap run
  const now = performance.now();
  if (keys['a'] || keys['arrowleft']) {
  }
  if (keys['d'] || keys['arrowright']) {
  }
  // Joystick: push far = run, mild = walk
  if (joyActive) {
    player.running = Math.abs(joyDX) > 0.65;
  }
  if (Math.abs(move) < 0.15) {
    player.running = false;
  }

  if (Math.abs(move) > 0.15) {
    const spd = player.running ? player.runSpeed : player.walkSpeed;
    player.vx = move * spd;
    player.facing = move > 0 ? 1 : -1;
  } else {
    player.vx *= 0.78;
  }

  if (keys['w'] || keys['arrowup'] || keys[' ']) {
    if (!player._jumpHeld) { tryJump(); player._jumpHeld = true; }
  } else {
    player._jumpHeld = false;
  }

  player.vy += 0.55;
  if (player.vy > 14) player.vy = 14;

  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;
  for (const p of platforms) {
    if (player.x + player.w > p.x && player.x < p.x + p.w &&
        player.y + player.h > p.y && player.y + player.h < p.y + 22 &&
        player.vy >= 0) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumpsLeft = 2;
    }
  }

  if (player.x < 0) player.x = 0;
  if (player.x > LEVEL_WIDTH - player.w) player.x = LEVEL_WIDTH - player.w;
  if (player.y > canvas.height + 80) {
    player.hp -= 20;
    player.x = 120; player.y = 220; player.vy = 0;
    if (player.hp <= 0) return gameOver();
  }

  if (player.attackTimer > 0) {
    player.attackTimer--;
  } else {
    player.attacking = false;
  }

  // 22-pose sheet animation map
  if (player.invuln > 20) {
    player.animFrame = 12;
  } else if (player.attacking) {
  } else if (!player.onGround) {
    player.animFrame = (player.jumpsLeft <= 0) ? 6 : 5;
  } else if (Math.abs(player.vx) > 0.8) {
    const t2 = Math.floor(performance.now() / 90) % 4;
    player.animFrame = [1, 2, 3, 4][t2];
  } else {
    player.animFrame = 0;
  }

  if (player.comboTimer > 0) {
    player.comboTimer--;
    if (player.comboTimer <= 0) {
      player.comboCount = 0;
      updateComboUI();
    }
  }
  if (player.invuln > 0) player.invuln--;

  cameraX = player.x - canvas.width * 0.35;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > LEVEL_WIDTH - canvas.width) cameraX = Math.max(0, LEVEL_WIDTH - canvas.width);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dead) {
      e.deathTimer++;
      e.animFrame = 4;
      if (e.deathTimer > 28) enemies.splice(i, 1);
      continue;
    }

    const dx = player.x - e.x;
    e.facing = dx > 0 ? 1 : -1;

    if (e.hurtTimer > 0) {
      e.hurtTimer--;
      e.animFrame = 3;
    } else {
      e.x += e.facing * e.speed;
      e.animTimer++;
      e.animFrame = (e.animTimer % 20 < 10) ? 0 : 1;
      if (Math.abs(dx) < 70 && Math.random() < 0.01) {
        e.x += e.facing * 16;
        e.animFrame = 2;
      }
    }

    e.y += 5;
    for (const p of platforms) {
      if (e.x + e.w > p.x && e.x < p.x + p.w &&
          e.y + e.h > p.y && e.y + e.h < p.y + 18) {
        e.y = p.y - e.h;
      }
    }

    if (player.attacking && player.attackTimer > 4) {
      const atk = player.attackType === 1 ? ATTACKS.jab :
                  player.attackType === 2 ? ATTACKS.cross :
                  player.attackType === 3 ? ATTACKS.spinKick : ATTACKS.heavy;
      const sx = player.facing > 0 ? player.x + player.w - 10 : player.x - atk.range + 10;
      if (sx < e.x + e.w && sx + atk.range > e.x &&
          player.y < e.y + e.h && player.y + player.h > e.y) {
        e.hp -= getCurrentAttackDamage();
        e.hurtTimer = 14;
        e.x += player.facing * atk.knockback * 3;
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#c9a0ff', 6, 'hit');

        if (e.hp <= 0) {
          e.dead = true;
          e.deathTimer = 0;
          kills++;
          souls += 4 + (player.comboCount >= 3 ? 2 : 0);
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#a070ff', 14, 'death');
          document.getElementById('kills').textContent = kills;
          document.getElementById('souls').textContent = souls;
        }
      }
    }

    if (player.invuln <= 0 && !e.dead &&
        player.x < e.x + e.w && player.x + player.w > e.x &&
        player.y < e.y + e.h && player.y + player.h > e.y) {
      player.hp -= 9;
      player.invuln = 35;
      player.animFrame = 7;
      spawnParticles(player.x + 20, player.y + 28, '#ff5555', 8, 'hit');
      if (player.hp <= 0) return gameOver();
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (player.x + player.w > exitGate.x && player.x < exitGate.x + exitGate.w &&
      player.y + player.h > exitGate.y && player.y < exitGate.y + exitGate.h) {
    levelComplete = true;
    gameRunning = false;
    const msg = document.getElementById('message');
    msg.style.display = 'flex';
    msg.innerHTML = `
      <h1>Level 1 Complete</h1>
      <p>Dust of Champions cleared</p>
      <p>Kills: ${kills} | Souls: ${souls}</p>
      <p style="margin-top:8px;color:#aaa;font-size:13px">The arena is collapsing… keep moving!</p>
      <button id="start-btn">Play Again</button>
    `;
    document.getElementById('start-btn').onclick = startGame;
  }

  document.getElementById('hp').textContent = Math.max(0, Math.floor(player.hp));
}

// ---------- DRAW ----------


function drawLyra(x, y) {
  LYRA_FW = Math.floor(sprites.lyra.naturalWidth / 10) || 128;
  LYRA_FH = sprites.lyra.naturalHeight || 170;
  let frame = Math.max(0, Math.min(9, player.animFrame));
  // map kael-style animFrame to lyra 0-9
  if (player.invuln > 20) frame = 9;
  else if (player.attacking) frame = Math.min(8, 5 + (player.attackType || 0));
  else if (!player.onGround) frame = 3;
  else if (Math.abs(player.vx) > 0.8) frame = player.running ? 2 : 1;
  else frame = 0;
  const pad = 6;
  const sx = frame * LYRA_FW + pad;
  const sw = LYRA_FW - pad * 2;
  const drawW = 100, drawH = 130;
  const drawX = x + (player.w - drawW) / 2;
  const drawY = y + player.h - drawH + 2;
  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.45;
  if (player.facing < 0) {
    ctx.translate(drawX + drawW, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(sprites.lyra, sx, 0, sw, LYRA_FH, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(sprites.lyra, sx, 0, sw, LYRA_FH, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawVex(x, y) {
  VEX_FW = Math.floor(sprites.vex.naturalWidth / 10) || 128;
  const frame = Math.max(0, Math.min(9, player.animFrame));
  const pad = 6;
  const sx = frame * VEX_FW + pad;
  const sw = VEX_FW - pad * 2;
  const drawW = 100, drawH = 130;
  const drawX = x + (player.w - drawW) / 2;
  const drawY = y + player.h - drawH + 2;
  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.45;
  if (player.facing < 0) {
    ctx.translate(drawX + drawW, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(sprites.vex, sx, 0, sw, sprites.vex.naturalHeight, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(sprites.vex, sx, 0, sw, sprites.vex.naturalHeight, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawNyx(x, y) {
  NYX_FW = Math.floor(sprites.nyx.naturalWidth / 10) || 128;
  const frame = Math.max(0, Math.min(9, player.animFrame));
  const pad = 6;
  const sx = frame * NYX_FW + pad;
  const sw = NYX_FW - pad * 2;
  const drawW = 100, drawH = 130;
  const drawX = x + (player.w - drawW) / 2;
  const drawY = y + player.h - drawH + 2;
  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.45;
  if (player.facing < 0) {
    ctx.translate(drawX + drawW, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(sprites.nyx, sx, 0, sw, sprites.nyx.naturalHeight, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(sprites.nyx, sx, 0, sw, sprites.nyx.naturalHeight, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawHeroFallback(x, y) {
  const h = HEROES[player.heroId] || HEROES.kael;
  const col = h.accent || h.color || '#9b7bff';
  const body = h.bodyColor || '#333';
  ctx.save();
  if (player.facing < 0) {
    ctx.translate(x + player.w, y);
    ctx.scale(-1, 1);
    x = 0; y = 0;
  }
  // simple stylized body
  ctx.fillStyle = body;
  ctx.fillRect(x + 18, y + 28, 34, 42);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x + 35, y + 18, 14, 0, Math.PI * 2);
  ctx.fill();
  // arms / weapon hint
  ctx.strokeStyle = col;
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (player.attacking) {
    ctx.moveTo(x + 50, y + 40);
    ctx.lineTo(x + 75, y + 35);
  } else {
    ctx.moveTo(x + 18, y + 40);
    ctx.lineTo(x + 8, y + 55);
    ctx.moveTo(x + 52, y + 40);
    ctx.lineTo(x + 62, y + 55);
  }
  ctx.stroke();
  // legs
  ctx.beginPath();
  ctx.moveTo(x + 25, y + 70);
  ctx.lineTo(x + 22, y + 95);
  ctx.moveTo(x + 42, y + 70);
  ctx.lineTo(x + 48, y + 95);
  ctx.stroke();
  // name tag
  ctx.fillStyle = '#fff';
  ctx.font = '10px sans-serif';
  ctx.fillText(h.name, x + 20, y - 4);
  ctx.restore();
}

function drawKael(x, y) {

  if (player.heroId === 'lyra' && sprites.lyra && sprites.lyra.naturalWidth > 10) {
    drawLyra(x, y);
    return;
  }
  if (player.heroId === 'vex' && sprites.vex && sprites.vex.naturalWidth > 10) {
    drawVex(x, y);
    return;
  }
  if (player.heroId === 'nyx' && sprites.nyx && sprites.nyx.naturalWidth > 10) {
    drawNyx(x, y);
    return;
  }
  if (player.heroId && player.heroId !== 'kael') {
    drawHeroFallback(x, y);
    return;
  }

  if (!sprites.kael || sprites.kael.naturalWidth < 10) {
    ctx.fillStyle = '#9b6dff';
    ctx.fillRect(x, y, player.w, player.h);
    return;
  }

  const frame = Math.max(0, Math.min(21, player.animFrame));
  // Small inset to avoid next-frame leg bleed
  const pad = 10;
  const sx = frame * KAEL_FW + pad;
  const sy = 0;
  const sw = KAEL_FW - pad * 2;
  const sh = KAEL_FH;

  // Full body, large, feet on ground
  const drawW = 110;
  const drawH = 130;
  const drawX = x + (player.w - drawW) / 2;
  const drawY = y + player.h - drawH + 2;

  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.45;

  if (player.facing < 0) {
    ctx.translate(drawX + drawW, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(sprites.kael, sx, sy, sw, sh, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(sprites.kael, sx, sy, sw, sh, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawEnemy(e) {
  if (e.type === 'skeleton') {
    drawSkeleton(e);
    return;
  }
  // Leech - larger, cleaner
  if (!sprites.leech || sprites.leech.naturalWidth < 10) {
    ctx.fillStyle = '#6a3090';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w/2, e.y + e.h/2, e.w/2, e.h/2.2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#c9a0ff';
    ctx.beginPath();
    ctx.arc(e.x + e.w/2 + e.facing*6, e.y + e.h/2 - 4, 6, 0, Math.PI*2);
    ctx.fill();
    return;
  }
  const frame = Math.max(0, Math.min(4, e.animFrame));
  const sx = frame * LEECH_FW;
  const dw = 72, dh = 62;
  const dx = e.x + (e.w - dw) / 2;
  const dy = e.y + e.h - dh;
  ctx.save();
  if (e.facing < 0) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(sprites.leech, sx, 0, LEECH_FW, LEECH_FH, 0, 0, dw, dh);
  } else {
    ctx.drawImage(sprites.leech, sx, 0, LEECH_FW, LEECH_FH, dx, dy, dw, dh);
  }
  ctx.restore();
}

function drawSkeleton(e) {
  const x = e.x, y = e.y, w = e.w, h = e.h;
  ctx.save();
  if (e.facing < 0) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }
  // body
  ctx.fillStyle = e.hurtTimer > 0 ? '#fff0f0' : '#e8e0d4';
  // head
  ctx.beginPath();
  ctx.arc(w*0.5, h*0.18, w*0.22, 0, Math.PI*2);
  ctx.fill();
  // eyes
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(w*0.38, h*0.14, 5, 5);
  ctx.fillRect(w*0.55, h*0.14, 5, 5);
  // torso
  ctx.fillStyle = e.hurtTimer > 0 ? '#fff0f0' : '#d4cbb8';
  ctx.fillRect(w*0.32, h*0.32, w*0.36, h*0.32);
  // ribs
  ctx.strokeStyle = '#a09080';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(w*0.35, h*0.38 + i*7);
    ctx.lineTo(w*0.65, h*0.38 + i*7);
    ctx.stroke();
  }
  // arms
  ctx.strokeStyle = '#e8e0d4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w*0.32, h*0.36);
  ctx.lineTo(w*0.08, h*0.55);
  ctx.moveTo(w*0.68, h*0.36);
  ctx.lineTo(w*0.92, h*0.5);
  ctx.stroke();
  // legs (walk cycle)
  const swing = Math.sin(e.animTimer * 0.25) * 8;
  ctx.beginPath();
  ctx.moveTo(w*0.4, h*0.64);
  ctx.lineTo(w*0.35, h*0.95 + (e.animFrame===1?swing:0));
  ctx.moveTo(w*0.6, h*0.64);
  ctx.lineTo(w*0.65, h*0.95 - (e.animFrame===1?swing:0));
  ctx.stroke();
  // bone club
  ctx.fillStyle = '#c4b8a0';
  ctx.fillRect(w*0.88, h*0.42, 10, 28);
  ctx.beginPath();
  ctx.arc(w*0.93, h*0.4, 7, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function draw() {
  if (sprites.bg_arena && sprites.bg_ruins && sprites.bg_arena.naturalWidth > 0) {
     if (currentRoom && currentRoom.bgType === 'ruins') {
         ctx.drawImage(sprites.bg_ruins, 0, 0, canvas.width, canvas.height);
     } else {
         ctx.drawImage(sprites.bg_arena, 0, 0, canvas.width, canvas.height);
     }
  } else {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#12121f';
    for (let i = 0; i < 7; i++) {
      const bx = ((i * 220) - cameraX * 0.2) % (canvas.width + 250) - 120;
      ctx.fillRect(bx, 40 + (i % 3) * 35, 140, 160);
    }
    ctx.fillStyle = 'rgba(120, 40, 180, 0.12)';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.7, 60, 90, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  platforms.forEach(p => {
    ctx.fillStyle = '#1c1c2c';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(p.x, p.y, p.w, 5);
  });

  ctx.fillStyle = '#2a1a4a';
  ctx.fillRect(exitGate.x, exitGate.y, exitGate.w, exitGate.h);
  ctx.fillStyle = 'rgba(160, 80, 255, 0.55)';
  ctx.fillRect(exitGate.x + 8, exitGate.y + 10, 34, 50);
  ctx.fillStyle = '#c9a0ff';
  ctx.font = '12px sans-serif';
  ctx.fillText('EXIT', exitGate.x + 10, exitGate.y - 8);

  enemies.forEach(e => drawEnemy(e));
  drawKael(player.x, player.y);

  particles.forEach(p => {
    const alpha = Math.max(0, p.life / (p.maxLife || 20));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (p.size || 3) * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function startGame() {
  applyHero(selectedHero);
  document.getElementById('message').style.display = 'none';
  gameRunning = true;
  setupLevel1();
}

function gameOver() {
  gameRunning = false;
  const msg = document.getElementById('message');
  msg.style.display = 'flex';
  msg.innerHTML = `
    <h1>You Fell</h1>
    <p>Level 1 – Dust of Champions</p>
    <p>Kills: ${kills} | Souls: ${souls}</p>
    <button id="start-btn">Try Again</button>
  `;
  document.getElementById('start-btn').onclick = startGame;
}

setupJoystick();
document.getElementById('start-btn').onclick = startGame;
loadSprites(() => console.log('Sprites ready'));
loop();


// Hero select cards
document.querySelectorAll('.hero-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedHero = card.dataset.hero;
    applyHero(selectedHero);
  });
});
applyHero('kael');
