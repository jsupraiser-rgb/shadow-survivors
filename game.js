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
    name: 'Kael', color: '#a070ff',
    speed: 4.4, hp: 120, jumpForce: -11.8, dashSpeed: 12, maxCombo: 7,
    tiers: {
      1:  { weapon: 'Bare Fists',         mult: 0.5 },
      5:  { weapon: 'Bronze Handwraps',   mult: 0.7 },
      15: { weapon: 'Steel Gauntlets',    mult: 0.9 },
      30: { weapon: 'Knight\'s Bracers', mult: 1.2 },
      45: { weapon: 'Shadow Gauntlets',   mult: 1.5 },
      60: { weapon: 'Eclipse Blade',      mult: 2.0 }
    },
    abilities: {
      1: { name: 'Jab', damage: 8, range: 50, knockback: 1.0, duration: 12, type: 'melee', frame: 5 },
      2: { name: 'Cross', damage: 10, range: 55, knockback: 1.5, duration: 14, type: 'melee', frame: 6 },
      3: { name: 'Kick', damage: 15, range: 65, knockback: 3.5, duration: 16, type: 'melee', frame: 7 },
      10: { name: 'Rising Arc', damage: 18, range: 75, knockback: 4.5, duration: 18, type: 'melee', frame: 6 },
      20: { name: 'Whirlwind', damage: 20, range: 85, knockback: 5.0, duration: 18, type: 'melee', frame: 6 },
      30: { name: 'Shadow Step', damage: 28, range: 90, knockback: 7.0, duration: 24, type: 'melee', frame: 7 },
      45: { name: 'Eclipse Slash', damage: 30, range: 90, knockback: 8.0, duration: 24, type: 'melee', frame: 7 },
      60: { name: 'Void Breaker', damage: 50, range: 100, knockback: 10.0, duration: 30, type: 'melee', frame: 7, invuln: 15 },
      special: { name: 'Heavy Slash', damage: 45, range: 90, knockback: 8.5, duration: 30, type: 'melee', frame: 8, cooldown: 60 }
    }
  },
  lyra: {
    name: 'Lyra', color: '#40ff80',
    speed: 5.8, hp: 80, jumpForce: -12.5, dashSpeed: 16, maxCombo: 5,
    tiers: {
      1:  { weapon: 'Bare Fists',          mult: 0.5 },
      5:  { weapon: 'Ninja Wraps',         mult: 0.7 },
      15: { weapon: 'Assassin Gloves',     mult: 0.9 },
      30: { weapon: 'Void Grips',          mult: 1.2 },
      45: { weapon: 'Shadow Claws',        mult: 1.5 },
      60: { weapon: 'Nightreaver Daggers', mult: 2.0 }
    },
    abilities: {
      1: { name: 'Twin Flurry', damage: 6, range: 50, knockback: 1.0, duration: 8, type: 'melee', frame: 5 },
      2: { name: 'Poison Jab', damage: 8, range: 50, knockback: 1.5, duration: 10, type: 'melee', frame: 5 },
      3: { name: 'Twin Flurry II', damage: 10, range: 55, knockback: 2.0, duration: 10, type: 'melee', frame: 6 },
      10: { name: 'Poison Strike', damage: 12, range: 50, knockback: 1.5, duration: 10, type: 'melee', frame: 5 },
      20: { name: 'Blink Strike', damage: 14, range: 60, knockback: -2.0, duration: 14, type: 'melee', frame: 6 }, // Negative knockback for pull-in
      30: { name: 'Shadow Flurry', damage: 20, range: 65, knockback: 1.5, duration: 12, type: 'melee', frame: 6 },
      45: { name: 'Umbral Execution', damage: 30, range: 70, knockback: 3.5, duration: 18, type: 'melee', frame: 7, teleport: 30 },
      60: { name: 'Phantom Reign', damage: 45, range: 80, knockback: 5.0, duration: 24, type: 'melee', frame: 7, teleport: 60 },
      special: { name: 'Shadow Dash Attack', damage: 25, range: 40, knockback: 5.0, duration: 15, type: 'melee', dash: 12, frame: 8, cooldown: 45 }
    }
  },
  vex: {
    name: 'Vex', color: '#ff8040',
    speed: 3.2, hp: 200, jumpForce: -10.0, dashSpeed: 8, maxCombo: 4,
    tiers: {
      1:  { weapon: 'Bare Fists',           mult: 0.5 },
      5:  { weapon: 'Iron Knuckle Guards',  mult: 0.7 },
      15: { weapon: 'Reinforced Gauntlets', mult: 0.9 },
      30: { weapon: 'Crusher Gauntlets',    mult: 1.2 },
      45: { weapon: 'Titan Bracers',        mult: 1.5 },
      60: { weapon: 'Doom Cleaver',         mult: 2.0 }
    },
    abilities: {
      1: { name: 'Crushing Blow', damage: 25, range: 75, knockback: 4.0, duration: 22, type: 'melee', frame: 5 },
      10: { name: 'Seismic Slam', damage: 35, range: 85, knockback: 6.0, duration: 28, type: 'melee', frame: 6 },
      20: { name: 'Shockwave', damage: 45, range: 100, knockback: 8.0, duration: 35, type: 'melee', frame: 7, aoe: 150 }, // AOE damage
      30: { name: 'Earthen Bulwark', damage: 55, range: 110, knockback: 10.0, duration: 40, type: 'melee', frame: 7 },
      45: { name: 'Cataclysm', damage: 80, range: 110, knockback: 15.0, duration: 55, type: 'melee', frame: 8, recovery: 20 },
      60: { name: 'Rupture Core', damage: 120, range: 150, knockback: 20.0, duration: 65, type: 'melee', frame: 8, recovery: 30, aoe: 250 },
      special: { name: 'Ground Smash', damage: 40, range: 150, knockback: 10.0, duration: 35, type: 'melee', frame: 8, aoe: 200, stun: 30, cooldown: 120 }
    }
  },
  nyx: {
    name: 'Nyx', color: '#40c0ff',
    speed: 4.8, hp: 100, jumpForce: -11.0, dashSpeed: 10, maxCombo: 5,
    tiers: {
      1:  { weapon: 'Bare Fists',       mult: 0.5 },
      5:  { weapon: 'Energy Gauntlets', mult: 0.7 },
      15: { weapon: 'Magitech Pistols', mult: 0.9 },
      30: { weapon: 'Shadow Pistols',   mult: 1.2 },
      45: { weapon: 'Void Blasters',    mult: 1.5 },
      60: { weapon: 'Void Star Cannon', mult: 2.0 }
    },
    abilities: {
      1: { name: 'Blade Barrage', damage: 10, range: 60, knockback: 1.5, duration: 12, type: 'melee', frame: 5 },
      10: { name: 'Void Pulse', damage: 15, range: 65, knockback: 2.0, duration: 16, type: 'melee', frame: 6 },
      20: { name: 'Arc Barrage', damage: 8, range: 300, knockback: 1.0, duration: 15, type: 'ranged', special: 'spread', frame: 7 },
      30: { name: 'Dark Matter Field', damage: 20, range: 350, knockback: 3.0, duration: 20, type: 'ranged', frame: 7 },
      45: { name: 'Singularity', damage: 35, range: 400, knockback: 6.0, duration: 30, type: 'ranged', pierce: true, frame: 8 },
      60: { name: 'Void Annihilation', damage: 60, range: 500, knockback: 10.0, duration: 40, type: 'ranged', pierce: true, frame: 8 },
      special: { name: 'Charged Shot', damage: 25, range: 300, knockback: 4.0, duration: 25, type: 'ranged', frame: 7, cooldown: 45 }
    }
  }
};

