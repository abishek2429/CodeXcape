/**
 * Centralized configuration and calculation utilities for story dialogue timing.
 * Enforces a standardized, comfortable, readable delivery pace across all narrative sequences.
 */

export interface DialogueTimingConfig {
  /** Base typing speed in milliseconds per normal alphanumeric character */
  charDelayMs: number;
  /** Pause in milliseconds for space characters */
  spaceDelayMs: number;
  /** Natural breathing pause (ms) at commas and semicolons */
  commaPauseMs: number;
  /** Natural pause (ms) at terminal punctuation (. ! ? : -) */
  periodPauseMs: number;
  /** Minimum duration (ms) that ANY line must remain visible on screen regardless of length */
  minimumDisplayTimeMs: number;
  /** Proportional reading time in ms per character (scaled to comfortable reading rate) */
  readableCharTimeMs: number;
  /** Post-line rest period (ms) before auto-advancing to next dialogue line */
  postLinePauseMs: number;
  /** Maximum display duration cap (ms) preventing excessively long lockups */
  maximumDisplayTimeMs: number;
}

export const DEFAULT_DIALOGUE_CONFIG: DialogueTimingConfig = {
  charDelayMs: 24,            // Fast, smooth character reveal
  spaceDelayMs: 20,           // Light pause between words
  commaPauseMs: 130,          // Natural breath at clause boundaries
  periodPauseMs: 260,         // Clean pause at end of sentences
  minimumDisplayTimeMs: 3200, // At least 3.2 seconds for short punchy lines
  readableCharTimeMs: 38,     // ~38ms per char gives proportional reading room
  postLinePauseMs: 850,       // 850ms breathing room after line is fully read
  maximumDisplayTimeMs: 9500, // Capped at 9.5s max
};

/**
 * Calculates the total readable display duration for a dialogue line.
 * Formula: displayDuration = clamp(minDisplayTime + (charCount * readableCharTime), minDisplayTime, maxDisplayTime)
 */
export function calculateLineDisplayDuration(
  text: string,
  config: DialogueTimingConfig = DEFAULT_DIALOGUE_CONFIG
): number {
  if (!text) return config.minimumDisplayTimeMs;
  const clean = text.trim();
  const calculated = config.minimumDisplayTimeMs + (clean.length * config.readableCharTimeMs);
  return Math.min(Math.max(calculated, config.minimumDisplayTimeMs), config.maximumDisplayTimeMs);
}

/**
 * Returns the delay in milliseconds to wait after rendering a character in typewriter mode.
 */
export function getCharacterTypingDelay(
  char: string,
  config: DialogueTimingConfig = DEFAULT_DIALOGUE_CONFIG
): number {
  if (char === ',' || char === ';') {
    return config.commaPauseMs;
  }
  if (char === '.' || char === '!' || char === '?' || char === ':') {
    return config.periodPauseMs;
  }
  if (char === ' ') {
    return config.spaceDelayMs;
  }
  return config.charDelayMs;
}
