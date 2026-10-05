// ==========================================
// 1. 공통 사운드 매니저 (Web Audio API)
// ==========================================
class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }

  playFlag() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
    osc.frequency.setValueAtTime(900, this.audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.08);
  }

  playExplode() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const bufferSize = this.audioCtx.sampleRate * 0.5;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(50, this.audioCtx.currentTime + 0.5);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start();
    noise.stop(this.audioCtx.currentTime + 0.5);
  }

  playWin() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const start = this.audioCtx.currentTime + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

// ==========================================
// 2. 공통 스토리지 매니저 (LocalStorage)
// ==========================================
class StorageManager {
  static getBestTime(gameId, difficulty) {
    try {
      const key = `${gameId}_best_${difficulty}`;
      const val = localStorage.getItem(key);
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  }

  static saveBestTime(gameId, difficulty, time) {
    try {
      const prev = this.getBestTime(gameId, difficulty);
      if (prev === null || time < prev) {
        localStorage.setItem(`${gameId}_best_${difficulty}`, time.toString());
        return true;
      }
    } catch {}
    return false;
  }

  static getStats(gameId) {
    try {
      const key = `${gameId}_stats`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : { played: 0, won: 0 };
    } catch {
      return { played: 0, won: 0 };
    }
  }

  static recordGame(gameId, won) {
    try {
      const stats = this.getStats(gameId);
      stats.played += 1;
      if (won) stats.won += 1;
      localStorage.setItem(`${gameId}_stats`, JSON.stringify(stats));
      return stats;
    } catch {
      return { played: 0, won: 0 };
    }
  }
}

// ==========================================
// 3. 지뢰찾기 보드 클래스
// ==========================================
class Board {
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
          isExploded: false,
          isWrongFlag: false
        });
      }
      this.grid.push(row);
    }
  }

  placeMines(firstRow, firstCol) {
    let placed = 0;
    const safeZone = new Set();

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = firstRow + dr;
        const nc = firstCol + dc;
        if (this.isValid(nr, nc)) {
          safeZone.add(`${nr},${nc}`);
        }
      }
    }

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

// ==========================================
// 4. 지뢰찾기 게임 코어 클래스
// ==========================================
const GameStatus = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  WON: 'WON',
  LOST: 'LOST'
};

class Game {
  constructor(rows = 9, cols = 9, mines = 10) {
    this.rows = rows;
    this.cols = cols;
    this.mines = mines;
    this.board = null;
    this.status = GameStatus.READY;
    this.flagsCount = 0;
    this.timer = 0;
    this.timerInterval = null;
    this.onStateChange = null;
    this.onTick = null;

    this.reset(rows, cols, mines);
  }

  reset(rows = this.rows, cols = this.cols, mines = this.mines) {
    this.stopTimer();
    this.rows = rows;
    this.cols = cols;
    this.mines = mines;
    this.board = new Board(rows, cols, mines);
    this.status = GameStatus.READY;
    this.flagsCount = 0;
    this.timer = 0;

    if (this.onStateChange) this.onStateChange();
    if (this.onTick) this.onTick(this.timer);
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.status === GameStatus.PLAYING) {
        this.timer = Math.min(999, this.timer + 1);
        if (this.onTick) this.onTick(this.timer);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  openCell(r, c) {
    if (this.status === GameStatus.WON || this.status === GameStatus.LOST) return null;

    const cell = this.board.getCell(r, c);
    if (!cell || cell.isOpen || cell.isFlagged) return null;

    if (this.status === GameStatus.READY) {
      this.board.placeMines(r, c);
      this.status = GameStatus.PLAYING;
      this.startTimer();
    }

    if (cell.isMine) {
      cell.isOpen = true;
      cell.isExploded = true;
      this.gameOver(false);
      return { type: 'explode', cell };
    }

    if (cell.neighborMines === 0) {
      this.board.floodFill(r, c);
    } else {
      cell.isOpen = true;
    }

    if (this.checkWin()) {
      this.gameOver(true);
      return { type: 'win' };
    }

    return { type: 'open', cell };
  }

  toggleFlag(r, c) {
    if (this.status === GameStatus.WON || this.status === GameStatus.LOST) return null;

    const cell = this.board.getCell(r, c);
    if (!cell || cell.isOpen) return null;

    if (!cell.isFlagged && !cell.isQuestion) {
      cell.isFlagged = true;
      this.flagsCount++;
    } else if (cell.isFlagged) {
      cell.isFlagged = false;
      cell.isQuestion = true;
      this.flagsCount--;
    } else {
      cell.isQuestion = false;
    }

    return { type: 'flag', cell, flagsCount: this.flagsCount };
  }

  chord(r, c) {
    if (this.status !== GameStatus.PLAYING) return null;

    const cell = this.board.getCell(r, c);
    if (!cell || !cell.isOpen || cell.neighborMines === 0) return null;

    let flagCount = 0;
    this.board.forEachNeighbor(r, c, (nr, nc) => {
      if (this.board.grid[nr][nc].isFlagged) flagCount++;
    });

    if (flagCount !== cell.neighborMines) return null;

    let exploded = false;
    this.board.forEachNeighbor(r, c, (nr, nc) => {
      const neighbor = this.board.grid[nr][nc];
      if (!neighbor.isOpen && !neighbor.isFlagged) {
        if (neighbor.isMine) {
          neighbor.isOpen = true;
          neighbor.isExploded = true;
          exploded = true;
        } else if (neighbor.neighborMines === 0) {
          this.board.floodFill(nr, nc);
        } else {
          neighbor.isOpen = true;
        }
      }
    });

    if (exploded) {
      this.gameOver(false);
      return { type: 'explode' };
    }

    if (this.checkWin()) {
      this.gameOver(true);
      return { type: 'win' };
    }

    return { type: 'chord' };
  }

  checkWin() {
    let openedSafeCells = 0;
    const totalSafeCells = this.rows * this.cols - this.mines;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board.grid[r][c];
        if (!cell.isMine && cell.isOpen) {
          openedSafeCells++;
        }
      }
    }

