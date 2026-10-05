/**
 * 지뢰찾기 격자 및 지뢰 배치 핵심 수학/알고리즘 클래스
 */
export class Board {
  constructor(rows, cols, mines) {
    this.rows = rows;
    this.cols = cols;
    this.mines = mines;
    this.grid = [];
    this.minesPlaced = false;
    this.initGrid();
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isOpen: false,
          isFlagged: false,
          isQuestion: false,
          neighborMines: 0,
          isExploded: false, // 패배를 유발한 지뢰 표시
          isWrongFlag: false // 패배 시 잘못 꽂은 깃발 표시
        });
      }
      this.grid.push(row);
    }
  }

  // 첫 클릭 안전 보장 지뢰 배치 (클릭한 타일 및 8방향 안전지대 지정)
  placeMines(firstRow, firstCol) {
    let placed = 0;
    const safeZone = new Set();
    
    // 첫 클릭 칸과 그 주변 8칸을 안전지대로 등록
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = firstRow + dr;
        const nc = firstCol + dc;
        if (this.isValid(nr, nc)) {
          safeZone.add(`${nr},${nc}`);
        }
      }
    }

    // 총 칸 수에서 안전 구역을 뺀 크기보다 지뢰가 많으면 첫 클릭 칸만 제외
    if (this.rows * this.cols - safeZone.size < this.mines) {
      safeZone.clear();
      safeZone.add(`${firstRow},${firstCol}`);
    }

    while (placed < this.mines) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      const key = `${r},${c}`;

      if (!this.grid[r][c].isMine && !safeZone.has(key)) {
        this.grid[r][c].isMine = true;
        placed++;
      }
    }

    // 인접 지뢰 개수 사전 계산
    this.calculateNeighbors();
    this.minesPlaced = true;
  }

  calculateNeighbors() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].isMine) continue;
        let count = 0;
        this.forEachNeighbor(r, c, (nr, nc) => {
          if (this.grid[nr][nc].isMine) count++;
        });
        this.grid[r][c].neighborMines = count;
      }
    }
  }

  isValid(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  forEachNeighbor(r, c, callback) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (this.isValid(nr, nc)) {
          callback(nr, nc);
        }
      }
    }
  }

  getCell(r, c) {
    if (!this.isValid(r, c)) return null;
    return this.grid[r][c];
  }

  // Flood-fill: 0인 타일 클릭 시 주변 연속 오픈
  floodFill(r, c, openedSet = new Set()) {
    const start = this.getCell(r, c);
    if (!start || start.isOpen || start.isFlagged || start.isMine) return openedSet;

    const queue = [[r, c]];
    openedSet.add(`${r},${c}`);
    start.isOpen = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift();
      const cell = this.grid[currR][currC];

      if (cell.neighborMines === 0) {
        this.forEachNeighbor(currR, currC, (nr, nc) => {
          const neighbor = this.grid[nr][nc];
          const key = `${nr},${nc}`;
          if (!neighbor.isOpen && !neighbor.isFlagged && !neighbor.isMine && !openedSet.has(key)) {
            neighbor.isOpen = true;
            openedSet.add(key);
            if (neighbor.neighborMines === 0) {
              queue.push([nr, nc]);
            }
          }
        });
      }
    }

    return openedSet;
  }
}
