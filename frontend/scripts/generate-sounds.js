import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../public/assets/sounds');
fs.mkdirSync(targetDir, { recursive: true });

function encodeWAV(samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const subChunk2Size = numSamples * 2;
  const chunkSize = 36 + subChunk2Size;
  const buffer = Buffer.alloc(44 + subChunk2Size);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // mono channel
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * channels * bytesPerSample)
  buffer.writeUInt16LE(2, 32);  // block align (channels * bytesPerSample)
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(subChunk2Size, 40);

  for (let i = 0; i < numSamples; i++) {
    // Clamp to -1.0 to 1.0
    let s = Math.max(-1, Math.min(1, samples[i]));
    let val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

const sampleRate = 44100;

// 1. KNOCK IMPACT SOUND (~0.75s)
// Heavy glass / metallic door knock in a cyberpunk underground facility:
// - Deep low thud (65Hz -> 40Hz)
// - Initial sharp mechanical click/transient
// - High-frequency glass/metallic resonant tail (1840Hz & 2460Hz)
{
  const duration = 0.75;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Low deep thud component
    const thudEnv = Math.exp(-t * 11);
    const thudFreq = 65 - 25 * (1 - Math.exp(-t * 18));
    const thud = Math.sin(2 * Math.PI * thudFreq * t) * thudEnv * 0.75;

    // Sub thump (punch around 48Hz)
    const subEnv = Math.exp(-t * 9);
    const sub = Math.sin(2 * Math.PI * 48 * t) * subEnv * 0.5;

    // Sharp initial transient impact (metallic click in first 15ms)
    let click = 0;
    if (t < 0.018) {
      const clickEnv = Math.exp(-t * 220);
      click = (Math.random() * 2 - 1) * clickEnv * 0.85;
      click += Math.sin(2 * Math.PI * 850 * t) * clickEnv * 0.5;
    }

    // High metallic/glass resonance ring
    const ringEnv = Math.exp(-t * 6.5);
    const ring1 = Math.sin(2 * Math.PI * 1840 * t) * ringEnv * 0.18;
    const ring2 = Math.sin(2 * Math.PI * 2460 * t) * ringEnv * 0.12;
    const ring3 = Math.sin(2 * Math.PI * 3680 * t) * ringEnv * 0.07;

    // Low rumble resonance
    const lowRing = Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t * 7) * 0.25;

    // Combine with soft distortion/saturation
    let raw = thud + sub + click + ring1 + ring2 + ring3 + lowRing;
    samples[i] = Math.tanh(raw * 1.25) * 0.85;
  }

  const buf = encodeWAV(samples, sampleRate);
  fs.writeFileSync(path.join(targetDir, 'knock-impact.wav'), buf);
  fs.writeFileSync(path.join(targetDir, 'knock-impact.mp3'), buf);
}

// 2. X APPROACH WHOOSH (~0.95s)
// Rising digital whoosh as X surges toward screen:
// - Rising pitch sweep (100Hz -> 680Hz)
// - Filtered white noise air rush peaking at 0.75s
{
  const duration = 0.95;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  let noiseFilter = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / duration;

    // Envelope rises smoothly then cuts as X reaches camera
    let env = Math.sin(progress * Math.PI * 0.85);
    if (progress > 0.8) {
      env *= Math.exp(-(progress - 0.8) * 16);
    }

    // Rising sweep
    const currentFreq = 110 + 550 * Math.pow(progress, 1.8);
    const sweep = Math.sin(2 * Math.PI * currentFreq * t) * 0.35;
    const subSweep = Math.sin(2 * Math.PI * (currentFreq * 0.5) * t) * 0.25;

    // Filtered rushing air noise
    const white = Math.random() * 2 - 1;
    noiseFilter = noiseFilter + 0.12 * (white - noiseFilter);
    const air = noiseFilter * 0.4;

    let raw = (sweep + subSweep + air) * env;
    samples[i] = Math.tanh(raw * 1.1) * 0.7;
  }

  const buf = encodeWAV(samples, sampleRate);
  fs.writeFileSync(path.join(targetDir, 'x-approach-whoosh.wav'), buf);
  fs.writeFileSync(path.join(targetDir, 'x-approach-whoosh.mp3'), buf);
}

