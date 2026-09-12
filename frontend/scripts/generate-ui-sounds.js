import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../public/sounds');
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
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(subChunk2Size, 40);

  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    let val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

function saveSound(name, samples, sampleRate = 44100) {
  const buf = encodeWAV(samples, sampleRate);
  fs.writeFileSync(path.join(targetDir, `${name}.wav`), buf);
  fs.writeFileSync(path.join(targetDir, `${name}.mp3`), buf);
}

const sampleRate = 44100;

// 1. CLICK SOUND (75ms): Short, clean, digital, soft tap
{
  const duration = 0.075;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 60);
    const freq = 1400 * Math.exp(-t * 35);
    const tone = Math.sin(2 * Math.PI * freq * t) * env;
    const snap = (Math.random() * 2 - 1) * Math.exp(-t * 180) * 0.35;
    s[i] = (tone * 0.7 + snap) * 0.55;
  }
  saveSound('click', s);
}

// 2. HOVER SOUND (35ms): Extremely subtle digital tick (quieter than click)
{
  const duration = 0.035;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 120);
    const tone = Math.sin(2 * Math.PI * 2200 * t) * env;
    s[i] = tone * 0.18; // Very soft
  }
  saveSound('hover', s);
}

// 3. SELECT SOUND (90ms): Distinct high-tech dual confirmation tick
{
  const duration = 0.09;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    let tone = 0;
    // Tick 1 (0 to 40ms)
    if (t < 0.04) {
      tone += Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t * 90) * 0.45;
    }
    // Tick 2 (30ms to 90ms)
    if (t >= 0.03) {
      const t2 = t - 0.03;
      tone += Math.sin(2 * Math.PI * 2349.32 * t2) * Math.exp(-t2 * 80) * 0.55;
    }
    s[i] = tone * 0.6;
  }
  saveSound('select', s);
}

// 4. ENTER ARENA SOUND (520ms): Futuristic confirmation / activation ("SYSTEM ACTIVATED")
{
  const duration = 0.52;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    // Initial impact punch
    const sub = Math.sin(2 * Math.PI * (70 - 25 * t) * t) * Math.exp(-t * 12) * 0.6;
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 150) * 0.3;
    
    // Rising digital activation sweep
    let sweep = 0;
    if (t < 0.35) {
      const sweepFreq = 140 + 400 * Math.pow(t / 0.35, 1.8);
      sweep = Math.sin(2 * Math.PI * sweepFreq * t) * Math.sin((t / 0.35) * Math.PI) * 0.45;
    }

    // Access granted confirmation chime (440Hz -> 659.25Hz)
    let chime = 0;
    if (t >= 0.18) {
      const t2 = t - 0.18;
      const env = Math.exp(-t2 * 7);
      chime = (Math.sin(2 * Math.PI * 440 * t) * 0.4 + Math.sin(2 * Math.PI * 659.25 * t) * 0.35) * env;
    }

    s[i] = Math.tanh(sub + click + sweep + chime) * 0.78;
  }
  saveSound('arena-enter', s);
}

// 5. CHALLENGE UNLOCK SOUND (420ms): Mechanical/digital unlock
{
  const duration = 0.42;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    // Mechanical latch release
    const latch = (Math.random() * 2 - 1) * Math.exp(-t * 100) * 0.25;
    const sub = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t * 14) * 0.45;

    // Resonant unlock chime chords (330Hz, 495Hz, 660Hz)
    let chime = 0;
    if (t >= 0.06) {
      const t2 = t - 0.06;
      const env = Math.exp(-t2 * 6.5);
      chime = (Math.sin(2 * Math.PI * 329.63 * t2) * 0.35 +
               Math.sin(2 * Math.PI * 493.88 * t2) * 0.3 +
               Math.sin(2 * Math.PI * 659.25 * t2) * 0.25) * env;
    }
    s[i] = Math.tanh(latch + sub + chime) * 0.72;
  }
  saveSound('unlock', s);
}

