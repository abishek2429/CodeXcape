import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, FastForward, Radio, ChevronRight } from 'lucide-react';
import { CHARACTERS, StorySequence, StoryDialogueLine, CharacterProfile } from '../../config/storyConfig';
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(voiceNarratorService.getIsMuted());
  const [waveHeights, setWaveHeights] = useState<number[]>([4, 8, 12, 6, 14, 10, 8, 4]);

  const typingTimerRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const cancelSpeechRef = useRef<(() => void) | null>(null);
  const isSkippingRef = useRef(false);

  // Reset line index whenever sequence changes
  useEffect(() => {
    setCurrentLineIndex(0);
  }, [sequence?.storyKey]);

  const lines = sequence?.lines || [];
  const currentLine: StoryDialogueLine | undefined = lines[currentLineIndex];
  const character: CharacterProfile = currentLine
    ? CHARACTERS[currentLine.characterId] || CHARACTERS.aria
    : CHARACTERS.aria;

  // Cleanup all audio, timers, and speech utterances
  const cleanupStory = useCallback(() => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
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
    onSkip();
  }, [cleanupStory, onSkip]);

  const handleNextOrComplete = useCallback(() => {
    cleanupStory();
    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentLineIndex, lines.length, cleanupStory, onComplete]);

  // Click on dialogue box: reveal immediately if still typing, otherwise advance
  const handleDialogueClick = () => {
    if (!currentLine) return;
    if (displayedText.length < currentLine.text.length) {
      // Reveal full line immediately
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      setDisplayedText(currentLine.text);
    } else {
      // Advance to next line
      handleNextOrComplete();
    }
  };

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

  // Typewriter effect & speech narration for current line
  useEffect(() => {
    if (!isOpen || !currentLine) {
      cleanupStory();
      return;
    }

    isSkippingRef.current = false;
    setDisplayedText('');
    setIsSpeaking(true);

    const fullText = currentLine.text;
    let charIndex = 0;

    // Fast, crisp typewriter reveal
    typingTimerRef.current = window.setInterval(() => {
      charIndex += 2;
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex));
      } else {
        setDisplayedText(fullText);
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      }
    }, 28);

    // Voice narration
    cancelSpeechRef.current = voiceNarratorService.speakLine(
      character,
      fullText,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setDisplayedText(fullText);
        // Automatic advance after speech finishes with configurable pause
        const pauseTime = currentLine.pauseAfterMs || 1500;
        pauseTimerRef.current = window.setTimeout(() => {
          handleNextOrComplete();
        }, pauseTime);
      }
    ) || null;

    return () => {
      cleanupStory();
    };
  }, [isOpen, currentLineIndex, sequence?.storyKey]);

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
  }, [isOpen, handleSkip, displayedText, currentLine]);

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
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextOrComplete();
                }}
                className="cinematic-action-btn"
                title="Next Line (Space)"
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
