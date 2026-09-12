class SoundService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private audioCache: Record<string, HTMLAudioElement> = {};

  constructor() {
    this.muted = localStorage.getItem('codexcape_muted') === 'true';
  }

  private initCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('codexcape_muted', String(this.muted));
    if (this.muted) {
      this.stopAmbientHum();
    } else {
      this.playClick();
    }
    return this.muted;
  }

  public setMuted(val: boolean): boolean {
    this.muted = val;
    localStorage.setItem('codexcape_muted', String(this.muted));
    if (this.muted) {
      this.stopAmbientHum();
    }
    return this.muted;
  }

  // Preload local audio files
  public preloadHomeSounds() {
    if (typeof window === 'undefined') return;
    const paths = [
      '/assets/sounds/knock-impact.mp3',
      '/assets/sounds/x-approach-whoosh.mp3',
      '/assets/sounds/glitch-transition.mp3',
    ];
    paths.forEach((p) => {
      try {
        if (!this.audioCache[p]) {
          const audio = new Audio(p);
          audio.preload = 'auto';
          this.audioCache[p] = audio;
        }
      } catch {}
    });
  }

  private playSoundFile(src: string, volume: number = 0.42, fallbackSynth?: () => void) {
    if (this.muted) return;
    const clampedVol = Math.max(0.1, Math.min(0.5, volume));

    try {
      let audio = this.audioCache[src];
      if (!audio) {
        audio = new Audio(src);
        audio.preload = 'auto';
        this.audioCache[src] = audio;
      }
      audio.currentTime = 0;
      audio.volume = clampedVol;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy or codec blocks file playback, execute synthesized fallback
          if (fallbackSynth) fallbackSynth();
        });
      }
    } catch {
      if (fallbackSynth) fallbackSynth();
    }
  }

  // 1. Heavy Glass / Metallic Knock Sound (~0.75s)
  public playKnockImpact(volume: number = 0.45) {
    if (this.muted) return;
    this.playSoundFile('/assets/sounds/knock-impact.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        // Deep low sub thud (68Hz -> 38Hz)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(68, now);
        subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.38);
        subGain.gain.setValueAtTime(volume * 0.9, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.38);

        // Metallic / glass resonant ring (1840Hz & 2460Hz)
        [1840, 2460].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(volume * 0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.65);
        });
      } catch {}
    });
  }

  // 2. Rising Digital Whoosh as X surges forward (~0.95s)
  public playXApproachWhoosh(volume: number = 0.38) {
    if (this.muted) return;
    this.playSoundFile('/assets/sounds/x-approach-whoosh.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.85);
        gain.gain.setValueAtTime(volume * 0.15, now);
        gain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.65);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.92);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.92);
      } catch {}
    });
  }

  // 3. Short Low Glitch / Fade-Out Sound (~0.45s)
  public playGlitchTransition(volume: number = 0.4) {
    if (this.muted) return;
    this.playSoundFile('/assets/sounds/glitch-transition.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(85, now);
        osc.frequency.linearRampToValueAtTime(32, now + 0.35);
        gain.gain.setValueAtTime(volume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch {}
    });
  }

  // Subtle ambient server hum (55Hz / 110Hz sub-audible texture)
  public startAmbientHum() {
    if (this.muted || this.ambientOsc) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      this.ambientOsc = ctx.createOscillator();
      this.ambientGain = ctx.createGain();

      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.setValueAtTime(55, ctx.currentTime);

      this.ambientGain.gain.setValueAtTime(0.015, ctx.currentTime);

      this.ambientOsc.connect(this.ambientGain);
      this.ambientGain.connect(ctx.destination);
      this.ambientOsc.start();
    } catch {}
  }

  public stopAmbientHum() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch {}
      this.ambientOsc = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {}
      this.ambientGain = null;
    }
  }

  // Silence ambient briefly before Final Protocol
  public silenceAmbient() {
    this.stopAmbientHum();
  }

  // Crisp mechanical key click / button tap
  public playClick() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  // Access Denied / Invalid Sequence: Low harsh buzz pulse
  public playAccessDenied() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  // Access Granted / Evidence Verified: Ascending two-tone harmonic chime
  public playAccessGranted() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.1);
      gain2.gain.setValueAtTime(0.2, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.35);
    } catch {}
  }

  // Level Unlock: Resonant deep sweep chord
  public playLevelUnlock() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [220, 330, 440, 660].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + 0.6);
      });
    } catch {}
  }

  // Teammate Action / Remote Signal: Subtle radar pip
  public playRadarPip() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  // Core System Activation Drone (Level 6)
  public playCoreActivation() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [110, 165, 220].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch {}
  }

  // System Recovery Restoration Chime (Final Protocol Success)
  public playSystemRestoration() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [261.63, 329.63, 392.00, 523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.16, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.8);
      });
    } catch {}
  }
}

export const soundService = new SoundService();
