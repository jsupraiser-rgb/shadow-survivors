# Shadow Survivors

A browser-based, Metroidvania-style side-scrolling action game built with HTML5 Canvas and vanilla JavaScript.

## Features
- **4 Playable Heroes**: Kael, Lyra, Vex, and Nyx, each with unique stats and sprite sheets.
- **Combat & Combos**: Unique 3-hit combo system, heavy attacks, dashes, and invulnerability frames.
- **Progression**: 10 distinct interconnected levels featuring platforming and combat. Level 9 features an Overlord boss, and Level 10 culminates in a fight against Zyloth the Void King.
- **Leveling**: Kill enemies to collect souls and gain experience points. Leveling up increases max HP and speed, up to Level 10.
- **Lore-Rich World**: Explore stages with beautiful pixel-art backgrounds spanning "Arena" and "Ruins" themes. Start the game with an atmospheric prologue introducing the game's lore.
- **Mobile Support**: Includes responsive on-screen touch controls.

## How to Play
1. **Move**: A/D or Left/Right Arrows (or left joystick on mobile). Double tap to Dash.
2. **Jump**: W or Up Arrow or Space (or Jump button on mobile).
3. **Attack**: J, Z, or Click (or Attack button on mobile). Rapidly press to combo!
4. **Heavy Attack**: K or X (or Heavy button on mobile).
5. **Special Ability**: E or C (or Dash button on mobile).

## Local Development
Since the game loads external image resources, you must run it through a local web server (opening index.html directly as a file:// may cause CORS errors).
```bash
python3 -m http.server 8000
```
Then visit http://localhost:8000 in your browser.
