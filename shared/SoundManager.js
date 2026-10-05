/**
 * Web Audio API를 활용한 가벼운 신디사이저 효과음 관리자
 * 별도 오디오 파일 없이 브라우저 자체 오디오 컨텍스트로 구동됩니다.
 */
export class SoundManager {
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
    filter.linearRampToValueAtTime ? filter.frequency.linearRampToValueAtTime(50, this.audioCtx.currentTime + 0.5) : filter.frequency.setValueAtTime(50, this.audioCtx.currentTime + 0.5);

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

    const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, High C
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
