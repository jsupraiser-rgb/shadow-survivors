// =====================================================
// Shadow Survivors - Pre-Alpha
// Heroes, Metroidvania Rooms, Survival Combat
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

// ---------- HERO DATA ----------
const HEROES = {
  kael: {
    name: 'Kael', weapon: 'Bare Hands', color: '#a070ff',
    speed: 4.4, hp: 120, jumpForce: -11.8, dashSpeed: 12,
    attacks: {
      jab:      { damage: 8,  range: 55, knockback: 2.2, duration: 14 },
      cross:    { damage: 14, range: 62, knockback: 4.5, duration: 18 },
      spinKick: { damage: 22, range: 72, knockback: 7.0, duration: 24 },
      heavy:    { damage: 26, range: 65, knockback: 8.5, duration: 28 }
    }
  },
  echo: {
    name: 'Echo', weapon: 'Katana', color: '#40c0ff',
    speed: 5.2, hp: 90, jumpForce: -12.5, dashSpeed: 15,
    attacks: {
      jab:      { damage: 12, range: 70, knockback: 1.5, duration: 12 },
      cross:    { damage: 18, range: 80, knockback: 2.5, duration: 16 },
      spinKick: { damage: 28, range: 90, knockback: 4.0, duration: 20 },
      heavy:    { damage: 35, range: 100, knockback: 6.0, duration: 30 }
    }
  },
  nyx: {
    name: 'Nyx', weapon: 'Daggers', color: '#ff4040',
    speed: 6.0, hp: 80, jumpForce: -11.5, dashSpeed: 18,
    attacks: {
      jab:      { damage: 6,  range: 45, knockback: 1.0, duration: 8 },
      cross:    { damage: 10, range: 50, knockback: 1.5, duration: 10 },
      spinKick: { damage: 16, range: 55, knockback: 2.0, duration: 14 },
      heavy:    { damage: 24, range: 60, knockback: 4.0, duration: 20 }
    }
  },
  orion: {
    name: 'Orion', weapon: 'Staff', color: '#ffc040',
    speed: 3.8, hp: 100, jumpForce: -10.5, dashSpeed: 10,
    attacks: {
      jab:      { damage: 15, range: 90, knockback: 3.0, duration: 18 },
      cross:    { damage: 20, range: 100, knockback: 5.0, duration: 22 },
      spinKick: { damage: 30, range: 110, knockback: 8.0, duration: 30 },
      heavy:    { damage: 45, range: 150, knockback: 12.0, duration: 40 }
    }
  }
};

let currentHero = 'kael';

// ---------- SPRITES ----------
const sprites = { kael: null, leech: null, loaded: 0, total: 2 };
let KAEL_FW = 128, KAEL_FH = 170;
let LEECH_FW = 64, LEECH_FH = 64;

function loadSprites(callback) {
  sprites.kael = new Image();
  sprites.leech = new Image();
  let pending = 2;

  function oneDone() {
    pending--;
    if (pending <= 0 && callback) callback();
  }

  function stripWhite(img, cb) {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const data = g.getImageData(0, 0, c.width, c.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], gv = d[i+1], b = d[i+2];
        if (r > 225 && gv > 225 && b > 225) d[i+3] = 0;
        else if (r > 195 && gv > 195 && b > 195 && Math.abs(r-gv) < 15 && Math.abs(gv-b) < 15) d[i+3] = 0;
      }
      g.putImageData(data, 0, 0);
      const out = new Image(); out.onload = () => cb(out); out.src = c.toDataURL('image/png');
    } catch (e) { cb(img); }
  }

  sprites.kael.onload = function() {
    stripWhite(sprites.kael, function(cleaned) {
      sprites.kael = cleaned;
      KAEL_FW = Math.floor(cleaned.naturalWidth / 10) || 128;
      KAEL_FH = cleaned.naturalHeight || 170;
      oneDone();
    });
  };
  sprites.kael.onerror = oneDone;
  sprites.leech.onload = function() {
    LEECH_FW = Math.floor(sprites.leech.naturalWidth / 5) || 64;
    LEECH_FH = sprites.leech.naturalHeight || 64;
    oneDone();
  };
  sprites.leech.onerror = oneDone;

  sprites.kael.src = 'kael_sheet.png';
  sprites.leech.src = 'leech_sheet.png';
}

// ---------- STATE ----------
let gameState = 'hero_select'; // hero_select, intro, playing, dead, transition
let kills = 0, souls = 0;
let cameraX = 0, cameraY = 0;
let roomTimer = 0;

