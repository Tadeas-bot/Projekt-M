/* ============================================================
   NEKONEČNÉ BLUDIŠTĚ + hledání cesty
   ============================================================ */
(function () {
  "use strict";

  const TILE = 32;
  const CHUNK = 16;          // dlaždic na jednu část mapy
  const CELLS = 7;           // vnitřní bludištní mřížka 7 × 7
  const CELL_STEP = 2;

  function mulberry32(a) {
    a |= 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(seed, cx, cy, salt) {
    let h = seed >>> 0;
    h = Math.imul(h ^ (cx | 0), 0x27d4eb2d);
    h = Math.imul(h ^ (cy | 0), 0x165667b1);
    h ^= (salt || 0) >>> 0;
    h ^= h >>> 15;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  /* Malá binární halda pro A* */
  class MinHeap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    push(node) {
      const a = this.a;
      a.push(node);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p].f <= a[i].f) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    }
    pop() {
      const a = this.a;
      const top = a[0];
      const last = a.pop();
      if (a.length && last) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let smallest = i;
          if (l < a.length && a[l].f < a[smallest].f) smallest = l;
          if (r < a.length && a[r].f < a[smallest].f) smallest = r;
          if (smallest === i) break;
          [a[i], a[smallest]] = [a[smallest], a[i]];
          i = smallest;
        }
      }
      return top;
    }
  }

  class InfiniteMaze {
    constructor(seed) {
      this.seed = (seed >>> 0) || 1;
      this.chunks = new Map();
      this.spawn = { x: CHUNK / 2, y: CHUNK / 2 }; // (8, 8) – startovní místnost
      this.getChunk(0, 0); // vytvoří startovní část
    }

    key(cx, cy) { return cx + "," + cy; }

    getChunk(cx, cy) {
      const key = this.key(cx, cy);
      let chunk = this.chunks.get(key);
      if (!chunk) {
        chunk = this.generateChunk(cx, cy);
        this.chunks.set(key, chunk);
      }
      return chunk;
    }

    chunkAt(tx, ty) {
      const cx = Math.floor(tx / CHUNK);
      const cy = Math.floor(ty / CHUNK);
      const lx = tx - cx * CHUNK;
      const ly = ty - cy * CHUNK;
      return { chunk: this.getChunk(cx, cy), cx, cy, lx, ly };
    }

    isWall(tx, ty) {
      const { chunk, lx, ly } = this.chunkAt(tx, ty);
      return chunk.grid[ly * CHUNK + lx] === 1;
    }

    isFloor(tx, ty) { return !this.isWall(tx, ty); }

    neighbors(x, y) {
      const result = [];
      if (!this.isWall(x + 1, y)) result.push({ x: x + 1, y });
      if (!this.isWall(x - 1, y)) result.push({ x: x - 1, y });
      if (!this.isWall(x, y + 1)) result.push({ x, y: y + 1 });
      if (!this.isWall(x, y - 1)) result.push({ x, y: y - 1 });
      return result;
    }

    hasLineOfSight(x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / 8));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t, py = y1 + dy * t;
        if (this.isWall(Math.floor(px / TILE), Math.floor(py / TILE))) return false;
      }
      return true;
    }

    /** Deterministická náhoda pro danou část mapy (0–1). */
    chunkRandom(cx, cy, salt) {
      return hashSeed(this.seed, cx, cy, salt || 0) / 4294967296;
    }

    generateChunk(cx, cy) {
      const rng = mulberry32(hashSeed(this.seed, cx, cy, 1));
      const grid = new Uint8Array(CHUNK * CHUNK).fill(1);
      const idx = (x, y) => y * CHUNK + x;
      const carve = (x, y) => {
        if (x >= 0 && y >= 0 && x < CHUNK && y < CHUNK) grid[idx(x, y)] = 0;
      };

      // 1) Otevřená pole pravidelné mřížky.
      for (let gy = 0; gy < CELLS; gy++) {
        for (let gx = 0; gx < CELLS; gx++) {
          carve(1 + gx * CELL_STEP, 1 + gy * CELL_STEP);
        }
      }

      // 2) Náhodné bludiště (rekurzivní prohledávání).
      const visited = new Uint8Array(CELLS * CELLS);
      const stack = [[0, 0]];
      visited[0] = 1;
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (stack.length) {
        const [gx, gy] = stack[stack.length - 1];
        const options = [];
        for (const [dx, dy] of dirs) {
          const nx = gx + dx, ny = gy + dy;
          if (nx < 0 || ny < 0 || nx >= CELLS || ny >= CELLS) continue;
          if (visited[ny * CELLS + nx]) continue;
          options.push([nx, ny, dx, dy]);
        }
        if (!options.length) { stack.pop(); continue; }
        const [nx, ny, dx, dy] = options[Math.floor(rng() * options.length)];
        visited[ny * CELLS + nx] = 1;
        carve(1 + gx * CELL_STEP + dx, 1 + gy * CELL_STEP + dy);
        stack.push([nx, ny]);
      }

      // 3) Občasná smyčka, aby se dalo obcházet a nešlo jen o jeden tunel.
      for (let y = 1; y < CHUNK - 1; y++) {
        for (let x = 1; x < CHUNK - 1; x++) {
          if (grid[idx(x, y)] !== 1) continue;
          const hOpen = !grid[idx(x - 1, y)] && !grid[idx(x + 1, y)];
          const vOpen = !grid[idx(x, y - 1)] && !grid[idx(x, y + 1)];
          if ((hOpen || vOpen) && rng() < 0.085) grid[idx(x, y)] = 0;
        }
      }

      // 4) Průchody na hranicích částí – vždy na stejných místech,
      //    takže na sebe sousední části plynule navazují.
      carve(8, 0);
      carve(8, CHUNK - 1);
      carve(0, 8);
      carve(CHUNK - 1, 8);

      // 5) Napojení hraničních průchodů na vnitřní bludiště.
      carve(8, 1);
      if (rng() < 0.5) carve(7, 1); else carve(9, 1);

      carve(8, CHUNK - 2);
      if (rng() < 0.5) { carve(7, CHUNK - 2); carve(7, CHUNK - 3); }
      else { carve(9, CHUNK - 2); carve(9, CHUNK - 3); }

      carve(1, 8);
      if (rng() < 0.5) carve(1, 7); else carve(1, 9);

      carve(CHUNK - 2, 8);
      if (rng() < 0.5) { carve(CHUNK - 2, 7); carve(CHUNK - 3, 7); }
      else { carve(CHUNK - 2, 9); carve(CHUNK - 3, 9); }

      // 6) Startovní místnost.
      if (cx === 0 && cy === 0) {
        for (let y = 7; y <= 9; y++) {
          for (let x = 7; x <= 9; x++) carve(x, y);
        }
      }

      // 7) Seznam podlah, slepých uliček a dekorací.
      const floors = [];
      const deadEnds = [];
      for (let y = 0; y < CHUNK; y++) {
        for (let x = 0; x < CHUNK; x++) {
          if (grid[idx(x, y)] === 1) continue;
          const wx = cx * CHUNK + x;
          const wy = cy * CHUNK + y;
          floors.push({ x: wx, y: wy });
          let open = 0;
          if (x > 0 && grid[idx(x - 1, y)] === 0) open++;
          if (x < CHUNK - 1 && grid[idx(x + 1, y)] === 0) open++;
          if (y > 0 && grid[idx(x, y - 1)] === 0) open++;
          if (y < CHUNK - 1 && grid[idx(x, y + 1)] === 0) open++;
          if (open === 1) deadEnds.push({ x: wx, y: wy });
        }
      }

      const decor = [];
      for (let y = 1; y < CHUNK - 1; y++) {
        for (let x = 1; x < CHUNK - 1; x++) {
          if (grid[idx(x, y)] !== 1) continue;
          const touchesFloor = grid[idx(x - 1, y)] === 0 || grid[idx(x + 1, y)] === 0 ||
            grid[idx(x, y - 1)] === 0 || grid[idx(x, y + 1)] === 0;
          if (!touchesFloor) continue;
          if (rng() < 0.035) {
            decor.push({
              x: cx * CHUNK + x,
              y: cy * CHUNK + y,
              type: rng() < 0.55 ? "crystal" : "rune",
              hue: rng()
            });
          }
        }
      }

      return {
        cx, cy, grid, floors, deadEnds, decor,
        canvas: null, canvasDpr: 0
      };
    }

    /** Všechna volná pole v okolí bodu (v dlaždicích). */
    floorsAround(px, py, radiusTiles) {
      const r = Math.max(1, radiusTiles || 8);
      const minCX = Math.floor((px - r) / CHUNK);
      const maxCX = Math.floor((px + r) / CHUNK);
      const minCY = Math.floor((py - r) / CHUNK);
      const maxCY = Math.floor((py + r) / CHUNK);
      const out = [];
      const r2 = r * r;
      for (let cy = minCY; cy <= maxCY; cy++) {
        for (let cx = minCX; cx <= maxCX; cx++) {
          const chunk = this.getChunk(cx, cy);
          for (const f of chunk.floors) {
            const dx = f.x - px, dy = f.y - py;
            if (dx * dx + dy * dy <= r2) out.push(f);
          }
        }
      }
      return out;
    }

    /** BFS cesta z jednoho pole do druhého (bez startu). */
    findPath(sx, sy, tx, ty, maxNodes) {
      if (sx === tx && sy === ty) return [];
      if (this.isWall(sx, sy) || this.isWall(tx, ty)) return null;
      const startKey = sx + "," + sy;
      const goalKey = tx + "," + ty;
      const open = new MinHeap();
      const gScore = new Map();
      const came = new Map();
      const closed = new Set();
      gScore.set(startKey, 0);
      open.push({ x: sx, y: sy, f: Math.abs(tx - sx) + Math.abs(ty - sy) });
      let expanded = 0;
      const limit = maxNodes || 14000;

      while (open.size) {
        const cur = open.pop();
        const ck = cur.x + "," + cur.y;
        if (closed.has(ck)) continue;
        closed.add(ck);
        if (ck === goalKey) {
          const path = [];
          let k = goalKey;
          while (k !== startKey) {
            const parts = k.split(",");
            path.push({ x: Number(parts[0]), y: Number(parts[1]) });
            k = came.get(k);
            if (!k) return null;
          }
          path.reverse();
          return path;
        }
        if (++expanded > limit) break;
        const cg = gScore.get(ck) || 0;
        for (const n of this.neighbors(cur.x, cur.y)) {
          const nk = n.x + "," + n.y;
          if (closed.has(nk)) continue;
          const ng = cg + 1;
          const old = gScore.get(nk);
          if (old !== undefined && ng >= old) continue;
          gScore.set(nk, ng);
          came.set(nk, ck);
          open.push({ x: n.x, y: n.y, f: ng + Math.abs(tx - n.x) + Math.abs(ty - n.y) });
        }
      }
      return null;
    }

    /**
     * Najde náhodné dosažitelné pole ve vzdálenosti minDist–maxDist
     * a vrátí ho spolu s cestou ze startu.
     */
    findDistantTile(sx, sy, minDist, maxDist, rng) {
      if (this.isWall(sx, sy)) return null;
      const random = rng || Math.random;
      const startKey = sx + "," + sy;
      const dist = new Map([[startKey, 0]]);
      const came = new Map();
      const queue = [{ x: sx, y: sy }];
      let head = 0;
      const candidates = [];
      const maxNodes = 36000;

      while (head < queue.length && head < maxNodes) {
        const cur = queue[head++];
        const ck = cur.x + "," + cur.y;
        const d = dist.get(ck) || 0;
        if (d >= maxDist) continue;
        for (const n of this.neighbors(cur.x, cur.y)) {
          const nk = n.x + "," + n.y;
          if (dist.has(nk)) continue;
          const nd = d + 1;
          dist.set(nk, nd);
          came.set(nk, ck);
          queue.push(n);
          if (nd >= minDist && nd <= maxDist) {
            candidates.push({ x: n.x, y: n.y, dist: nd });
          }
        }
      }

      if (!candidates.length) return null;
      const target = (minDist + maxDist) / 2;
      candidates.sort((a, b) => Math.abs(a.dist - target) - Math.abs(b.dist - target));
      const pool = Math.min(candidates.length, 40);
      const chosen = candidates[Math.floor(random() * pool)];

      const path = [];
      let k = chosen.x + "," + chosen.y;
      while (k !== startKey) {
        const parts = k.split(",");
        path.push({ x: Number(parts[0]), y: Number(parts[1]) });
        k = came.get(k);
        if (!k) break;
      }
      path.reverse();
      return { x: chosen.x, y: chosen.y, path, distance: chosen.dist };
    }

    /** Uvolní části mapy, které už jsou daleko od hráče. */
    prune(px, py, radiusChunks) {
      const cx = Math.floor(px / CHUNK);
      const cy = Math.floor(py / CHUNK);
      const r = radiusChunks || 10;
      for (const [key, chunk] of this.chunks) {
        if (Math.abs(chunk.cx - cx) > r || Math.abs(chunk.cy - cy) > r) {
          this.chunks.delete(key);
        }
      }
    }
  }

  function generate(seed) {
    return new InfiniteMaze(seed);
  }

  // Pomocné převody
  const toPx = (tile) => (tile + 0.5) * TILE;
  const toTile = (px) => Math.floor(px / TILE);

  window.MazeBuilder = {
    generate, InfiniteMaze, TILE, CHUNK,
    toPx, toTile
  };
})();