    return openedSafeCells === totalSafeCells;
  }

  gameOver(won) {
    this.stopTimer();
    this.status = won ? GameStatus.WON : GameStatus.LOST;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board.grid[r][c];
        if (won) {
          if (cell.isMine) cell.isFlagged = true;
        } else {
          if (cell.isMine && !cell.isFlagged) {
            cell.isOpen = true;
          } else if (!cell.isMine && cell.isFlagged) {
            cell.isWrongFlag = true;
          }
        }
      }
    }

    if (won) {
      this.flagsCount = this.mines;
    }
  }

  getRemainingMines() {
    return this.mines - this.flagsCount;
  }
}

// ==========================================
// 5. 지뢰찾기 UI 앱
// ==========================================
const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10, name: '초급 (9x9)' },
  intermediate: { rows: 16, cols: 16, mines: 40, name: '중급 (16x16)' },
  expert: { rows: 16, cols: 30, mines: 99, name: '고급 (30x16)' }
};

class MinesweeperApp {
  constructor() {
    this.currentDifficulty = 'beginner';
    this.config = DIFFICULTIES[this.currentDifficulty];
    this.game = new Game(this.config.rows, this.config.cols, this.config.mines);
    this.sound = new SoundManager();
    this.mobileMode = 'dig';

    this.boardEl = document.getElementById('board');
    this.minesCountEl = document.getElementById('mines-count');
    this.timerEl = document.getElementById('timer');
    this.faceBtn = document.getElementById('face-btn');
    this.difficultySelect = document.getElementById('difficulty-select');
    this.soundBtn = document.getElementById('sound-btn');
    this.bestTimeEl = document.getElementById('best-time');
    this.modeDigBtn = document.getElementById('mode-dig');
    this.modeFlagBtn = document.getElementById('mode-flag');

    this.initEvents();
    this.render();
  }