// ---------- PLAYER ----------
const player = {
  x: 120, y: 0, w: 70, h: 100,
  vx: 0, vy: 0,
  facing: 1,
  hp: 100, maxHp: 100,
  invuln: 0,
  onGround: false, jumpsLeft: 2,
  attacking: false, attackTimer: 0, attackType: 0,
  comboCount: 0, comboTimer: 0, lastAttackTime: 0,
  animFrame: 0,
  _jumpHeld: false,
  dashing: 0, dashCooldown: 0
};

const COMBO_WINDOW = 55;

function getHeroStats() { return HEROES[currentHero]; }

function getComboMultiplier() {
  if (player.comboCount >= 3) return 1.35;
  if (player.comboCount >= 2) return 1.15;
  return 1.0;
}

function updateComboUI() {
  const counter = document.getElementById('combo-counter');
  const num = document.getElementById('combo-num');
  const multEl = document.getElementById('combo-mult');
  if (player.comboCount >= 2) {
    counter.style.display = 'block';
    num.textContent = player.comboCount;
    const m = getComboMultiplier();
    if (multEl) multEl.textContent = m > 1 ? `x${m.toFixed(2)}` : '';
  } else {
    counter.style.display = 'none';
  }
}

function registerAttack(type) {
  if (player.dashing > 0) return;
  const now = performance.now();
  if (now - player.lastAttackTime > 750) player.comboCount = 0;

  const stats = getHeroStats();
  const atkStats = type === 1 ? stats.attacks.jab : type === 2 ? stats.attacks.cross : type === 3 ? stats.attacks.spinKick : stats.attacks.heavy;

  player.lastAttackTime = now;
  player.attacking = true;
  player.attackType = type;
  player.attackTimer = atkStats.duration;

  if (type === 4) {
    player.comboCount = 0;
    player.animFrame = 8;
  } else {
    player.comboCount = Math.min(player.comboCount + 1, 3);
    player.comboTimer = COMBO_WINDOW;
    player.animFrame = type === 1 ? 5 : type === 2 ? 6 : 7;
  }
  updateComboUI();
}

function getCurrentAttackDamage() {
  const stats = getHeroStats();
  let base = 8;
  if (player.attackType === 1) base = stats.attacks.jab.damage;
  else if (player.attackType === 2) base = stats.attacks.cross.damage;
  else if (player.attackType === 3) base = stats.attacks.spinKick.damage;
  else if (player.attackType === 4) base = stats.attacks.heavy.damage;
  return Math.round(base * getComboMultiplier());
}

// ---------- WORLD & ROOMS ----------
let currentRoom = null;

const ROOMS = {
  start_ruins: {
    name: 'The Shadow Ruins',
    width: 2000, height: 600,
    platforms: [
      { x: 0, y: 440, w: 2000, h: 160 },
      { x: 420, y: 340, w: 120, h: 20 },
      { x: 620, y: 240, w: 100, h: 20 },
      { x: 980, y: 340, w: 140, h: 20 },
      { x: 1250, y: 260, w: 110, h: 20 }
    ],
    gates: [
      { x: 1900, y: 340, w: 60, h: 100, dest: 'arena_1', type: 'exit' }
    ],
    bgType: 'ruins',
    onEnter: () => {
      // Spawn a few initial enemies
      enemies.push(createLeech(800, 400));
      enemies.push(createLeech(1200, 400));
    }
  },
  arena_1: {
    name: 'Survival Arena - The Pit',
    width: 1200, height: 600,
    platforms: [
      { x: 0, y: 500, w: 1200, h: 100 },
      { x: 200, y: 380, w: 150, h: 20 },
      { x: 850, y: 380, w: 150, h: 20 },
      { x: 500, y: 250, w: 200, h: 20 }
    ],
    gates: [
      { x: 20, y: 400, w: 60, h: 100, dest: 'start_ruins', type: 'entrance' } // Can't go back immediately if survival
    ],
    bgType: 'arena',
    isSurvival: true,
    survivalTime: 60, // 60 seconds survival
    onEnter: () => {
      roomTimer = 0;
    }
  }
};

let enemies = [];
let particles = [];
let damageTexts = [];