let currentHero = 'kael';

// ---------- SPRITES ----------
const sprites = { kael: null, lyra: null, vex: null, nyx: null, leech: null, loaded: 0, total: 5 };
let KAEL_FW = 128, KAEL_FH = 170;
let LEECH_FW = 64, LEECH_FH = 64;

function loadSprites(callback) {
  sprites.kael = new Image();
  sprites.lyra = new Image();
  sprites.vex = new Image();
  sprites.nyx = new Image();
  sprites.leech = new Image();
  let pending = 5;

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
      KAEL_FW = Math.floor(cleaned.naturalWidth / 6) || 256;
      KAEL_FH = Math.floor(cleaned.naturalHeight / 4) || 256;
      oneDone();
    });
  };
  sprites.kael.onerror = oneDone;
  sprites.lyra.onload = function() { stripWhite(sprites.lyra, function(cleaned) { sprites.lyra = cleaned; oneDone(); }); };
  sprites.lyra.onerror = oneDone;
  sprites.vex.onload = function() { stripWhite(sprites.vex, function(cleaned) { sprites.vex = cleaned; oneDone(); }); };
  sprites.vex.onerror = oneDone;
  sprites.nyx.onload = function() { stripWhite(sprites.nyx, function(cleaned) { sprites.nyx = cleaned; oneDone(); }); };
  sprites.nyx.onerror = oneDone;

  sprites.leech.onload = function() {
    LEECH_FW = Math.floor(sprites.leech.naturalWidth / 5) || 64;
    LEECH_FH = sprites.leech.naturalHeight || 64;
    oneDone();
  };
  sprites.leech.onerror = oneDone;

  sprites.kael.src = 'kael_sheet.png';
  // Use kael_sheet for other heroes for now until provided
  sprites.lyra.src = 'kael_sheet.png';
  sprites.vex.src = 'kael_sheet.png';
  sprites.nyx.src = 'kael_sheet.png';
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
  dashing: 0, dashCooldown: 0,
  _lastRightTap: 0, _lastLeftTap: 0,
  _rightHeld: false, _leftHeld: false
};

const COMBO_WINDOW = 55;

function getHeroStats() { return HEROES[currentHero]; }

function getUnlockedAbilities() {
  const stats = getHeroStats();
  const unlocked = [];
  // Use keys in order they are defined for normal attacks
  for (let k in stats.abilities) {
     if (k === 'special') continue;
     // For level 1, give access to 1,2,3 for combo testing, otherwise require level
     let req = parseInt(k);
     if (req <= 3 || player.level >= req) {
         unlocked.push(stats.abilities[k]);
     }
  }
  return unlocked;
}

