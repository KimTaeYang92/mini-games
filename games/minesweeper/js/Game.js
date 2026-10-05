import { Board } from './Board.js';

export const GameStatus = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  WON: 'WON',
  LOST: 'LOST'
};

export class Game {
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

  // 타일 열기 (좌클릭)
  openCell(r, c) {
    if (this.status === GameStatus.WON || this.status === GameStatus.LOST) return null;

    const cell = this.board.getCell(r, c);
    if (!cell || cell.isOpen || cell.isFlagged) return null;

    // 게임 시작 처리 (첫 클릭 시 지뢰 배치)
    if (this.status === GameStatus.READY) {
      this.board.placeMines(r, c);
      this.status = GameStatus.PLAYING;
      this.startTimer();
    }

    // 지뢰 밟음 -> 패배
    if (cell.isMine) {
      cell.isOpen = true;
      cell.isExploded = true;
      this.gameOver(false);
      return { type: 'explode', cell };
    }

    // 0이면 연쇄 오픈, 아니면 단일 오픈
    if (cell.neighborMines === 0) {
      this.board.floodFill(r, c);
    } else {
      cell.isOpen = true;
    }

    // 승리 조건 체크
    if (this.checkWin()) {
      this.gameOver(true);
      return { type: 'win' };
    }

    return { type: 'open', cell };
  }

  // 깃발 / 물음표 토글 (우클릭)
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

  // 코드 오픈(Chord): 이미 열려있는 숫자 칸 클릭 시 인접 깃발 수 충족되면 나머지 오픈
  chord(r, c) {
    if (this.status !== GameStatus.PLAYING) return null;

    const cell = this.board.getCell(r, c);
    if (!cell || !cell.isOpen || cell.neighborMines === 0) return null;

    // 주변 깃발 개수 확인
    let flagCount = 0;
    this.board.forEachNeighbor(r, c, (nr, nc) => {
      if (this.board.grid[nr][nc].isFlagged) flagCount++;
    });

    if (flagCount !== cell.neighborMines) return null;

    // 깃발이 아닌 미확인 타일들 오픈
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

    // 보드 후처리
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board.grid[r][c];
        if (won) {
          if (cell.isMine) cell.isFlagged = true;
        } else {
          // 패배 시: 잘못 꽂은 깃발 표시, 모든 지뢰 표시
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