  initEvents() {
    this.game.onTick = (time) => {
      this.timerEl.textContent = String(time).padStart(3, '0');
    };

    this.difficultySelect.addEventListener('change', (e) => {
      this.currentDifficulty = e.target.value;
      this.config = DIFFICULTIES[this.currentDifficulty];
      this.game.reset(this.config.rows, this.config.cols, this.config.mines);
      this.render();
    });

    this.faceBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.game.reset();
      this.render();
    });

    this.soundBtn.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.soundBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    if (this.modeDigBtn && this.modeFlagBtn) {
      this.modeDigBtn.addEventListener('click', () => {
        this.mobileMode = 'dig';
        this.modeDigBtn.classList.add('active');
        this.modeFlagBtn.classList.remove('active');
      });
      this.modeFlagBtn.addEventListener('click', () => {
        this.mobileMode = 'flag';
        this.modeFlagBtn.classList.add('active');
        this.modeDigBtn.classList.remove('active');
      });
    }

    this.boardEl.addEventListener('contextmenu', (e) => e.preventDefault());

    this.boardEl.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.game.status === GameStatus.PLAYING) {
        this.faceBtn.textContent = '😮';
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.game.status === GameStatus.PLAYING || this.game.status === GameStatus.READY) {
        this.faceBtn.textContent = '😊';
      }
    });

    this.boardEl.addEventListener('mouseup', (e) => {
      const cellEl = e.target.closest('.cell');
      if (!cellEl) return;

      const r = parseInt(cellEl.dataset.row, 10);
      const c = parseInt(cellEl.dataset.col, 10);

      if (e.button === 2) {
        this.handleFlag(r, c);
      } else if (e.button === 0) {
        if (this.mobileMode === 'flag') {
          this.handleFlag(r, c);
        } else {
          this.handleOpen(r, c);
        }
      }
    });

    this.boardEl.addEventListener('dblclick', (e) => {
      const cellEl = e.target.closest('.cell');
      if (!cellEl) return;
      const r = parseInt(cellEl.dataset.row, 10);
      const c = parseInt(cellEl.dataset.col, 10);
      this.handleChord(r, c);
    });
  }

  handleOpen(r, c) {
    const res = this.game.openCell(r, c);
    if (!res) return;

    if (res.type === 'explode') {
      this.sound.playExplode();
      this.faceBtn.textContent = '😵';
      StorageManager.recordGame('minesweeper', false);
    } else if (res.type === 'win') {
      this.sound.playWin();
      this.faceBtn.textContent = '😎';
      StorageManager.recordGame('minesweeper', true);
      const isNewBest = StorageManager.saveBestTime('minesweeper', this.currentDifficulty, this.game.timer);
      if (isNewBest) {
        setTimeout(() => alert(`🎉 축하합니다! 새로운 최고 기록: ${this.game.timer}초!`), 50);
      }
    } else {
      this.sound.playClick();
    }
    this.render();
  }

  handleFlag(r, c) {
    const res = this.game.toggleFlag(r, c);
    if (!res) return;
    this.sound.playFlag();
    this.render();
  }

  handleChord(r, c) {
    const res = this.game.chord(r, c);
    if (!res) return;

    if (res.type === 'explode') {
      this.sound.playExplode();
      this.faceBtn.textContent = '😵';
      StorageManager.recordGame('minesweeper', false);
    } else if (res.type === 'win') {
      this.sound.playWin();
      this.faceBtn.textContent = '😎';
      StorageManager.recordGame('minesweeper', true);
      StorageManager.saveBestTime('minesweeper', this.currentDifficulty, this.game.timer);
    } else {
      this.sound.playClick();
    }
    this.render();
  }

  render() {
    const remaining = this.game.getRemainingMines();
    this.minesCountEl.textContent = String(remaining).padStart(3, '0');
    this.timerEl.textContent = String(this.game.timer).padStart(3, '0');

    if (this.game.status === GameStatus.READY || this.game.status === GameStatus.PLAYING) {
      this.faceBtn.textContent = '😊';
    } else if (this.game.status === GameStatus.WON) {
      this.faceBtn.textContent = '😎';
    } else if (this.game.status === GameStatus.LOST) {
      this.faceBtn.textContent = '😵';
    }

    const best = StorageManager.getBestTime('minesweeper', this.currentDifficulty);
    this.bestTimeEl.textContent = best !== null ? `${best}초` : '-';

    this.boardEl.style.gridTemplateColumns = `repeat(${this.config.cols}, var(--cell-size))`;
    this.boardEl.style.gridTemplateRows = `repeat(${this.config.rows}, var(--cell-size))`;

    if (this.boardEl.children.length !== this.config.rows * this.config.cols) {
      this.boardEl.innerHTML = '';
      for (let r = 0; r < this.config.rows; r++) {
        for (let c = 0; c < this.config.cols; c++) {
          const cellEl = document.createElement('div');
          cellEl.className = 'cell';
          cellEl.dataset.row = r;
          cellEl.dataset.col = c;
          this.boardEl.appendChild(cellEl);
        }
      }
    }

    let idx = 0;
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = this.game.board.grid[r][c];
        const cellEl = this.boardEl.children[idx++];

        cellEl.className = 'cell';
        delete cellEl.dataset.num;
        cellEl.textContent = '';

        if (cell.isOpen) {
          cellEl.classList.add('open');
          if (cell.isMine) {
            cellEl.classList.add('mine');
            cellEl.textContent = '💣';
            if (cell.isExploded) {
              cellEl.classList.add('exploded');
            }
          } else if (cell.neighborMines > 0) {
            cellEl.dataset.num = cell.neighborMines;
            cellEl.textContent = cell.neighborMines;
          }
        } else if (cell.isFlagged) {
          cellEl.classList.add('flagged');
          cellEl.textContent = '🚩';
          if (cell.isWrongFlag) {
            cellEl.classList.add('wrong-flag');
          }
        } else if (cell.isQuestion) {
          cellEl.classList.add('question');
          cellEl.textContent = '❓';
        }
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MinesweeperApp();
});
