/* ============================================================
   GENERÁTOR BLUDIŠTĚ + hledání cesty
   ============================================================ */
(function () {
  "use strict";

  const TILE = 32;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  class Maze {
    constructor(cols, rows, chestCount) {
      this.cols = cols;
      this.rows = rows;
      this.chestCount = chestCount || 5;
      this.grid = Array.from({ length: rows }, () => new Uint8Array(cols).fill(1));
      this.spawn = { x: 1, y: 1 };
      this.exit = { x: 1, y: 1 };
      this.chestSpots = [];
      this.enemySpawns = [];
      this.floors = [];
      this.decor = [];
      this.dist = null;
      this.build();
    }

    idx(x, y) { return y * this.cols + x; }

    isWall(x, y) {
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return true;
      return this.grid[y][x] === 1;
    }

    setFloor(x, y) {
      if (x > 0 && y > 0 && x < this.cols - 1 && y < this.rows - 1) this.grid[y][x] = 0;
    }

    build() {
      const w = this.cols, h = this.rows;
      const startX = 1, startY = 1;
      const stack = [[startX, startY]];
      const visited = Array.from({ length: h }, () => new Uint8Array(w));
      visited[startY][startX] = 1;
      this.setFloor(startX, startY);

      const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        const options = [];
        for (const [dx, dy] of dirs) {
          const nx = cx + dx, ny = cy + dy;
          if (nx > 0 && ny > 0 && nx < w - 1 && ny < h - 1 && !visited[ny][nx]) {
            options.push([nx, ny, dx, dy]);
          }
        }
        if (!options.length) { stack.pop(); continue; }
        const [nx, ny, dx, dy] = options[Math.floor(Math.random() * options.length)];
        visited[ny][nx] = 1;
        this.setFloor(cx + dx / 2, cy + dy / 2);
        this.setFloor(nx, ny);
        stack.push([nx, ny]);
      }

      // Přidání smyček, aby bludiště nebylo jen jeden dlouhý tunel.
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (this.grid[y][x] !== 1) continue;
          const hOpen = !this.isWall(x - 1, y) && !this.isWall(x + 1, y);
          const vOpen = !this.isWall(x, y - 1) && !this.isWall(x, y + 1);
          if ((hOpen || vOpen) && Math.random() < 0.17) this.grid[y][x] = 0;
        }
      }

      // Centrální startovní místnost
      const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
      for (let yy = cy - 1; yy <= cy + 1; yy++) {
        for (let xx = cx - 1; xx <= cx + 1; xx++) this.setFloor(xx, yy);
      }
      this.spawn = { x: cx, y: cy };

      this.collectFloors();
      this.dist = this.distanceField(this.spawn.x, this.spawn.y);
      this.choosePoints();
      this.makeDecor();
    }

    collectFloors() {
      this.floors = [];
      for (let y = 1; y < this.rows - 1; y++) {
        for (let x = 1; x < this.cols - 1; x++) {
          if (!this.isWall(x, y)) this.floors.push({ x, y });
        }
      }
    }

    distanceField(sx, sy) {
      const w = this.cols, h = this.rows;
      const dist = new Int32Array(w * h).fill(-1);
      const q = new Int32Array(w * h);
      let head = 0, tail = 0;
      const s = sy * w + sx;
      dist[s] = 0;
      q[tail++] = s;
      while (head < tail) {
        const cur = q[head++];
        const cx = cur % w, cy = (cur / w) | 0;
        const nd = dist[cur] + 1;
        const nb = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (const [nx, ny] of nb) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (this.grid[ny][nx] === 1) continue;
          const ni = ny * w + nx;
          if (dist[ni] !== -1) continue;
          dist[ni] = nd;
          q[tail++] = ni;
        }
      }
      return dist;
    }

    getDist(x, y) {
      if (!this.dist) return 0;
      return this.dist[y * this.cols + x];
    }

    neighbors(x, y) {
      const result = [];
      if (!this.isWall(x + 1, y)) result.push({ x: x + 1, y });
      if (!this.isWall(x - 1, y)) result.push({ x: x - 1, y });
      if (!this.isWall(x, y + 1)) result.push({ x, y: y + 1 });
      if (!this.isWall(x, y - 1)) result.push({ x, y: y - 1 });
      return result;
    }

    choosePoints() {
      const deadEnds = this.floors.filter((t) => {
        if (t.x === this.spawn.x && t.y === this.spawn.y) return false;
        return this.neighbors(t.x, t.y).length === 1 && this.getDist(t.x, t.y) >= 6;
      });

      const used = new Set();
      const key = (t) => t.x + "," + t.y;
      const chestCount = this.chestCount || 5;
      const farFloors = this.floors
        .filter((t) => this.getDist(t.x, t.y) >= 6)
        .sort((a, b) => this.getDist(b.x, b.y) - this.getDist(a.x, a.y));

      const candidates = shuffle(deadEnds.length >= chestCount ? deadEnds : farFloors);
      const chests = [];
      for (const t of candidates) {
        if (chests.length >= chestCount) break;
        if (used.has(key(t))) continue;
        const tooClose = chests.some((c) => Math.abs(c.x - t.x) + Math.abs(c.y - t.y) < 5);
        if (tooClose) continue;
        chests.push(t);
        used.add(key(t));
      }
      // záložní pozice, kdyby bylo málo mrtvých uliček
      for (const t of farFloors) {
        if (chests.length >= chestCount) break;
        if (used.has(key(t))) continue;
        if (chests.some((c) => Math.abs(c.x - t.x) + Math.abs(c.y - t.y) < 4)) continue;
        chests.push(t);
        used.add(key(t));
      }
      this.chestSpots = chests;

      // Východ co nejdál od truhel i od startu.
      let best = null, bestScore = -Infinity;
      const exitCandidates = this.floors.filter((t) => this.getDist(t.x, t.y) >= 7 && !used.has(key(t)));
      for (const t of exitCandidates) {
        let minChest = Infinity;
        for (const c of chests) minChest = Math.min(minChest, Math.abs(c.x - t.x) + Math.abs(c.y - t.y));
        const score = minChest * 2 + this.getDist(t.x, t.y) * 0.45;
        if (score > bestScore) { bestScore = score; best = t; }
      }
      this.exit = best || farFloors[0] || { x: this.spawn.x + 2, y: this.spawn.y };

      this.enemySpawns = this.floors.filter((t) => {
        const d = this.getDist(t.x, t.y);
        return d >= 6 && !(t.x === this.exit.x && t.y === this.exit.y);
      });
      if (!this.enemySpawns.length) this.enemySpawns = this.floors.filter((t) => this.getDist(t.x, t.y) > 3);
    }

    makeDecor() {
      const decos = [];
      for (let y = 1; y < this.rows - 1; y++) {
        for (let x = 1; x < this.cols - 1; x++) {
          if (this.grid[y][x] !== 1) continue;
          const touchesFloor = !this.isWall(x - 1, y) || !this.isWall(x + 1, y) ||
            !this.isWall(x, y - 1) || !this.isWall(x, y + 1);
          if (!touchesFloor) continue;
          const r = Math.random();
          if (r < 0.035) decos.push({ x, y, type: Math.random() < 0.55 ? "crystal" : "rune", hue: Math.random() });
        }
      }
      this.decor = decos;
    }

    /** BFS cesta z jednoho pole do druhého. Vrací pole kroků bez startu. */
    findPath(sx, sy, tx, ty) {
      if (sx === tx && sy === ty) return [];
      if (this.isWall(sx, sy) || this.isWall(tx, ty)) return null;
      const w = this.cols, h = this.rows, total = w * h;
      const prev = new Int32Array(total).fill(-2);
      const q = new Int32Array(total);
      let head = 0, tail = 0;
      const start = sy * w + sx;
      const goal = ty * w + tx;
      prev[start] = -1;
      q[tail++] = start;
      let found = false;
      while (head < tail) {
        const cur = q[head++];
        if (cur === goal) { found = true; break; }
        const cx = cur % w, cy = (cur / w) | 0;
        // pořadí sousedů je záměrně promíchávané kvůli přirozenějšímu pohybu
        const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (let i = neighbors.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
        }
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (this.grid[ny][nx] === 1) continue;
          const ni = ny * w + nx;
          if (prev[ni] !== -2) continue;
          prev[ni] = cur;
          q[tail++] = ni;
        }
      }
      if (!found) return null;
      const path = [];
      let cur = goal;
      while (cur !== start) {
        path.push({ x: cur % w, y: (cur / w) | 0 });
        cur = prev[cur];
        if (cur < 0) break;
      }
      path.reverse();
      return path;
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
  }

  function generate(cols, rows, chestCount) {
    return new Maze(cols, rows, chestCount);
  }

  // Pomocné převody
  const toPx = (tile) => (tile + 0.5) * TILE;
  const toTile = (px) => Math.floor(px / TILE);

  window.MazeBuilder = { generate, Maze, TILE, toPx, toTile };
})();
