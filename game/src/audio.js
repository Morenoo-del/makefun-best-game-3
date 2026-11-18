// TIDEWARDEN — all sound is synthesised live with WebAudio: no audio files.
// Short blips for shots, coins and leaks; a slow generative sea-shanty loop
// (a plucked pentatonic line over a low drone) for the music.

const NOTE = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0 };

const MELODY = [
  ['E4', 0.5], ['G4', 0.5], ['A4', 1], ['G4', 0.5], ['E4', 0.5],
  ['D4', 1], ['E4', 1], ['C4', 1.5], ['D4', 0.5],
  ['E4', 0.5], ['G4', 0.5], ['A4', 0.5], ['C5', 0.5], ['A4', 1],
  ['G4', 0.5], ['E4', 0.5], ['D4', 1], ['C4', 2],
];

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicOn = false;
    this.step = 0;
    this.nextNoteAt = 0;
  }

  // Browsers only let audio start after a gesture; call from the first click.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
    } catch (_e) {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, lowpass) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = lowpass;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  shoot(kind) {
    if (kind === 'harpoon') this.tone(880, 0.07, 'square', 0.10, 0, 320);
    else if (kind === 'coral') this.tone(1320, 0.12, 'sine', 0.08, 0, 660);
    else if (kind === 'tide') this.noise(0.22, 0.16, 900);
    else this.tone(523, 0.1, 'triangle', 0.07, 0, 784);
  }

  hit() { this.tone(220, 0.05, 'triangle', 0.06, 0, 140); }
  coin() { this.tone(987, 0.09, 'sine', 0.09); this.tone(1318, 0.14, 'sine', 0.08, 0.07); }
  build() { this.tone(392, 0.1, 'triangle', 0.12); this.tone(523, 0.12, 'triangle', 0.12, 0.08); }
  upgrade() { this.tone(523, 0.09, 'triangle', 0.11); this.tone(659, 0.09, 'triangle', 0.11, 0.08); this.tone(784, 0.16, 'triangle', 0.11, 0.16); }
  leak() { this.tone(196, 0.3, 'sawtooth', 0.16, 0, 98); this.noise(0.25, 0.12, 500); }
  horn() { this.tone(146, 0.5, 'sawtooth', 0.14, 0, 146); this.tone(220, 0.5, 'sawtooth', 0.10, 0.05, 220); }
  bossRoar() { this.tone(82, 0.9, 'sawtooth', 0.18, 0, 55); this.noise(0.8, 0.14, 300); }
  victory() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, i * 0.13)); }
  // A soft two-note dawn chime when a night is survived.
  dawn() { this.tone(659, 0.25, 'sine', 0.10); this.tone(880, 0.4, 'sine', 0.10, 0.18); }
  defeat() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.12, i * 0.16)); }

  // A slow generative loop: plucked pentatonic melody over a low drone.
  // Called every frame; schedules notes just ahead of the playhead.
  tickMusic(dt) {
    if (!this.ctx || this.muted || !this.musicOn) return;
    if (this.nextNoteAt === 0) this.nextNoteAt = this.ctx.currentTime + 0.1;
    while (this.nextNoteAt < this.ctx.currentTime + 0.25) {
      const [name, beats] = MELODY[this.step % MELODY.length];
      const freq = NOTE[name];
      const t0 = this.nextNoteAt;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + beats * 0.42);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t0);
      osc.stop(t0 + beats * 0.45);
      // Low drone under every fourth note.
      if (this.step % 4 === 0) {
        const d = this.ctx.createOscillator();
        const dg = this.ctx.createGain();
        d.type = 'sine';
        d.frequency.value = NOTE.C4 / 2;
        dg.gain.setValueAtTime(0.0001, t0);
        dg.gain.linearRampToValueAtTime(0.35, t0 + 0.4);
        dg.gain.linearRampToValueAtTime(0.0001, t0 + beats * 1.7);
        d.connect(dg);
        dg.connect(this.musicGain);
        d.start(t0);
        d.stop(t0 + beats * 1.8);
      }
      this.nextNoteAt += beats * 0.42;
      this.step++;
    }
  }

  startMusic() { this.musicOn = true; }
  stopMusic() { this.musicOn = false; }
}