function updateProgression() {
  const stats = getHeroStats();
  let tierLevel = 1;
  const tiers = [60, 45, 30, 15, 5, 1];
  for (let t of tiers) {
     if (player.level >= t) {
        tierLevel = t;
        break;
     }
  }

  const currentTier = stats.tiers[tierLevel];
  document.getElementById('weapon-display').textContent = `🗡️ ${currentTier.weapon}`;
  document.getElementById('level-display').textContent = `Lvl ${player.level} [${player.xp}/${player.nextXp} XP]`;
  document.getElementById('hp').textContent = Math.floor(player.hp);
}

function addXp(amount) {
  player.xp += amount;
  while (player.xp >= player.nextXp) {
    player.level++;
    player.xp -= player.nextXp;
    player.nextXp = Math.floor(player.nextXp * 1.5);
    player.maxHp += 10;
    player.hp = player.maxHp;

    // Spawn level up text
    spawnDamageText(player.x + player.w/2, player.y - 30, "LEVEL UP!", "#ffaa00");
    spawnParticles(player.x + player.w/2, player.y + player.h, "#ffaa00", 30, 'death');
    updateProgression();
  }
}


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

function registerAttack(type, isSpecial) {
  if (player.dashing > 0) return;
  const now = performance.now();
  const stats = getHeroStats();

  if (!isSpecial) {
      if (now - player.lastAttackTime > 1000) {
          player.comboCount = 1;
      } else {
          player.comboCount++;
      }
      updateComboUI();
  }

  const atkStats = stats.abilities[type];
  if (!atkStats) return; // Failsafe

  player.lastAttackTime = now;
  player.attacking = true;
  player.attackType = type;
  player.attackTimer = atkStats.duration;
  if (!player.onGround && atkStats.type === 'melee') {
      player.animFrame = 14; // Jump kick
  } else {
      player.animFrame = atkStats.frame || 5;
  }

  if (atkStats.cooldown && isSpecial) {
     player.specialCooldown = atkStats.cooldown;
  }
  if (atkStats.recovery) {
     player.recoveryTimer = atkStats.recovery;
  }
  if (atkStats.teleport) {
     player.x += player.facing * atkStats.teleport;
     spawnParticles(player.x, player.y + player.h/2, stats.color, 5, 'dash');
  }
  if (atkStats.dash) {
     player.vx = player.facing * atkStats.dash;
  }
  if (atkStats.invuln) {
     player.invuln = atkStats.invuln;
  }
  if (atkStats.stun) {
     // Apply stun to all enemies if AOE
     for (const e of enemies) {
         if (Math.abs(e.x - player.x) < atkStats.aoe) {
             e.hurtTimer = atkStats.stun;
             e.hp -= atkStats.damage;
         }
     }
  } else if (atkStats.aoe) {
     for (const e of enemies) {
         if (Math.abs(e.x - player.x) < atkStats.aoe) {
             e.hp -= atkStats.damage;
             e.hurtTimer = 10;
             spawnParticles(e.x, e.y, stats.color, 5, 'hit');
         }
     }
  }

  if (!isSpecial) {
    player.comboCount = Math.min(player.comboCount + 1, stats.maxCombo);
    player.comboTimer = COMBO_WINDOW;
  }
  updateComboUI();

  // Add screen shake for heavy/special attacks
  if (atkStats.damage > 20) screenShake = atkStats.damage * 0.3;
  if (atkStats.aoe) screenShake = atkStats.aoe * 0.1;

  if (atkStats.type === 'melee') {
      // Create weapon trail
      const t = { color: stats.color, life: 1.0, width: 25, points: [] };
      const cx = player.x + player.w/2;
      const cy = player.y + player.h/2;
      if (player.facing > 0) {
          t.points.push({x: cx - 20, y: cy - 40});
          t.points.push({x: cx + atkStats.range, y: cy});
          t.points.push({x: cx + atkStats.range - 20, y: cy + 40});
      } else {
          t.points.push({x: cx + 20, y: cy - 40});
          t.points.push({x: cx - atkStats.range, y: cy});
          t.points.push({x: cx - atkStats.range + 20, y: cy + 40});
      }
      weaponTrails.push(t);
  }


  if (atkStats.type === 'ranged') {
    let damage = Math.round(atkStats.damage * getComboMultiplier());
    if (atkStats.special === 'spread') {
      projectiles.push({ x: player.x + player.w/2, y: player.y + 40, vx: player.facing * 12, vy: -1.5, damage: damage, life: 60, owner: 'player', color: stats.color });
      projectiles.push({ x: player.x + player.w/2, y: player.y + 40, vx: player.facing * 12, vy: 0, damage: damage, life: 60, owner: 'player', color: stats.color });
      projectiles.push({ x: player.x + player.w/2, y: player.y + 40, vx: player.facing * 12, vy: 1.5, damage: damage, life: 60, owner: 'player', color: stats.color });
    } else {
      let life = atkStats.pierce ? 80 : 40;
      projectiles.push({ x: player.x + player.w/2, y: player.y + 40, vx: player.facing * 15, vy: 0, damage: damage, life: life, owner: 'player', color: stats.color, pierce: atkStats.pierce });
    }
    spawnParticles(player.x + (player.facing > 0 ? player.w : 0), player.y + 40, stats.color, 4, 'hit');
  }
}

