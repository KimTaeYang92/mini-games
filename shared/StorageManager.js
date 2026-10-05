/**
 * LocalStorage 기반 게임 점수 및 전적 관리
 */
export class StorageManager {
  static getBestTime(gameId, difficulty) {
    const key = `${gameId}_best_${difficulty}`;
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : null;
  }

  static saveBestTime(gameId, difficulty, time) {
    const prev = this.getBestTime(gameId, difficulty);
    if (prev === null || time < prev) {
      localStorage.setItem(`${gameId}_best_${difficulty}`, time.toString());
      return true; // 신기록 갱신
    }
    return false;
  }

  static getStats(gameId) {
    const key = `${gameId}_stats`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { played: 0, won: 0 };
  }

  static recordGame(gameId, won) {
    const stats = this.getStats(gameId);
    stats.played += 1;
    if (won) stats.won += 1;
    localStorage.setItem(`${gameId}_stats`, JSON.stringify(stats));
    return stats;
  }
}
