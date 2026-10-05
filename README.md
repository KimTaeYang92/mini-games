# 🕹️ 미니게임 천국 (Web Mini Games)

순수 바닐라 자바스크립트(Vanilla JavaScript)와 HTML5, CSS3로 제작된 웹 미니게임 모음 플랫폼입니다.  
별도의 프레임워크나 라이브러리 빌드 없이 브라우저에서 가볍고 빠르게 실행됩니다.

---

## 🎮 수록 게임 목록

### #1 지뢰찾기 (Minesweeper)
- **클래식 규칙 완벽 구현**: 초급(9x9), 중급(16x16), 고급(30x16) 난이도 지원
- **첫 클릭 안전 보장**: 첫 번째 클릭한 칸과 주변 8칸은 지뢰가 배치되지 않음
- **연쇄 오픈 (Flood-fill)**: 0칸 클릭 시 빈 영역 자동 확장
- **코드 오픈 (Chord)**: 숫자 칸 더블 클릭 시 주변 타일 일괄 오픈
- **신디사이저 효과음**: Web Audio API 기반의 자체 사운드 효과 (클릭, 깃발, 폭발, 승리)
- **최고 기록 저장**: 브라우저 `localStorage`를 통한 난이도별 클리어 타임 기록

### #2 스네이크 (Snake) - *준비 중*
### #3 2048 - *준비 중*

---

## 🚀 로컬 실행 방법

별도의 설치나 빌드 과정 없이 `index.html` 파일을 더블 클릭하여 바로 플레이할 수 있습니다.

```bash
# 또는 간단한 로컬 웹 서버 실행 (선택 사항)
npx serve .
# 또는 python -m http.server 8000
```

---

## 🛠️ 기술 스택
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS3 (Grid, Flexbox, Retro Theme)
- **Audio**: Web Audio API
- **Storage**: Web Storage API (localStorage)