function getCurrentAttackDamage() {
  const stats = getHeroStats();
  const atk = stats.abilities[player.attackType];

  let tierLevel = 1;
  const tiers = [60, 45, 30, 15, 5, 1];
  for (let t of tiers) {
     if (player.level >= t) {
        tierLevel = t;
        break;
     }
  }

  const mult = stats.tiers[tierLevel].mult;
  return Math.round((atk ? atk.damage : 8) * mult * getComboMultiplier());
}

// ---------- WORLD & ROOMS ----------
let currentRoom = null;

const ROOMS = {
  level_1: {
    name: 'Stage 1-1: The Outskirts',
    width: 1500, height: 600,
    platforms: [
      { x: 0, y: 440, w: 1500, h: 160 },
      { x: 400, y: 340, w: 120, h: 20 },
      { x: 700, y: 240, w: 100, h: 20 }
    ],
    gates: [{ x: 1400, y: 340, w: 60, h: 100, dest: 'level_2', type: 'exit' }],
    bgType: 'ruins',
    onEnter: () => {
      enemies.push(createLeech(600, 400));
      enemies.push(createLeech(900, 400));
    }
  },
  level_2: {
    name: 'Stage 1-2: Crumbling Path',
    width: 2000, height: 600,
    platforms: [
      { x: 0, y: 500, w: 400, h: 100 },
      { x: 500, y: 400, w: 200, h: 20 },
      { x: 800, y: 300, w: 200, h: 20 },
      { x: 1200, y: 400, w: 800, h: 200 }
    ],
    gates: [
      { x: 20, y: 400, w: 60, h: 100, dest: 'level_1', type: 'entrance' },
      { x: 1900, y: 300, w: 60, h: 100, dest: 'level_3', type: 'exit' }
    ],
    bgType: 'ruins',
    onEnter: () => {
      enemies.push(createLeech(550, 300));
      enemies.push(createLeech(1400, 300));
      enemies.push(createLeech(1600, 300));
    }
  },
  level_3: {
    name: 'Stage 1-3: First Ambush',
    width: 1200, height: 600,
    platforms: [
      { x: 0, y: 500, w: 1200, h: 100 },
      { x: 200, y: 380, w: 150, h: 20 },
      { x: 850, y: 380, w: 150, h: 20 }
    ],
    gates: [
      { x: 20, y: 400, w: 60, h: 100, dest: 'level_2', type: 'entrance' },
      { x: 1100, y: 400, w: 60, h: 100, dest: 'level_4', type: 'exit' }
    ],
    bgType: 'arena',
    isSurvival: true,
    survivalTime: 30,
    onEnter: () => { roomTimer = 0; }
  },
  level_4: {
    name: 'Stage 1-4: The Ascent',
    width: 1000, height: 800,
    platforms: [
      { x: 0, y: 700, w: 1000, h: 100 },
      { x: 300, y: 550, w: 150, h: 20 },
      { x: 500, y: 400, w: 150, h: 20 },
      { x: 700, y: 250, w: 150, h: 20 },
      { x: 0, y: 150, w: 300, h: 20 }
    ],
    gates: [
      { x: 20, y: 600, w: 60, h: 100, dest: 'level_3', type: 'entrance' },
      { x: 20, y: 50, w: 60, h: 100, dest: 'level_5', type: 'exit' }
    ],
    bgType: 'ruins',
    onEnter: () => {
      enemies.push(createLeech(350, 450));
      enemies.push(createLeech(550, 300));
      enemies.push(createLeech(750, 150));
    }
  },
  level_5: {
    name: 'Stage 1-5: The Bridge',
    width: 2500, height: 600,
    platforms: [
      { x: 0, y: 450, w: 2500, h: 150 }
    ],
    gates: [
      { x: 20, y: 350, w: 60, h: 100, dest: 'level_4', type: 'entrance' },
      { x: 2400, y: 350, w: 60, h: 100, dest: 'level_6', type: 'exit' }
    ],
    bgType: 'ruins',
    onEnter: () => {
      for(let i=1; i<=5; i++) enemies.push(createLeech(400 * i, 350));
    }
  },
  level_6: {
    name: 'Stage 1-6: Deep Shadows',
    width: 1500, height: 600,
    platforms: [
      { x: 0, y: 500, w: 300, h: 100 },
      { x: 400, y: 500, w: 300, h: 100 },
      { x: 800, y: 500, w: 300, h: 100 },
      { x: 1200, y: 500, w: 300, h: 100 }
    ],
    gates: [
      { x: 20, y: 400, w: 60, h: 100, dest: 'level_5', type: 'entrance' },
      { x: 1400, y: 400, w: 60, h: 100, dest: 'level_7', type: 'exit' }
    ],
    bgType: 'ruins',
    onEnter: () => {
      enemies.push(createLeech(500, 400));
      enemies.push(createLeech(900, 400));
    }
  },
  level_7: {
    name: 'Stage 1-7: Slaughter Pit',
    width: 1200, height: 600,
    platforms: [
      { x: 0, y: 500, w: 1200, h: 100 },
      { x: 300, y: 350, w: 600, h: 20 }
    ],
    gates: [
      { x: 20, y: 400, w: 60, h: 100, dest: 'level_6', type: 'entrance' },
      { x: 1100, y: 400, w: 60, h: 100, dest: 'level_8', type: 'exit' }
    ],
    bgType: 'arena',
    isSurvival: true,
    survivalTime: 45,
    onEnter: () => { roomTimer = 0; }
  },
  level_8: {
    name: 'Stage 1-8: Ruined Halls',
    width: 1800, height: 600,
    platforms: [
      { x: 0, y: 400, w: 1800, h: 200 },
      { x: 500, y: 250, w: 100, h: 20 },
      { x: 900, y: 250, w: 100, h: 20 },
      { x: 1300, y: 250, w: 100, h: 20 }
    ],
    gates: [
      { x: 20, y: 300, w: 60, h: 100, dest: 'level_7', type: 'entrance' },
      { x: 1700, y: 300, w: 60, h: 100, dest: 'level_9', type: 'exit' }
    ],
    bgType: 'ruins',
    onEnter: () => {
      enemies.push(createLeech(600, 300));
      enemies.push(createLeech(1000, 300));
      enemies.push(createLeech(1400, 300));
      enemies.push(createLeech(800, 300));
      enemies.push(createLeech(1200, 300));
    }
  },
  level_9: {
    name: 'Stage 1-9: Ante-Chamber',
    width: 1000, height: 600,
    platforms: [
      { x: 0, y: 450, w: 1000, h: 150 }
    ],
    gates: [
      { x: 20, y: 350, w: 60, h: 100, dest: 'level_8', type: 'entrance' },
      { x: 900, y: 350, w: 60, h: 100, dest: 'level_10', type: 'exit' }
    ],
    bgType: 'ruins',
    onEnter: () => {}
  },
  level_10: {
    name: 'Stage 1-10: The Void Knight',
    width: 1000, height: 600,
    platforms: [
      { x: 0, y: 500, w: 1000, h: 100 }
    ],
    gates: [],
    bgType: 'arena',
    isBoss: true,
    onEnter: () => {
      boss = createBoss(800, 300);
      document.getElementById('boss-ui').style.display = 'block';
    }
  }
};