function createLeech(x, y) {
  return {
    x, y, w: 72, h: 64, hp: 28, maxHp: 28,
    speed: 1.15 + Math.random() * 0.5,
    facing: Math.random() > 0.5 ? 1 : -1,
    hurtTimer: 0, animFrame: 0, animTimer: 0, dead: false, deathTimer: 0
  };
}

function spawnParticles(x, y, color, n, type) {
  for (let i = 0; i < n; i++) {
    let vx = (Math.random() - 0.5) * 10, vy = (Math.random() - 0.5) * 10, life = 15 + Math.random() * 15, size = 2 + Math.random() * 3, grav = 0;
    if (type === 'death') { vy -= 3; grav = 0.2; }
    if (type === 'dash') { vx *= 0.5; vy *= 0.5; color = getHeroStats().color; }
    particles.push({ x, y, vx, vy, life, maxLife: life, color, size, gravity: grav });
  }
}

function spawnDamageText(x, y, text, color) {
  damageTexts.push({ x, y, text, color, life: 40, vy: -1.5 });
}

function transitionToRoom(roomId, spawnX, spawnY) {
  gameState = 'transition';
  document.getElementById('intro-overlay').style.display = 'block';
  document.getElementById('intro-overlay').style.opacity = '1';

  setTimeout(() => {
    currentRoom = ROOMS[roomId];
    player.x = spawnX; player.y = spawnY;
    player.vx = 0; player.vy = 0;
    enemies = []; particles = []; damageTexts = [];
    document.getElementById('level-name').textContent = currentRoom.name;
    if (currentRoom.onEnter) currentRoom.onEnter();

    gameState = 'playing';
    document.getElementById('intro-overlay').style.opacity = '0';
    setTimeout(() => { document.getElementById('intro-overlay').style.display = 'none'; }, 500); // 500ms is transition time (shorter for rooms)
  }, 1000);
}

