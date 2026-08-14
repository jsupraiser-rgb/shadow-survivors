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
  leech: null,
  loaded: 0,
  total: 2
};

function loadSprites(callback) {
  sprites.kael = new Image();
  sprites.kael.src = 'kael_sheet.png';
  sprites.kael.onload = () => { sprites.loaded++; if (sprites.loaded >= sprites.total && callback) callback(); };
  sprites.kael.onerror = () => { console.warn('kael_sheet.png failed to load'); sprites.loaded++; if (sprites.loaded >= sprites.total && callback) callback(); };

  sprites.leech = new Image();
  sprites.leech.src = 'leech_sheet.png';
  sprites.leech.onload = () => { sprites.loaded++; if (sprites.loaded >= sprites.total && callback) callback(); };
  sprites.leech.onerror = () => { console.warn('leech_sheet.png failed to load'); sprites.loaded++; if (sprites.loaded >= sprites.total && callback) callback(); };
}

// Kael sheet: 768x128 → 6 frames of 128x128
// 0:Idle  1:Jab  2:Cross  3:SpinKick  4:Heavy  5:Hurt
const KAEL_FW = 128, KAEL_FH = 128;

// Leech sheet: 320x64 → 5 frames of 64x64
// 0:Idle  1:Move  2:Attack  3:Hurt  4:Death
const LEECH_FW = 64, LEECH_FH = 64;

// ---------- STATE ----------
let gameRunning = false;
let kills = 0;
let souls = 0;
let cameraX = 0;
let levelComplete = false;

// ---------- PLAYER (Kael) ----------
const player = {
  x: 120, y: 0, w: 80, h: 92,
  vx: 0, vy: 0,
  speed: 4.4,
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
    player.animFrame = 4;
  } else {
    player.comboCount = Math.min(player.comboCount + 1, 3);
    player.comboTimer = COMBO_WINDOW;
    if (type === 1) { player.attackTimer = ATTACKS.jab.duration; player.animFrame = 1; }
    else if (type === 2) { player.attackTimer = ATTACKS.cross.duration; player.animFrame = 2; }
    else { player.attackTimer = ATTACKS.spinKick.duration; player.animFrame = 3; }
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
  { x: 0, y: 430, w: 2000, h: 50 },
  { x: 420, y: 360, w: 120, h: 18 },
  { x: 620, y: 310, w: 100, h: 18 },
  { x: 980, y: 370, w: 140, h: 18 },
  { x: 1250, y: 320, w: 110, h: 18 },
  { x: 1550, y: 360, w: 130, h: 18 },
  { x: 1780, y: 390, w: 160, h: 20 }
];
const exitGate = { x: 1860, y: 320, w: 50, h: 70 };

let enemies = [];
let particles = [];

function createLeech(x, y) {
  return {
    x, y, w: 56, h: 50,
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
  player.y = 320;
  player.vx = 0;
  player.vy = 0;
  player.hp = 100;
  player.jumpsLeft = 2;
  player.comboCount = 0;
  player.attacking = false;
  player.invuln = 0;
  player.animFrame = 0;

  enemies.push(createLeech(380, 400));
  enemies.push(createLeech(460, 400));
  enemies.push(createLeech(700, 400));
  enemies.push(createLeech(780, 280));
  enemies.push(createLeech(860, 400));
  enemies.push(createLeech(1100, 400));
  enemies.push(createLeech(1180, 400));
  enemies.push(createLeech(1300, 290));
  enemies.push(createLeech(1380, 400));
  enemies.push(createLeech(1600, 400));
  enemies.push(createLeech(1680, 400));
  enemies.push(createLeech(1750, 400));
  enemies.push(createLeech(1620, 330));
  enemies.push(createLeech(1700, 330));

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

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['z', 'j'].includes(e.key.toLowerCase())) tryAttack();
  if (e.key.toLowerCase() === 'x') tryHeavy();
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

  if (Math.abs(move) > 0.15) {
    player.vx = move * player.speed;
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
    player.x = 120; player.y = 300; player.vy = 0;
    if (player.hp <= 0) return gameOver();
  }

  if (player.attackTimer > 0) {
    player.attackTimer--;
  } else {
    player.attacking = false;
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
      player.animFrame = 5;
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
function drawKael(x, y) {
  if (!sprites.kael || !sprites.kael.complete || sprites.kael.naturalWidth === 0) {
    ctx.fillStyle = '#9b6dff';
    ctx.fillRect(x, y, player.w, player.h);
    return;
  }

  const frame = Math.max(0, Math.min(5, player.animFrame));
  const sx = frame * KAEL_FW;

  ctx.save();
  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.4;

  if (player.facing < 0) {
    ctx.translate(x + player.w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprites.kael, sx, 0, KAEL_FW, KAEL_FH, 0, 0, player.w, player.h);
  } else {
    ctx.drawImage(sprites.kael, sx, 0, KAEL_FW, KAEL_FH, x, y, player.w, player.h);
  }
  ctx.restore();
}

function drawLeech(e) {
  if (!sprites.leech || !sprites.leech.complete || sprites.leech.naturalWidth === 0) {
    ctx.fillStyle = '#4a2060';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const frame = Math.max(0, Math.min(4, e.animFrame));
  const sx = frame * LEECH_FW;

  ctx.save();
  if (e.facing < 0) {
    ctx.translate(e.x + e.w, e.y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprites.leech, sx, 0, LEECH_FW, LEECH_FH, 0, 0, e.w, e.h);
  } else {
    ctx.drawImage(sprites.leech, sx, 0, LEECH_FW, LEECH_FH, e.x, e.y, e.w, e.h);
  }
  ctx.restore();
}

function draw() {
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

  enemies.forEach(e => drawLeech(e));
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