let enemies = [];
let particles = [];
let damageTexts = [];
let projectiles = [];
let weaponTrails = [];
let screenShake = 0;


let boss = null;

function createBoss(x, y) {
  return {
    x, y, w: 80, h: 120, hp: 1500, maxHp: 1500,
    speed: 3, facing: -1, hurtTimer: 0, animFrame: 0, animTimer: 0, dead: false, deathTimer: 0,
    state: 'idle', stateTimer: 60, attackCooldown: 0, vy: 0
  };
}

function updateBoss() {
  if (!boss || boss.dead) return;
  if (boss.invuln > 0) boss.invuln--;
  const dx = player.x - boss.x;
  boss.facing = dx > 0 ? 1 : -1;

  if (boss.hurtTimer > 0) {
    boss.hurtTimer--;
    boss.animFrame = 9;
  } else {
    boss.stateTimer--;
    if (boss.stateTimer <= 0) {
      // Choose new state
      const rand = Math.random();
      if (Math.abs(dx) > 300) {
         if (rand < 0.6) { boss.state = 'dash'; boss.stateTimer = 20; }
         else { boss.state = 'shoot'; boss.stateTimer = 40; }
      } else {
         if (rand < 0.7) { boss.state = 'melee'; boss.stateTimer = 30; }
         else { boss.state = 'idle'; boss.stateTimer = 30; }
      }
    }

    boss.vy += 0.6;
    if (boss.vy > 15) boss.vy = 15;
    boss.y += boss.vy;
    if (boss.y + boss.h > 500) { boss.y = 500 - boss.h; boss.vy = 0; }

    if (boss.state === 'dash') {
      boss.x += boss.facing * 12;
      boss.animFrame = 2;
      spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#f00', 1, 'dash');
    } else if (boss.state === 'melee') {
      boss.animFrame = 7;
      if (boss.stateTimer === 15) { // Hit frame
         if (Math.abs(dx) < 120 && player.y > boss.y - 50 && player.y < boss.y + boss.h + 50) {
            if (player.invuln <= 0 && player.dashing <= 0) {
               player.hp -= 30;
               player.invuln = 40;
               player.vy = -6;
               player.vx = boss.facing * 8;
               spawnParticles(player.x + player.w/2, player.y + player.h/2, '#f00', 15, 'hit');
               spawnDamageText(player.x + player.w/2, player.y - 10, 30, '#f00');
               if (player.hp <= 0) setGameOver();
            }
         }
      }
    } else if (boss.state === 'shoot') {
      boss.animFrame = 6;
      if (boss.stateTimer === 20) {
         projectiles.push({ x: boss.x + boss.w/2, y: boss.y + 40, vx: boss.facing * 10, vy: 0, damage: 20, life: 80, owner: 'boss', color: '#ff0000' });
      }
    } else {
      boss.x += boss.facing * boss.speed;
      boss.animFrame = (Math.floor(performance.now() / 150) % 2 === 0) ? 1 : 2;
    }
  }

  // Player hits boss
  if (player.attacking && player.attackTimer > 4) {
      const stats = getHeroStats();
      const atk = stats.abilities[player.attackType];
      if (atk && atk.type === 'melee') {
        const sx = player.facing > 0 ? player.x + player.w - 10 : player.x - atk.range + 10;
        if (boss.invuln <= 0 && sx < boss.x + boss.w && sx + atk.range > boss.x && player.y < boss.y + boss.h && player.y + player.h > boss.y) {
          const dmg = getCurrentAttackDamage();
          boss.hp -= dmg;
          boss.hurtTimer = 10;
          boss.invuln = 10;
          spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#ff0000', 8, 'hit');
          spawnDamageText(boss.x + boss.w/2, boss.y - 10, dmg, '#fff');

          if (boss.hp <= 0) {
            boss.dead = true;
            kills++; souls += 500; addXp(500);
            spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#ffaa00', 40, 'death');
            document.getElementById('kills').textContent = kills;
            document.getElementById('souls').textContent = souls;
            setTimeout(() => {
                document.getElementById('msg-title').textContent = "Victory!";
                document.getElementById('msg-desc').textContent = "You have defeated the Void Knight.";
                setGameOver();
            }, 3000);
          }
        }
      }
  }

  // Update boss UI
  const bossHpFill = document.getElementById('boss-hp-fill');
  if (bossHpFill) {
      bossHpFill.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
  }
}

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
    enemies = []; particles = []; damageTexts = []; projectiles = []; weaponTrails = []; screenShake = 0;
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
  if (e.key.toLowerCase() === 'x') trySpecial();
  // Removed shift/c dash binding per requirement
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

