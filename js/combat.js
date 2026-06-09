// =====================================================================
// combat.js — AABB collision detection & projectile-hit processing
// Depends: state.js (projectiles, threats, score)
// Provides (global): aabb, handleCollisions
// Used by: main.js (update)
// =====================================================================

function aabb(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function handleCollisions() {
  for (const p of projectiles) {
    if (p.markedForDeletion) continue;
    for (const z of threats) {
      if (z.markedForDeletion) continue;
      if (z.row !== -1 && z.row !== p.row) continue; // -1 = boss (all rows)
      if (aabb(p, z)) {
        z.takeDamage(p.damage);
        // slow effect from Encryption Tower
        if (p.slow && p.slowDuration) {
          z._slowUntil = performance.now() + p.slowDuration;
          z._slowFactor = p.slow;
        }
        p.markedForDeletion = true;
        Sound.projectileHit();
        break;
      }
    }
  }
}