// 3. GLITCH TRANSITION (~0.45s)
// Short low glitch / fade-out sound when X vanishes and ready screen opens:
// - Sub drop (80Hz -> 35Hz)
// - Digital stutter clicks & low dissipate
{
  const duration = 0.45;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 8);
    const freq = 80 - 45 * Math.pow(t / duration, 0.7);
    const sub = Math.sin(2 * Math.PI * freq * t) * env * 0.55;

    // Digital clicks / micro-stutter in first 120ms
    let click = 0;
    if (t < 0.12) {
      const step = Math.floor(t * 120);
      if (step % 2 === 0) {
        click = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.35;
      }
    }

    let raw = sub + click;
    samples[i] = Math.tanh(raw) * 0.75;
  }

  const buf = encodeWAV(samples, sampleRate);
  fs.writeFileSync(path.join(targetDir, 'glitch-transition.wav'), buf);
  fs.writeFileSync(path.join(targetDir, 'glitch-transition.mp3'), buf);
}

// 4. FIND THE WAY OUT UNLOCK SOUND (~0.85s)
// Deep cyber-security terminal unlock sound for "FIND THE WAY OUT →" button:
// - Start with short low electronic impact / click (0-50ms)
// - Follow with rising crimson-style digital whoosh (40-450ms)
// - End with subtle secure-door unlock / terminal-access confirmation tone (350-850ms)
// - Dark, mysterious, premium, hidden-network feeling
{
  const duration = 0.85;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  let airFilter = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // --- Phase 1: Electronic impact / click (0 - 0.06s) ---
    let click = 0;
    let punch = 0;
    if (t < 0.06) {
      const clickEnv = Math.exp(-t * 220);
      click = (Math.random() * 2 - 1) * clickEnv * 0.45;
      click += Math.sin(2 * Math.PI * 1350 * t) * clickEnv * 0.6;

      const punchEnv = Math.exp(-t * 28);
      punch = Math.sin(2 * Math.PI * (62 - 20 * (t / 0.06)) * t) * punchEnv * 0.75;
    }

    // --- Phase 2: Rising crimson digital whoosh (0.04s - 0.45s) ---
    let whoosh = 0;
    if (t >= 0.03 && t < 0.50) {
      const whooshT = (t - 0.03) / 0.47;
      const whooshEnv = Math.sin(whooshT * Math.PI);

      // Rising harmonic sweep (95Hz -> 480Hz)
      const whooshFreq = 95 + 385 * Math.pow(whooshT, 1.7);
      const sweep = Math.sin(2 * Math.PI * whooshFreq * t) * 0.4;
      const sweepSub = Math.sin(2 * Math.PI * (whooshFreq * 0.5) * t) * 0.25;

      // Filtered rushing air
      const white = Math.random() * 2 - 1;
      const filterCoeff = 0.08 + 0.15 * whooshT;
      airFilter += filterCoeff * (white - airFilter);
      const air = airFilter * 0.35;

      whoosh = (sweep + sweepSub + air) * whooshEnv;
    }

    // --- Phase 3: Secure door unlock & terminal confirmation tone (0.32s - 0.85s) ---
    let unlockTone = 0;
    if (t >= 0.30) {
      const unlockT = t - 0.30;
      const toneEnv = Math.exp(-unlockT * 5.8);

      // Cyber lock mechanical release sub (42Hz)
      const subLock = Math.sin(2 * Math.PI * 42 * t) * Math.exp(-unlockT * 7.5) * 0.5;

      // Dark terminal access confirmation tones (F#4 ~370Hz & C#5 ~554Hz - mysterious dark fifth)
      const chime1 = Math.sin(2 * Math.PI * 369.99 * t) * toneEnv * 0.32;
      const chime2 = Math.sin(2 * Math.PI * 554.37 * t) * toneEnv * 0.22;
      // Soft metallic harmonic overtone
      const chime3 = Math.sin(2 * Math.PI * 1108.74 * t) * Math.exp(-unlockT * 9.0) * 0.09;

      unlockTone = subLock + chime1 + chime2 + chime3;
    }

    // Combine with soft tape saturation
    const raw = (click + punch + whoosh + unlockTone);
    samples[i] = Math.tanh(raw * 1.15) * 0.82;
  }

  const buf = encodeWAV(samples, sampleRate);
  fs.writeFileSync(path.join(targetDir, 'find-way-out-unlock.wav'), buf);
  fs.writeFileSync(path.join(targetDir, 'find-way-out-unlock.mp3'), buf);
}

console.log('Successfully generated audio assets in', targetDir);
