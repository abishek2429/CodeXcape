import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, FastForward, Radio, ChevronRight } from 'lucide-react';
import { CHARACTERS, StorySequence, StoryDialogueLine, CharacterProfile } from '../../config/storyConfig';
import { calculateLineDisplayDuration, getCharacterTypingDelay, DEFAULT_DIALOGUE_CONFIG } from '../../config/dialogueTimingConfig';
import { voiceNarratorService } from '../../services/voiceNarratorService';
import './CinematicStoryModal.css';

interface CinematicStoryModalProps {
  sequence: StorySequence | null;
  isOpen: boolean;
  onSkip: () => void;
  onComplete: () => void;
}

export const CinematicStoryModal: React.FC<CinematicStoryModalProps> = ({
  sequence,
  isOpen,
  onSkip,
  onComplete,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(voiceNarratorService.getIsMuted());
  const [waveHeights, setWaveHeights] = useState<number[]>([4, 8, 12, 6, 14, 10, 8, 4]);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  const typingTimeoutRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const cancelSpeechRef = useRef<(() => void) | null>(null);
  const isSkippingRef = useRef(false);
  const isAdvancingRef = useRef(false);
  const activeLineRef = useRef<{ storyKey: string; lineIndex: number } | null>(null);

  const lineStartTimeRef = useRef<number>(0);
  const isSpeechDoneRef = useRef(false);
  const isTypingDoneRef = useRef(false);
  const fullTextRef = useRef('');

  // Reset line index whenever sequence storyKey changes
  useEffect(() => {
    activeLineRef.current = null;
    setCurrentLineIndex(0);
  }, [sequence?.storyKey]);

  const lines = sequence?.lines || [];
  const currentLine: StoryDialogueLine | undefined = lines[currentLineIndex];
  const character: CharacterProfile = currentLine
    ? CHARACTERS[currentLine.characterId] || CHARACTERS.aria
    : CHARACTERS.aria;

  // Cleanup all audio, timers, and speech utterances
  const cleanupStory = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (cancelSpeechRef.current) {
      cancelSpeechRef.current();
      cancelSpeechRef.current = null;
    }
    voiceNarratorService.stop();
  }, []);

  const handleSkip = useCallback(() => {
    if (isSkippingRef.current) return;
    isSkippingRef.current = true;
    cleanupStory();
    onSkipRef.current();
  }, [cleanupStory]);

  const handleNextOrComplete = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    cleanupStory();
    const totalLines = sequence?.lines?.length || 0;
    if (currentLineIndex < totalLines - 1) {
      setCurrentLineIndex((prev) => prev + 1);
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 50);
    } else {
      onCompleteRef.current();
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 100);
    }
  }, [currentLineIndex, sequence?.lines?.length, cleanupStory]);

  const handleNextOrCompleteRef = useRef(handleNextOrComplete);
  handleNextOrCompleteRef.current = handleNextOrComplete;

  // Evaluates completion conditions and schedules automatic advance
  const checkAndScheduleAdvance = useCallback((text: string) => {
    if (!isSpeechDoneRef.current || !isTypingDoneRef.current) {
      return;
    }

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    // Standardized reading time allocation
    const requiredDisplayDuration = calculateLineDisplayDuration(text);
    const elapsedSinceStart = Date.now() - lineStartTimeRef.current;
    const remainingToRead = Math.max(0, requiredDisplayDuration - elapsedSinceStart);
    const totalDelay = remainingToRead + DEFAULT_DIALOGUE_CONFIG.postLinePauseMs;

    pauseTimerRef.current = window.setTimeout(() => {
      handleNextOrCompleteRef.current();
    }, totalDelay);
  }, []);

  // Click on dialogue box: reveal immediately if still typing, otherwise advance
  const handleDialogueClick = useCallback(() => {
    if (!currentLine) return;
    const fullText = fullTextRef.current;
    if (isTyping || !isTypingDoneRef.current || displayedText.length < fullText.length) {
      // Reveal full line immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setDisplayedText(fullText);
      isTypingDoneRef.current = true;
      setIsTyping(false);
      checkAndScheduleAdvance(fullText);
    } else {
      // Advance to next line immediately
      handleNextOrComplete();
    }
  }, [currentLine, isTyping, displayedText.length, checkAndScheduleAdvance, handleNextOrComplete]);

  // Audio wave pulse animation during speech
  useEffect(() => {
    if (!isSpeaking || isMuted) {
      setWaveHeights([4, 6, 4, 8, 6, 4, 6, 4]);
      return;
    }
    const waveInterval = window.setInterval(() => {
      setWaveHeights(
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 14) + 4)
      );
    }, 110);
    return () => clearInterval(waveInterval);
  }, [isSpeaking, isMuted]);

  // Typewriter effect & speech narration strictly scoped to line index and story key
  useEffect(() => {
    if (!isOpen || !sequence || !currentLine) {
      cleanupStory();
      return;
    }

    const storyKey = sequence.storyKey;
    // Guard against duplicate execution for the same line
    if (
      activeLineRef.current?.storyKey === storyKey &&
      activeLineRef.current?.lineIndex === currentLineIndex
    ) {
      return;
    }
    activeLineRef.current = { storyKey, lineIndex: currentLineIndex };

    cleanupStory();
    isSkippingRef.current = false;
    isAdvancingRef.current = false;
    setDisplayedText('');
    setIsTyping(true);
    setIsSpeaking(true);

    const fullText = currentLine.text;
    fullTextRef.current = fullText;
    lineStartTimeRef.current = Date.now();
    isSpeechDoneRef.current = false;
    isTypingDoneRef.current = false;

    let charIndex = 0;

    // Smooth character-by-character typewriter with punctuation pauses
    const typeNextChar = () => {
      if (charIndex < fullText.length) {
        charIndex += 1;
        setDisplayedText(fullText.slice(0, charIndex));

        const currentChar = fullText[charIndex - 1] || '';
        const delay = getCharacterTypingDelay(currentChar);
        typingTimeoutRef.current = window.setTimeout(typeNextChar, delay);
      } else {
        setDisplayedText(fullText);
        isTypingDoneRef.current = true;
        setIsTyping(false);
        typingTimeoutRef.current = null;
        checkAndScheduleAdvance(fullText);
      }
    };

    typeNextChar();

    // Voice narration
    cancelSpeechRef.current = voiceNarratorService.speakLine(
      character,
      fullText,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        isSpeechDoneRef.current = true;
        checkAndScheduleAdvance(fullText);
      }
    ) || null;

    return () => {
      cleanupStory();
    };
  }, [isOpen, sequence?.storyKey, currentLineIndex]);

  // Keyboard controls: Escape to skip, Space to advance, M to mute
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleDialogueClick();
      } else if (e.key === 'm' || e.key === 'M') {
        const next = voiceNarratorService.toggleMute();
        setIsMuted(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSkip, handleDialogueClick]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = voiceNarratorService.toggleMute();
    setIsMuted(next);
  };

  if (!isOpen || !sequence || !currentLine) return null;

  // Character theme styling
  const themeVars = {
    '--char-theme': character.themeColor || '#00f0ff',
    '--char-glow': character.glowColor || 'rgba(0, 240, 255, 0.6)',
    '--char-tag': character.tagColor || '#ff3344',
  } as React.CSSProperties;

  return (
    <div className="cinematic-holo-overlay" style={themeVars} role="dialog" aria-modal="true">
      <div className="cinematic-holo-scanlines" />
      <div className="cinematic-holo-vignette" />

      {/* Top Telemetry Beacon Bar */}
      <div className="cinematic-holo-topbar">
        <div className="cinematic-holo-beacon">
          <Radio size={14} className="animate-pulse" color="var(--char-theme)" />
          <span>INCOMING QUANTUM TRANSMISSION // {sequence.title}</span>
        </div>

        <div className="cinematic-holo-controls">
          <span className="cinematic-holo-timer-paused">TIMER PAUSED (0s LOSS)</span>
          <button
            type="button"
            onClick={toggleMute}
            className="cinematic-action-btn"
            title={isMuted ? 'Unmute voice narration (M)' : 'Mute voice narration (M)'}
          >
            {isMuted ? <VolumeX size={14} color="#ff3344" /> : <Volume2 size={14} color="#00f0ff" />}
            <span>{isMuted ? 'MUTED' : 'VOICE ON'}</span>
          </button>
        </div>
      </div>

      {/* Main Holographic Stage: Avatar on left, Dialogue box attached on bottom-right */}
      <div className="cinematic-holo-stage">
        {/* Floating Holographic Portrait */}
        <div className="cinematic-avatar-container">
          <img
            src={character.avatar}
            alt={character.name}
            className="cinematic-avatar-img"
          />
          <div className="cinematic-avatar-scanline-layer" />
        </div>

        {/* Connected Cyber HUD Dialogue Card */}
        <div
          className="cinematic-dialogue-card"
          onClick={handleDialogueClick}
          title="Click to advance transmission (Space)"
        >
          {/* Header with [CODENAME_ARTEMIS] tag */}
          <div className="cinematic-dialogue-header">
            <div className="cinematic-codename-tag">
              {character.codename || `[${character.name}]`}
            </div>
            <div className="cinematic-character-subinfo">
              {character.title}
            </div>
          </div>

          {/* Dialogue Text streaming */}
          <div className="cinematic-dialogue-body">
            {displayedText}
            <span className="cinematic-speech-cursor" />
          </div>

          {/* Holographic Diamond Accent in bottom right (as in Image 3) */}
          <div className="cinematic-dialogue-diamond" />

          {/* Dialogue Footer: Audio Waveform & Actions */}
          <div className="cinematic-dialogue-footer">
            <div className="cinematic-audio-waveform">
              {waveHeights.map((h, i) => (
                <div
                  key={i}
                  className="cinematic-wave-bar"
                  style={{
                    height: `${h}px`,
                    backgroundColor: character.themeColor || '#00f0ff',
                    opacity: isSpeaking && !isMuted ? 0.9 : 0.25,
                  }}
                />
              ))}
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginLeft: '8px' }}>
                {isSpeaking
                  ? isMuted
                    ? '[AUDIO MUTED — SUBTITLES ACTIVE]'
                    : '[TRANSMITTING VOICE]'
                  : '[AWAITING INPUT]'}
              </span>
            </div>

            <div className="cinematic-holo-controls">
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
                {currentLineIndex + 1} / {lines.length}
              </span>

              <button
                type="button"
                disabled={isTyping}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isTyping) {
                    handleNextOrComplete();
                  }
                }}
                className={`cinematic-action-btn ${isTyping ? 'disabled-typing' : ''}`}
                style={isTyping ? { opacity: 0.45, cursor: 'not-allowed', filter: 'grayscale(0.6)' } : undefined}
                title={isTyping ? 'Transmission in progress... (Click dialogue to reveal)' : currentLineIndex < lines.length - 1 ? 'Next Line (Space)' : 'Complete Transmission'}
              >
                <span>{currentLineIndex < lines.length - 1 ? 'NEXT' : 'CONTINUE'}</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip();
                }}
                className="cinematic-action-btn cinematic-skip-btn"
                title="Skip entire sequence (Esc)"
              >
                <span>SKIP</span>
                <FastForward size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