window.tryAttack = tryAttack;
function tryAttack() {
  if (player.attackTimer > 12 || player.dashing > 0 || player.recoveryTimer > 0) return;
  const stats = getHeroStats();
  const unlocked = getUnlockedAbilities();
  if (unlocked.length === 0) return;

  let nextCombo = 1;
  const now = performance.now();
  if (now - player.lastAttackTime < 1000 && player.comboCount > 0) {
      nextCombo = player.comboCount + 1;
  }

  if (nextCombo > unlocked.length) {
      nextCombo = 1; // Reset if max reached for current level
  }

  // Find which unlocked abilities they have

  let abilityObjToUse = unlocked[nextCombo - 1];
  if (!abilityObjToUse) {
      abilityObjToUse = unlocked[0]; // fallback
      player.comboCount = 0; // Reset combo if we fallback
  }

  // Find the original key
  let originalKey = '1';
  for (let k in stats.abilities) {
      if (stats.abilities[k] === abilityObjToUse) originalKey = k;
  }

  registerAttack(originalKey, false);
}

function trySpecial() {
  if (player.level < 1 || player.dashing > 0 || player.recoveryTimer > 0) return; // Special abilities might unlock later if we want, currently unlocked at 1
  if (player.specialCooldown > 0) return;

  registerAttack('special', true);
}

// Map tryHeavy to special for UI button backwards compat, we repurposed dash to special
function tryDash() {
  if (player.dashCooldown > 0 || player.dashing > 0 || player.recoveryTimer > 0 || player.attacking) return;
  player.dashing = 12;
  player.dashCooldown = 40;
  player.invuln = 15;
}

document.getElementById('attack-btn').addEventListener('touchstart', e => { e.preventDefault(); tryAttack(); });
document.getElementById('attack-btn').addEventListener('mousedown', tryAttack);

document.getElementById('jump-btn').addEventListener('touchstart', e => { e.preventDefault(); tryJump(); });
document.getElementById('jump-btn').addEventListener('mousedown', tryJump);
function tryJump() {
  if (player.jumpsLeft > 0) {
    player.vy = -12;
    player.jumpsLeft--;
    player.onGround = false;
    spawnParticles(player.x, player.y + player.h, '#aaa', 5);
  }
}

document.getElementById('special-btn').addEventListener('touchstart', e => { e.preventDefault(); trySpecial(); });
document.getElementById('special-btn').addEventListener('mousedown', trySpecial);

