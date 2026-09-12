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

  private uiListenersInitialized: boolean = false;
  private lastTouchTime: number = 0;
  private lastClickTime: number = 0;
  private lastHoverTime: number = 0;
  private lastTypingTime: number = 0;
  private typingPool: HTMLAudioElement[] = [];
  private typingPoolIndex: number = 0;

  // Preload local audio files
  public preloadHomeSounds() {
    this.preloadUiSounds();
  }

  public preloadUiSounds() {
    if (typeof window === 'undefined') return;
    const paths = [
      '/sounds/click.mp3',
      '/sounds/hover.mp3',
      '/sounds/select.mp3',
      '/sounds/arena-enter.mp3',
      '/sounds/unlock.mp3',
      '/sounds/discover.mp3',
      '/sounds/correct.mp3',
      '/sounds/wrong.mp3',
      '/sounds/success.mp3',
      '/sounds/error.mp3',
      '/sounds/typing.mp3',
      '/assets/sounds/knock-impact.mp3',
      '/assets/sounds/x-approach-whoosh.mp3',
      '/assets/sounds/glitch-transition.mp3',
      '/assets/sounds/find-way-out-unlock.mp3',
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

    // Pre-initialize circular pool for smooth rapid typing without distortion
    try {
      if (this.typingPool.length === 0) {
        for (let i = 0; i < 4; i++) {
          const a = new Audio('/sounds/typing.mp3');
          a.preload = 'auto';
          this.typingPool.push(a);
        }
      }
    } catch {}
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

  // 4. FIND THE WAY OUT Cyber-Security Terminal Unlock Sound (~0.85s)
  public playFindWayOutUnlock(volume: number = 0.48) {
    if (this.muted) return;
    this.playSoundFile('/assets/sounds/find-way-out-unlock.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;

        // Phase 1: Electronic impact click & sub punch (0-0.05s)
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(1350, now);
        clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
        clickGain.gain.setValueAtTime(volume * 0.7, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.05);

        // Sub punch
        const punchOsc = ctx.createOscillator();
        const punchGain = ctx.createGain();
        punchOsc.type = 'sine';
        punchOsc.frequency.setValueAtTime(62, now);
        punchOsc.frequency.linearRampToValueAtTime(40, now + 0.08);
        punchGain.gain.setValueAtTime(volume * 0.8, now);
        punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        punchOsc.connect(punchGain);
        punchGain.connect(ctx.destination);
        punchOsc.start(now);
        punchOsc.stop(now + 0.08);

        // Phase 2: Rising crimson digital whoosh (0.04s - 0.45s)
        const whooshOsc = ctx.createOscillator();
        const whooshGain = ctx.createGain();
        whooshOsc.type = 'sine';
        whooshOsc.frequency.setValueAtTime(95, now + 0.04);
        whooshOsc.frequency.exponentialRampToValueAtTime(480, now + 0.42);
        whooshGain.gain.setValueAtTime(0.001, now);
        whooshGain.gain.setValueAtTime(0.001, now + 0.04);
        whooshGain.gain.linearRampToValueAtTime(volume * 0.65, now + 0.28);
        whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
        whooshOsc.connect(whooshGain);
        whooshGain.connect(ctx.destination);
        whooshOsc.start(now + 0.04);
        whooshOsc.stop(now + 0.46);

        // Phase 3: Subtle secure-door unlock / terminal confirmation tones (0.32s - 0.85s)
        [369.99, 554.37].forEach((freq, idx) => {
          const chimeOsc = ctx.createOscillator();
          const chimeGain = ctx.createGain();
          chimeOsc.type = 'sine';
          chimeOsc.frequency.setValueAtTime(freq, now + 0.32);
          chimeGain.gain.setValueAtTime(0.001, now);
          chimeGain.gain.setValueAtTime(volume * (idx === 0 ? 0.35 : 0.25), now + 0.32);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.82);
          chimeOsc.connect(chimeGain);
          chimeGain.connect(ctx.destination);
          chimeOsc.start(now + 0.32);
          chimeOsc.stop(now + 0.82);
        });

        // Deep airlock lock-release sub
        const lockSub = ctx.createOscillator();
        const lockGain = ctx.createGain();
        lockSub.type = 'sine';
        lockSub.frequency.setValueAtTime(42, now + 0.32);
        lockGain.gain.setValueAtTime(volume * 0.45, now + 0.32);
        lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        lockSub.connect(lockGain);
        lockGain.connect(ctx.destination);
        lockSub.start(now + 0.32);
        lockSub.stop(now + 0.75);
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

  // =========================================================
  // CORE UI INTERACTION SOUND SYSTEM
  // =========================================================

  // 1. CLICK SOUND: Short, clean, digital, soft tap (50-150ms)
  public playClick(volume: number = 0.25) {
    if (this.muted) return;
    this.playSoundFile('/sounds/click.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(volume * 0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch {}
    });
  }

  // 2. HOVER / TOUCH SOUND: Very subtle digital tick (quieter than click, with 65ms cooldown)
  public playHover(volume: number = 0.12) {
    if (this.muted) return;
    const now = Date.now();
    if (now - this.lastHoverTime < 65) return;
    this.lastHoverTime = now;

    this.playSoundFile('/sounds/hover.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);

        gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.025);
      } catch {}
    });
  }

  // 3. SELECT SOUND: Distinct subtle selection confirmation tick
  public playSelect(volume: number = 0.28) {
    if (this.muted) return;
    this.playSoundFile('/sounds/select.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1760, now);
        gain1.gain.setValueAtTime(volume * 0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.035);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2349.32, now + 0.025);
        gain2.gain.setValueAtTime(volume * 0.6, now + 0.025);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.025);
        osc2.stop(now + 0.075);
      } catch {}
    });
  }

  // 4. ENTER ARENA SOUND: Futuristic activation / confirmation ("SYSTEM ACTIVATED")
  public playArenaEnter(volume: number = 0.40) {
    if (this.muted) return;
    this.playSoundFile('/sounds/arena-enter.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        // Impact punch
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(70, now);
        subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        subGain.gain.setValueAtTime(volume * 0.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.15);

        // Rising power sweep
        const sweepOsc = ctx.createOscillator();
        const sweepGain = ctx.createGain();
        sweepOsc.type = 'sine';
        sweepOsc.frequency.setValueAtTime(140, now);
        sweepOsc.frequency.exponentialRampToValueAtTime(540, now + 0.35);
        sweepGain.gain.setValueAtTime(volume * 0.5, now);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        sweepOsc.connect(sweepGain);
        sweepGain.connect(ctx.destination);
        sweepOsc.start(now);
        sweepOsc.stop(now + 0.38);

        // Chimes
        [440, 659.25].forEach((freq) => {
          const chimeOsc = ctx.createOscillator();
          const chimeGain = ctx.createGain();
          chimeOsc.type = 'sine';
          chimeOsc.frequency.setValueAtTime(freq, now + 0.18);
          chimeGain.gain.setValueAtTime(volume * 0.45, now + 0.18);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          chimeOsc.connect(chimeGain);
          chimeGain.connect(ctx.destination);
          chimeOsc.start(now + 0.18);
          chimeOsc.stop(now + 0.5);
        });
      } catch {}
    });
  }

  // 5. CHALLENGE UNLOCK SOUND: Mechanical / digital unlock
  public playChallengeUnlock(volume: number = 0.38) {
    if (this.muted) return;
    this.playSoundFile('/sounds/unlock.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [329.63, 493.88, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(volume * 0.35, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.38);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.38);
        });
      } catch {}
    });
  }

  // Backward compatible alias
  public playLevelUnlock(volume: number = 0.38) {
    this.playChallengeUnlock(volume);
  }

  // 6. CLUE DISCOVERY SOUND: Digital discovery / evidence recovery
  public playClueDiscover(volume: number = 0.35) {
    if (this.muted) return;
    this.playSoundFile('/sounds/discover.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [880, 1174.66, 1760].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(volume * 0.4, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.26);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.26);
        });
      } catch {}
    });
  }

  // 7. CORRECT ANSWER SOUND: Positive technical confirmation
  public playCorrectAnswer(volume: number = 0.40) {
    if (this.muted) return;
    this.playSoundFile('/sounds/correct.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        // Tone 1: C5 (523.25Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(volume * 0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.16);

        // Tone 2: G5 (783.99Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.08);
        gain2.gain.setValueAtTime(volume * 0.65, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.32);
      } catch {}
    });
  }

  // Backward compatible alias
  public playAccessGranted(volume: number = 0.40) {
    this.playCorrectAnswer(volume);
  }

  // 8. WRONG ANSWER SOUND: Subtle, non-annoying error buzz
  public playWrongAnswer(volume: number = 0.32) {
    if (this.muted) return;
    this.playSoundFile('/sounds/wrong.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.linearRampToValueAtTime(95, now + 0.22);
        gain.gain.setValueAtTime(volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } catch {}
    });
  }

  // Backward compatible alias
  public playAccessDenied(volume: number = 0.32) {
    this.playWrongAnswer(volume);
  }

  // 9. FINAL ESCAPE SUCCESS SOUND: Dramatic system restoration
  public playFinalEscape(volume: number = 0.45) {
    if (this.muted) return;
    this.playSoundFile('/sounds/success.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(volume * 0.35, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.65);
        });
      } catch {}
    });
  }

  // Backward compatible alias
  public playSystemRestoration(volume: number = 0.45) {
    this.playFinalEscape(volume);
  }

  // 10. ERROR SOUND: Subtle UI error notification
  public playError(volume: number = 0.28) {
    if (this.muted) return;
    this.playSoundFile('/sounds/error.mp3', volume, () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [220, 180].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(volume * 0.45, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.09);
        });
      } catch {}
    });
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

  // 11. KEYBOARD TYPING SOUND: Subtle, tactile, technical cyber keystroke (25-40ms)
  public playTyping(volume: number = 0.16) {
    if (this.muted) return;
    const now = Date.now();
    // Anti-spam debounce to prevent overlapping audio distortion while maintaining responsive typing
    if (now - this.lastTypingTime < 32) return;
    this.lastTypingTime = now;

    // Pitch micro-variation (±4%) for realistic mechanical feel
    const pitchOffset = (Math.random() - 0.5) * 0.08;

    try {
      if (this.typingPool.length === 0) {
        for (let i = 0; i < 4; i++) {
          const a = new Audio('/sounds/typing.mp3');
          a.preload = 'auto';
          this.typingPool.push(a);
        }
      }
      const audio = this.typingPool[this.typingPoolIndex];
      this.typingPoolIndex = (this.typingPoolIndex + 1) % this.typingPool.length;
      audio.currentTime = 0;
      audio.volume = Math.max(0.05, Math.min(0.35, volume));
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          this.synthesizeTyping(volume, pitchOffset);
        });
      }
    } catch {
      this.synthesizeTyping(volume, pitchOffset);
    }
  }

  private synthesizeTyping(volume: number, pitchOffset: number) {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(2400 * (1 + pitchOffset), t);
      clickOsc.frequency.exponentialRampToValueAtTime(700, t + 0.025);

      clickGain.gain.setValueAtTime(volume * 0.5, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(t);
      clickOsc.stop(t + 0.025);

      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(380 * (1 + pitchOffset), t);
      bodyOsc.frequency.exponentialRampToValueAtTime(160, t + 0.035);

      bodyGain.gain.setValueAtTime(volume * 0.35, t);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      bodyOsc.start(t);
      bodyOsc.stop(t + 0.035);
    } catch {}
  }

  // =========================================================
  // GLOBAL DELEGATED UI SOUND LISTENERS
  // =========================================================
  public initGlobalUiSounds() {
    if (typeof window === 'undefined' || this.uiListenersInitialized) return;
    this.uiListenersInitialized = true;

    // Track touch events to prevent duplicate touchstart + click sounds on mobile
    window.addEventListener(
      'touchstart',
      () => {
        this.lastTouchTime = Date.now();
      },
      { passive: true }
    );

    // Delegated Click Listener for interactive UI elements
    document.addEventListener(
      'click',
      (e) => {
        if (this.muted) return;
        const now = Date.now();

        // Guard against duplicate touch clicks
        if (now - this.lastTouchTime < 350 && now - this.lastClickTime < 120) {
          return;
        }

        const target = e.target as HTMLElement | null;
        if (!target) return;

        const interactive = target.closest(
          'button, a, [role="button"], input[type="submit"], input[type="button"], select, summary, .interactive-control, .role-btn, .tab-btn, .nav-link'
        ) as HTMLElement | null;

        if (!interactive) return;

        // If element is disabled, trigger subtle error sound
        if (interactive.hasAttribute('disabled') || interactive.getAttribute('aria-disabled') === 'true') {
          this.playError();
          return;
        }

        // Allow components with custom dedicated sounds to opt-out of generic click
        if (interactive.dataset.sound === 'none' || interactive.dataset.soundCustom === 'true') {
          return;
        }

        this.lastClickTime = now;
        this.playClick();
      },
      true
    );

    // CHANGE 2: Delegated Keyboard Typing Sound Listener for text/code/input fields
    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (this.muted) return;

        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Verify target is an active text/code/input entry area
        const isTextInput =
          (target instanceof HTMLInputElement &&
            ['text', 'password', 'search', 'email', 'number', 'tel', 'url', ''].includes(
              (target.type || 'text').toLowerCase()
            )) ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable ||
          Boolean(
            target.closest(
              'input[type="text"], input[type="password"], input[type="search"], input[type="email"], input[type="number"], input:not([type]), textarea, [contenteditable="true"], .monaco-editor, .cm-editor, .code-editor'
            )
          );

        // Do NOT add typing sound to non-input UI elements
        if (!isTextInput) return;

        // Skip modifier key combinations (e.g. Ctrl+C, Ctrl+V, Alt+Tab, Cmd+Z)
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const key = e.key;

        // Explicitly DO NOT play typing sound for navigation, modifier, and function keys:
        // - Arrow/navigation keys
        // - Tab
        // - Shift
        // - Ctrl
        // - Alt
        // - Caps Lock
        // - Escape
        // - Function keys
        const ignoredKeys = new Set([
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Home',
          'End',
          'PageUp',
          'PageDown',
          'Tab',
          'Shift',
          'Control',
          'Alt',
          'CapsLock',
          'Escape',
          'Meta',
          'OS',
          'ContextMenu',
          'Pause',
          'ScrollLock',
          'NumLock',
          'Insert',
        ]);

        if (ignoredKeys.has(key)) return;

        // Function keys (F1 - F24)
        if (/^F\d{1,2}$/.test(key)) return;

        // Play the typing sound for actual character/input keys:
        // - Single character keys (letters, numbers, symbols, spaces)
        // - Backspace
        // - Delete
        // - Enter
        const isInputKey =
          key.length === 1 || key === 'Backspace' || key === 'Delete' || key === 'Enter';

        if (!isInputKey) return;

        this.playTyping();
      },
      true
    );

    // CHANGE 1: Cursor movement produces NO sound.
    // The previous document.addEventListener('mouseover', ...) has been completely removed.
  }
}

export const soundService = new SoundService();