// 6. CLUE DISCOVERY SOUND (320ms): Digital discovery / evidence recovery
{
  const duration = 0.32;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    let chime = 0;
    // Ascending triad (880Hz, 1174.66Hz, 1760Hz)
    if (t < 0.12) {
      chime += Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 15) * 0.35;
    }
    if (t >= 0.06 && t < 0.22) {
      const t2 = t - 0.06;
      chime += Math.sin(2 * Math.PI * 1174.66 * t2) * Math.exp(-t2 * 14) * 0.4;
    }
    if (t >= 0.12) {
      const t3 = t - 0.12;
      chime += Math.sin(2 * Math.PI * 1760 * t3) * Math.exp(-t3 * 10) * 0.45;
    }
    s[i] = Math.tanh(chime) * 0.65;
  }
  saveSound('discover', s);
}

// 7. CORRECT ANSWER SOUND (300ms): Satisfying positive technical confirmation
{
  const duration = 0.30;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    let tone = 0;
    // Ascending two-tone resolution (C5: 523.25Hz -> G5: 783.99Hz)
    if (t < 0.15) {
      tone += Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 10) * 0.45;
      tone += Math.sin(2 * Math.PI * 1046.50 * t) * Math.exp(-t * 15) * 0.15;
    }
    if (t >= 0.08) {
      const t2 = t - 0.08;
      tone += Math.sin(2 * Math.PI * 783.99 * t2) * Math.exp(-t2 * 8.5) * 0.65;
      tone += Math.sin(2 * Math.PI * 1567.98 * t2) * Math.exp(-t2 * 12) * 0.2;
    }
    s[i] = Math.tanh(tone) * 0.75;
  }
  saveSound('correct', s);
}

// 8. WRONG ANSWER SOUND (220ms): Subtle, clear, non-annoying error buzz
{
  const duration = 0.22;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 14);
    // Descending sawtooth buzz
    const freq = 145 - 50 * (t / duration);
    const raw = Math.sin(2 * Math.PI * freq * t) * 0.6 +
                Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
    s[i] = Math.tanh(raw * env) * 0.55;
  }
  saveSound('wrong', s);
}

// 9. FINAL ESCAPE SUCCESS SOUND (750ms): Dramatic system restoration & final victory
{
  const duration = 0.75;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  const chordFreqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C Major arpeggio
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    let chord = 0;
    chordFreqs.forEach((freq, idx) => {
      const delay = idx * 0.08;
      if (t >= delay) {
        const t2 = t - delay;
        chord += Math.sin(2 * Math.PI * freq * t2) * Math.exp(-t2 * 4.5) * 0.25;
      }
    });
    // Low sub rumble
    const sub = Math.sin(2 * Math.PI * 45 * t) * Math.exp(-t * 3.5) * 0.35;
    s[i] = Math.tanh(chord + sub) * 0.85;
  }
  saveSound('success', s);
}

// 10. ERROR SOUND (180ms): Subtle UI error notification
{
  const duration = 0.18;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    let tone = 0;
    if (t < 0.08) {
      tone += Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 22) * 0.5;
    }
    if (t >= 0.07) {
      const t2 = t - 0.07;
      tone += Math.sin(2 * Math.PI * 180 * t2) * Math.exp(-t2 * 20) * 0.5;
    }
    s[i] = tone * 0.55;
  }
  saveSound('error', s);
}

// 11. KEYBOARD TYPING SOUND (35ms): Subtle, tactile, technical cyber keystroke
{
  const duration = 0.035;
  const num = Math.floor(sampleRate * duration);
  const s = new Float32Array(num);
  for (let i = 0; i < num; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 120);
    // Subtle transient click + soft low body
    const clickFreq = 2600 * Math.exp(-t * 140);
    const click = Math.sin(2 * Math.PI * clickFreq * t) * 0.4;
    const body = Math.sin(2 * Math.PI * 420 * t) * 0.25;
    // Subtle noise puff for mechanical key travel
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 180) * 0.12;
    s[i] = (click + body + noise) * env * 0.35;
  }
  saveSound('typing', s);
}

console.log('Successfully generated UI sound assets in', targetDir);