// ---------- INPUT ----------
const keys = {};
let joyDX = 0, joyActive = false;

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (gameState !== 'playing') return;
  if (['z', 'j'].includes(e.key.toLowerCase())) tryAttack();
  if (e.key.toLowerCase() === 'x') tryHeavy();
  if (e.key.toLowerCase() === 'shift' || e.key.toLowerCase() === 'c') tryDash();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function setupJoystick() {
  const area = document.getElementById('joystick-area');
  const knob = document.getElementById('joystick-knob');
  const base = document.getElementById('joystick-base');
  let cx, cy;
  function start(e) { e.preventDefault(); joyActive = true; const r = base.getBoundingClientRect(); cx = r.left + r.width/2; cy = r.top + r.height/2; }
  function move(e) {
    if (!joyActive) return;
    e.preventDefault(); const t = e.touches ? e.touches[0] : e;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const max = 32, d = Math.sqrt(dx*dx + dy*dy) || 1;
    if (d > max) { dx = dx/d*max; dy = dy/d*max; }
    joyDX = dx / max;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function end() { joyActive = false; joyDX = 0; knob.style.transform = 'translate(0,0)'; }
  area.addEventListener('touchstart', start, {passive:false}); area.addEventListener('touchmove', move, {passive:false}); area.addEventListener('touchend', end);
  area.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
}

function tryAttack() {
  if (player.attackTimer > 6 || player.dashing > 0) return;
  let type = 1;
  if (player.comboCount === 1 && player.comboTimer > 0) type = 2;
  else if (player.comboCount === 2 && player.comboTimer > 0) type = 3;
  registerAttack(type);
}
function tryHeavy() { if (player.attackTimer > 4 || player.dashing > 0) return; registerAttack(4); }
function tryJump() {
  if (player.jumpsLeft <= 0 || player.dashing > 0) return;
  const force = player.onGround ? getHeroStats().jumpForce : getHeroStats().jumpForce * 0.9;
  player.vy = force;
  player.jumpsLeft--;
  player.onGround = false;
  spawnParticles(player.x + player.w/2, player.y + player.h, player.onGround ? '#88a' : getHeroStats().color, 6, 'hit');
}
function tryDash() {
  if (player.dashCooldown > 0 || player.dashing > 0) return;
  player.dashing = 12;
  player.dashCooldown = 40;
  player.invuln = 15;
  player.attacking = false;
  player.attackTimer = 0;
}

document.getElementById('attack-btn').addEventListener('touchstart', e => { e.preventDefault(); tryAttack(); });
document.getElementById('attack-btn').addEventListener('mousedown', tryAttack);
document.getElementById('jump-btn').addEventListener('touchstart', e => { e.preventDefault(); tryJump(); });
document.getElementById('jump-btn').addEventListener('mousedown', tryJump);
document.getElementById('special-btn').addEventListener('touchstart', e => { e.preventDefault(); tryDash(); });
document.getElementById('special-btn').addEventListener('mousedown', tryDash);

// ---------- LOGIC ----------
function setupGame() {
  const stats = getHeroStats();
  player.maxHp = stats.hp;
  player.hp = stats.hp;
  player.speed = stats.speed;
  document.getElementById('weapon-display').textContent = `🗡️ ${stats.weapon}`;
  document.getElementById('hp').textContent = player.hp;

  currentRoom = ROOMS.start_ruins;
  player.x = 100; player.y = 300;
  kills = 0; souls = 0;
  enemies = []; particles = []; damageTexts = [];
  if (currentRoom.onEnter) currentRoom.onEnter();

  gameState = 'intro';
  document.getElementById('ui').style.display = 'flex';
  document.getElementById('controls').style.display = 'flex';
  document.getElementById('level-name').style.display = 'block';
  document.getElementById('level-name').textContent = currentRoom.name;

  // Fade out black overlay
  const overlay = document.getElementById('intro-overlay');
  overlay.style.display = 'block';
  overlay.style.opacity = '1';

  // Need to force reflow for transition to work if just set
  void overlay.offsetWidth;
  overlay.style.opacity = '0';

  setTimeout(() => {
    overlay.style.display = 'none';
    gameState = 'playing';
  }, 3000);
}

function update() {
  if (gameState !== 'playing') return;

  const stats = getHeroStats();

  // Dash logic
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.dashing > 0) {
    player.dashing--;
    player.vx = player.facing * stats.dashSpeed;
    player.vy = 0;
    player.animFrame = 2; // Use run frame for now
    spawnParticles(player.x + player.w/2, player.y + player.h/2, stats.color, 2, 'dash');
  } else {
    // Normal movement
    let move = 0;
    if (keys['a'] || keys['arrowleft']) move = -1;
    if (keys['d'] || keys['arrowright']) move = 1;
    if (joyActive) move = joyDX;

    if (Math.abs(move) > 0.15) {
      if (!player.attacking) player.vx = move * stats.speed;
      else player.vx = move * stats.speed * 0.3; // Slow while attacking
      if (!player.attacking) player.facing = move > 0 ? 1 : -1;
    } else {
      player.vx *= 0.75;
    }

    if (keys['w'] || keys['arrowup'] || keys[' ']) {
      if (!player._jumpHeld) { tryJump(); player._jumpHeld = true; }
    } else { player._jumpHeld = false; }

    player.vy += 0.6; // Gravity
    if (player.vy > 15) player.vy = 15;
  }

  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;
  if (currentRoom) {
    for (const p of currentRoom.platforms) {
      if (player.x + player.w > p.x && player.x < p.x + p.w &&
          player.y + player.h > p.y && player.y + player.h - player.vy <= p.y + 10 &&
          player.vy >= 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.jumpsLeft = 2;
      }
    }

    // Room bounds
    if (player.x < 0) player.x = 0;
    if (player.x > currentRoom.width - player.w) player.x = currentRoom.width - player.w;
    if (player.y > currentRoom.height + 100) {
       player.hp -= 20; player.x = 100; player.y = 100; player.vy = 0;
       if (player.hp <= 0) return setGameOver();
    }

    // Gates
    for (const g of currentRoom.gates) {
      if (player.x + player.w > g.x && player.x < g.x + g.w && player.y + player.h > g.y && player.y < g.y + g.h) {
         if (g.type === 'exit') transitionToRoom(g.dest, 50, 300);
      }
    }

    // Survival Logic
    if (currentRoom.isSurvival) {
      roomTimer++;
      if (roomTimer % 120 === 0 && enemies.length < 15) { // Spawn enemy every 2s
        const side = Math.random() > 0.5 ? -50 : currentRoom.width + 50;
        enemies.push(createLeech(side, 300));
      }
    }
  }

  if (player.attackTimer > 0) player.attackTimer--;
  else player.attacking = false;

  if (player.invuln > 0) player.invuln--;
  if (player.comboTimer > 0) {
    player.comboTimer--;
    if (player.comboTimer <= 0) { player.comboCount = 0; updateComboUI(); }
  }

  // Animation (if not attacking/dashing)
  if (!player.attacking && player.dashing <= 0) {
    if (player.invuln > 20) player.animFrame = 9;
    else if (!player.onGround) player.animFrame = player.jumpsLeft <= 0 ? 4 : 3;
    else if (Math.abs(player.vx) > 1) player.animFrame = Math.floor(performance.now() / 150) % 2 === 0 ? 1 : 2;
    else player.animFrame = 0;
  }

  cameraX += ((player.x - canvas.width * 0.4) - cameraX) * 0.1;
  cameraY += ((player.y - canvas.height * 0.6) - cameraY) * 0.1;
  if (currentRoom) {
    if (cameraX < 0) cameraX = 0;
    if (cameraX > currentRoom.width - canvas.width) cameraX = Math.max(0, currentRoom.width - canvas.width);
    if (cameraY < 0) cameraY = 0;
    if (cameraY > currentRoom.height - canvas.height) cameraY = Math.max(0, currentRoom.height - canvas.height);
  }

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dead) {
      e.deathTimer++; e.animFrame = 4;
      if (e.deathTimer > 30) enemies.splice(i, 1);
      continue;
    }

    const dx = player.x - e.x;
    e.facing = dx > 0 ? 1 : -1;

    if (e.hurtTimer > 0) {
      e.hurtTimer--; e.animFrame = 3;
    } else {
      e.x += e.facing * e.speed;
      e.animTimer++; e.animFrame = (e.animTimer % 20 < 10) ? 0 : 1;
    }

    e.y += 6;
    if (currentRoom) {
      for (const p of currentRoom.platforms) {
        if (e.x + e.w > p.x && e.x < p.x + p.w && e.y + e.h > p.y && e.y + e.h - 6 <= p.y + 10) {
          e.y = p.y - e.h;
        }
      }
    }

    // Player hits enemy
    if (player.attacking && player.attackTimer > 4) {
      const atk = player.attackType === 1 ? stats.attacks.jab : player.attackType === 2 ? stats.attacks.cross : player.attackType === 3 ? stats.attacks.spinKick : stats.attacks.heavy;
      const sx = player.facing > 0 ? player.x + player.w - 10 : player.x - atk.range + 10;
      if (sx < e.x + e.w && sx + atk.range > e.x && player.y < e.y + e.h && player.y + player.h > e.y) {
        const dmg = getCurrentAttackDamage();
        e.hp -= dmg;
        e.hurtTimer = 15;
        e.x += player.facing * atk.knockback * 4;
        spawnParticles(e.x + e.w/2, e.y + e.h/2, stats.color, 8, 'hit');
        spawnDamageText(e.x + e.w/2, e.y - 10, dmg, '#fff');

        if (e.hp <= 0) {
          e.dead = true; e.deathTimer = 0;
          kills++; souls += 5;
          spawnParticles(e.x + e.w/2, e.y + e.h/2, '#a070ff', 15, 'death');
          document.getElementById('kills').textContent = kills;
          document.getElementById('souls').textContent = souls;
        }
      }
    }

    // Enemy hits player
    if (player.invuln <= 0 && player.dashing <= 0 && !e.dead &&
        player.x < e.x + e.w && player.x + player.w > e.x &&
        player.y < e.y + e.h && player.y + player.h > e.y) {
      player.hp -= 10;
      player.invuln = 40;
      player.vy = -5;
      player.vx = e.facing * 5;
      player.animFrame = 9;
      spawnParticles(player.x + player.w/2, player.y + player.h/2, '#f00', 10, 'hit');
      spawnDamageText(player.x + player.w/2, player.y - 10, 10, '#f00');
      if (player.hp <= 0) return setGameOver();
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Damage text
  for (let i = damageTexts.length - 1; i >= 0; i--) {
    const d = damageTexts[i];
    d.y += d.vy; d.life--;
    if (d.life <= 0) damageTexts.splice(i, 1);
  }

  document.getElementById('hp').textContent = Math.max(0, Math.floor(player.hp));
}