// ---------- LOGIC ----------
function setupGame() {
  const stats = getHeroStats();
  player.maxHp = stats.hp;
  player.hp = stats.hp;
  player.speed = stats.speed;
  player.level = 1;
  player.xp = 0;
  player.nextXp = 100;
  updateProgression();


  currentRoom = ROOMS.level_1;
  player.x = 100; player.y = 300;
  kills = 0; souls = 0;
  enemies = []; particles = []; damageTexts = []; projectiles = []; weaponTrails = []; screenShake = 0;
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
  if (screenShake > 0) screenShake *= 0.8;
  if (screenShake < 0.5) screenShake = 0;

  // Weapon Trails
  for (let i = weaponTrails.length - 1; i >= 0; i--) {
     weaponTrails[i].life -= 0.1;
     if (weaponTrails[i].life <= 0) weaponTrails.splice(i, 1);
  }

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
    // Dash via double-tap
    if (keys['arrowright'] || keys['d']) {
       if (!player._rightHeld) {
           const now = performance.now();
           if (now - player._lastRightTap < 250) { tryDash(); }
           player._lastRightTap = now;
           player._rightHeld = true;
       }
    } else { player._rightHeld = false; }

    if (keys['arrowleft'] || keys['a']) {
       if (!player._leftHeld) {
           const now = performance.now();
           if (now - player._lastLeftTap < 250) { tryDash(); }
           player._lastLeftTap = now;
           player._leftHeld = true;
       }
    } else { player._leftHeld = false; }

    // Normal movement
    let move = 0;
    if (keys['a'] || keys['arrowleft']) move = -1;
    if (keys['d'] || keys['arrowright']) move = 1;
    if (joyActive) move = joyDX;

    if (!player.attacking && move !== 0) {
       player.facing = move > 0 ? 1 : -1;
    }

    if (Math.abs(move) > 0.15) {
      if (!player.attacking) player.vx = move * stats.speed;
      else player.vx = move * stats.speed * 0.3; // Slow while attacking
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
         if (g.type === 'exit' || g.type === 'entrance') transitionToRoom(g.dest, 50, 300);
      }
    }

    // Survival Logic
    if (currentRoom.isBoss) { updateBoss(); }
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

  if (player.recoveryTimer > 0) player.recoveryTimer--;
  if (player.specialCooldown > 0) player.specialCooldown--;

  if (player.invuln > 0) player.invuln--;

  if (player.comboCount > 0 && performance.now() - player.lastAttackTime > 1500) {
      player.comboCount = 0;
      updateComboUI();
  }

  // Removed comboTimer logic in favor of lastAttackTime

  // Animation (if not attacking/dashing)
  if (!player.attacking && player.dashing <= 0) {
    if (player.invuln > 20) player.animFrame = 9;
    else if (!player.onGround) {
      if (player.jumpsLeft <= 0) {
         player.animFrame = 12; // Double jump somersault
      } else {
         player.animFrame = player.vy < 0 ? 10 : 11; // Jump up or fall
      }
    }
    else if (Math.abs(player.vx) > 1) player.animFrame = Math.floor(performance.now() / 100) % 4 + 1; // Run frames 1-4
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
      const stats = getHeroStats();
      const atk = stats.abilities[player.attackType];
      if (atk && atk.type === 'melee') {
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
          kills++; souls += 5; addXp(25);
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


  // Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx; p.y += p.vy;
    p.life--;

    let hit = false;
    // Check hit enemies if player projectile
    if (p.owner === 'player') {
      if (currentRoom && currentRoom.isBoss && boss && !boss.dead) {
         if (p.x > boss.x && p.x < boss.x + boss.w && p.y > boss.y && p.y < boss.y + boss.h) {
            hit = true;
            boss.hp -= p.damage;
            boss.hurtTimer = 10;
            spawnParticles(p.x, p.y, p.color, 5, 'hit');
            spawnDamageText(boss.x + boss.w/2, boss.y - 10, p.damage, '#fff');

            if (boss.hp <= 0) {
              boss.dead = true; kills++; souls += 500; addXp(500);
              spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#ffaa00', 40, 'death');
              setTimeout(() => { document.getElementById('msg-title').textContent = "Victory!"; document.getElementById('msg-desc').textContent = "You have defeated the Void Knight."; setGameOver(); }, 3000);
            }
         }
      }
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (!e.dead && p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
          hit = true;
          e.hp -= p.damage;
          e.hurtTimer = 10;
          spawnParticles(p.x, p.y, p.color, 5, 'hit');
          spawnDamageText(e.x + e.w/2, e.y - 10, p.damage, '#fff');

          if (e.hp <= 0) {
            e.dead = true; e.deathTimer = 0;
            kills++; souls += 5; addXp(25);
            spawnParticles(e.x + e.w/2, e.y + e.h/2, '#a070ff', 15, 'death');
            document.getElementById('kills').textContent = kills;
            document.getElementById('souls').textContent = souls;
          }
          break;
        }
      }
    }
        if (p.owner === 'boss') {
       if (p.x > player.x && p.x < player.x + player.w && p.y > player.y && p.y < player.y + player.h) {
           if (player.invuln <= 0 && player.dashing <= 0) {
               hit = true;
               player.hp -= p.damage;
               player.invuln = 40;
               spawnParticles(player.x + player.w/2, player.y + player.h/2, '#f00', 10, 'hit');
               spawnDamageText(player.x + player.w/2, player.y - 10, p.damage, '#f00');
               if (player.hp <= 0) setGameOver();
           }
       }
    }
    if ((hit && !p.pierce) || p.life <= 0) projectiles.splice(i, 1);
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
function drawPlayer(x, y) {
  let sprite = sprites[currentHero];
  if (!sprite || sprite.naturalWidth < 10) {
    sprite = sprites.kael; // fallback
  }
  if (!sprite || sprite.naturalWidth < 10) {
    ctx.fillStyle = getHeroStats().color;
    ctx.fillRect(x, y, player.w, player.h);
    return;
  }
  const frame = Math.max(0, Math.min(23, player.animFrame));
  const col = frame % 6;
  const row = Math.floor(frame / 6);
  const pad = 8;
  const sx = col * KAEL_FW + pad, sy = row * KAEL_FH, sw = KAEL_FW - pad*2, sh = KAEL_FH;
  const drawW = 150, drawH = 150, drawX = x + (player.w - drawW)/2, drawY = y + player.h - drawH + 15;

  ctx.save();
  if (currentHero !== 'kael' && sprite === sprites.kael) {
     ctx.filter = `drop-shadow(0 0 10px ${getHeroStats().color}) hue-rotate(90deg) saturate(2)`;
  }

  if (player.invuln > 0 && Math.floor(player.invuln / 3) % 2 === 0) ctx.globalAlpha = 0.5;
  if (player.facing < 0) {
    ctx.translate(drawX + drawW, drawY); ctx.scale(-1, 1);
    ctx.drawImage(sprite, sx, sy, sw, sh, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(sprite, sx, sy, sw, sh, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}


function drawBoss() {
  if (!boss) return;
  if (boss.dead) return; // Simple disappear for now

  // We reuse Kael sprite but scale it and tint it red
  const frame = Math.max(0, Math.min(23, boss.animFrame));
  const col = frame % 6;
  const row = Math.floor(frame / 6);
  const pad = 8;
  const sx = col * KAEL_FW + pad, sy = row * KAEL_FH, sw = KAEL_FW - pad*2, sh = KAEL_FH;
  const drawW = 180, drawH = 180, drawX = boss.x + (boss.w - drawW)/2, drawY = boss.y + boss.h - drawH + 20;

  ctx.save();
  ctx.globalAlpha = boss.hurtTimer > 0 ? 0.5 : 1.0;
  // Red tint
  ctx.filter = 'hue-rotate(180deg) saturate(3) brightness(0.8)';

  if (boss.facing < 0) {
    ctx.translate(drawX + drawW, drawY); ctx.scale(-1, 1);
    ctx.drawImage(sprites.kael, sx, sy, sw, sh, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(sprites.kael, sx, sy, sw, sh, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
}

function drawLeech(e) {
  if (!sprites.leech || sprites.leech.naturalWidth < 10) return;
  const frame = Math.floor(e.animTimer / 10) % 4;
  const sw = LEECH_FW, sh = LEECH_FH, sx = frame * sw, sy = 0;
  const drawW = 80, drawH = 80, drawX = e.x + (e.w - drawW)/2, drawY = e.y + e.h - drawH;

  ctx.save();
  if (e.hurtTimer > 0) {
      ctx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
  }
  if (e.facing > 0) {
    ctx.translate(drawX + drawW, drawY); ctx.scale(-1, 1);
    ctx.drawImage(sprites.leech, sx, sy, sw, sh, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(sprites.leech, sx, sy, sw, sh, drawX, drawY, drawW, drawH);
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
  let shakeX = 0, shakeY = 0;
  if (screenShake > 0) {
      shakeX = (Math.random() - 0.5) * screenShake;
      shakeY = (Math.random() - 0.5) * screenShake;
  }
  ctx.translate(-cameraX + shakeX, -cameraY + shakeY);

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
  if (currentRoom && currentRoom.isBoss) drawBoss();
  if (gameState !== 'transition') drawPlayer(player.x, player.y);

  particles.forEach(p => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI*2); ctx.fill();
  });


  projectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 8, 4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 4, 2, 0, 0, Math.PI*2);
    ctx.fill();
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
  const selectHero = (e) => {
    if (e && e.type === 'touchend') e.preventDefault();
    document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    currentHero = card.dataset.hero;
    document.getElementById('start-game-btn').classList.add('visible');
  };
  card.addEventListener('click', selectHero);
  card.addEventListener('touchend', selectHero);
});

const startBtn = document.getElementById('start-game-btn');
const startGame = (e) => {
  if (e && e.type === 'touchend') e.preventDefault();
  document.getElementById('hero-select').style.display = 'none';
  setupGame();
};
startBtn.addEventListener('click', startGame);
startBtn.addEventListener('touchend', startGame);

document.getElementById('restart-btn').addEventListener('click', () => {
  document.getElementById('message').style.display = 'none';
  document.getElementById('boss-ui').style.display = 'none';
  gameState = 'hero_select';
  document.getElementById('hero-select').style.display = 'flex';
  document.getElementById('ui').style.display = 'none';
  document.getElementById('controls').style.display = 'none';
  document.getElementById('level-name').style.display = 'none';
});

setupJoystick();
loadSprites(() => console.log('Sprites ready'));
loop();

window.tryAttack = function() { tryAttack(); };