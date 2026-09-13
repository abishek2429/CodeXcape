import { CharacterProfile } from '../config/storyConfig';

class VoiceNarratorService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isMuted: boolean = false;
  private audioCtx: AudioContext | null = null;
  private droneGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('codexcape_voice_muted') === 'true';
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('codexcape_voice_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  }

  public setMuted(val: boolean) {
    this.isMuted = val;
    localStorage.setItem('codexcape_voice_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stop();
    }
  }

  public isSpeaking(): boolean {
    return this.currentUtterance !== null;
  }

  public speakLine(
    character: CharacterProfile,
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    this.stop();

    if (this.isMuted || !this.synth) {
      // Simulate narration timing if audio is muted or unavailable
      if (onStart) onStart();
      const words = text.split(/\s+/).length;
      const simulatedDurationMs = Math.max(1800, words * 280);
      const timer = window.setTimeout(() => {
        if (onEnd) onEnd();
      }, simulatedDurationMs);
      return () => clearTimeout(timer);
    }

    try {
      this.startSubtleDrone();

      // Clean text for speech (strip bracketed notes and symbols)
      const cleanText = text
        .replace(/\[.*?\]/g, '')
        .replace(/\/\//g, '')
        .replace(/---/g, '')
        .replace(/--/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;

      utterance.pitch = character.voice.pitch;
      utterance.rate = character.voice.rate;

      // Select voice based on gender and english locale
      const voice = this.selectVoice(character);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.stopSubtleDrone();
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.stopSubtleDrone();
        this.currentUtterance = null;
        // Fallback on error
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (err) {
      this.stopSubtleDrone();
      if (onEnd) onEnd();
    }
  }

  private selectVoice(character: CharacterProfile): SpeechSynthesisVoice | null {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }

    const englishVoices = this.voices.filter((v) => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : this.voices;

    const isFemale = character.voice.preferredGender === 'female';

    // Prioritize natural / neural voices
    const matched = pool.find((v) => {
      const name = v.name.toLowerCase();
      if (isFemale) {
        return (
          name.includes('zira') ||
          name.includes('jenny') ||
          name.includes('aria') ||
          name.includes('female') ||
          name.includes('samantha')
        );
      } else {
        return (
          name.includes('david') ||
          name.includes('guy') ||
          name.includes('mark') ||
          name.includes('george') ||
          name.includes('male')
        );
      }
    });

    return matched || pool[0] || null;
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
    this.stopSubtleDrone();
  }

  private startSubtleDrone() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.stopSubtleDrone();

      this.droneOsc = this.audioCtx.createOscillator();
      this.droneGain = this.audioCtx.createGain();

      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.setValueAtTime(55, this.audioCtx.currentTime); // 55Hz deep subtle hum

      this.droneGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      this.droneGain.gain.exponentialRampToValueAtTime(0.025, this.audioCtx.currentTime + 0.5);

      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.audioCtx.destination);
      this.droneOsc.start();
    } catch {}
  }

  private stopSubtleDrone() {
    try {
      if (this.droneOsc && this.audioCtx && this.droneGain) {
        this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.3);
        const osc = this.droneOsc;
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        }, 350);
        this.droneOsc = null;
      }
    } catch {}
  }
}

export const voiceNarratorService = new VoiceNarratorService();