function setGameOver() {
  gameState = 'dead';
  document.getElementById('msg-kills').textContent = kills;
  document.getElementById('msg-souls').textContent = souls;
  document.getElementById('message').style.display = 'flex';
}

// ---------- DRAW ----------
function drawKael(x, y) {
  if (!sprites.kael || sprites.kael.naturalWidth < 10) {
    ctx.fillStyle = getHeroStats().color;
    ctx.fillRect(x, y, player.w, player.h);
    return;
  }
  const frame = Math.max(0, Math.min(9, player.animFrame));
  const pad = 8, sx = frame * KAEL_FW + pad, sy = 0, sw = KAEL_FW - pad*2, sh = KAEL_FH;
  const drawW = 100, drawH = 130, drawX = x + (player.w - drawW)/2, drawY = y + player.h - drawH + 2;

  ctx.save();
  // Hero color tinting (simple globalAlpha composite trick for non-Kael heroes)
  if (currentHero !== 'kael') {
     // For placeholders, we tint them based on their color
  }

  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.5;
  if (player.facing < 0) {
    ctx.translate(drawX + drawW, drawY); ctx.scale(-1, 1);
    ctx.drawImage(sprites.kael, sx, sy, sw, sh, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(sprites.kael, sx, sy, sw, sh, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawLeech(e) {
  if (!sprites.leech || sprites.leech.naturalWidth < 10) {
    ctx.fillStyle = '#6a3090'; ctx.fillRect(e.x, e.y, e.w, e.h); return;
  }
  const frame = Math.max(0, Math.min(4, e.animFrame)), sx = frame * LEECH_FW;
  const dw = 80, dh = 70, dx = e.x + (e.w - dw)/2, dy = e.y + e.h - dh;
  ctx.save();
  if (e.facing < 0) {
    ctx.translate(dx + dw, dy); ctx.scale(-1, 1);
    ctx.drawImage(sprites.leech, sx, 0, LEECH_FW, LEECH_FH, 0, 0, dw, dh);
  } else {
    ctx.drawImage(sprites.leech, sx, 0, LEECH_FW, LEECH_FH, dx, dy, dw, dh);
  }
  ctx.restore();
}

function drawBG() {
  ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!currentRoom) return;

  if (currentRoom.bgType === 'ruins') {
    ctx.fillStyle = '#0a0a14';
    for (let i = 0; i < 10; i++) {
      const bx = ((i * 300) - cameraX * 0.3) % (currentRoom.width + 400) - 200;
      ctx.fillRect(bx, 100 + (i%2)*50, 180, 400);
    }
  } else {
    // Arena bg
    ctx.fillStyle = '#1a0505';
    for (let i = 0; i < 8; i++) {
      const bx = ((i * 250) - cameraX * 0.2) % (currentRoom.width + 300) - 100;
      ctx.fillRect(bx, 150 + (i%3)*30, 120, 500);
    }
    ctx.fillStyle = 'rgba(255, 50, 50, 0.05)';
    ctx.fillRect(0,0, canvas.width, canvas.height);
  }
}

function draw() {
  if (gameState === 'hero_select') return;

  drawBG();

  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  if (currentRoom) {
    // Gates
    currentRoom.gates.forEach(g => {
      ctx.fillStyle = g.type === 'exit' ? 'rgba(100, 255, 100, 0.3)' : 'rgba(255, 100, 100, 0.3)';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText(g.type.toUpperCase(), g.x+10, g.y-10);
    });

    // Platforms
    currentRoom.platforms.forEach(p => {
      ctx.fillStyle = currentRoom.bgType==='arena' ? '#2a1a1a' : '#1c1c2c';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = currentRoom.bgType==='arena' ? '#4a2a2a' : '#2a2a40';
      ctx.fillRect(p.x, p.y, p.w, 8);
    });
  }

  enemies.forEach(e => drawLeech(e));
  if (gameState !== 'transition') drawKael(player.x, player.y);

  particles.forEach(p => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI*2); ctx.fill();
  });

  damageTexts.forEach(d => {
    const alpha = Math.max(0, d.life / 40);
    ctx.globalAlpha = alpha; ctx.fillStyle = d.color; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(d.text, d.x, d.y);
  });

  ctx.globalAlpha = 1;
  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ---------- DOM BINDINGS ----------
document.querySelectorAll('.hero-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    currentHero = card.dataset.hero;
    document.getElementById('start-game-btn').classList.add('visible');
  });
});

document.getElementById('start-game-btn').addEventListener('click', () => {
  document.getElementById('hero-select').style.display = 'none';
  setupGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  document.getElementById('message').style.display = 'none';
  gameState = 'hero_select';
  document.getElementById('hero-select').style.display = 'flex';
  document.getElementById('ui').style.display = 'none';
  document.getElementById('controls').style.display = 'none';
  document.getElementById('level-name').style.display = 'none';
});

setupJoystick();
loadSprites(() => console.log('Sprites ready'));
loop();
