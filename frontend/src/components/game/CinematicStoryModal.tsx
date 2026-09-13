import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, FastForward, Radio, Terminal } from 'lucide-react';
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

  const lines = sequence?.lines || [];
  const currentLine: StoryDialogueLine | undefined = lines[currentLineIndex];
  const character: CharacterProfile = currentLine
    ? CHARACTERS[currentLine.characterId] || CHARACTERS.aria
    : CHARACTERS.aria;

  // Cleanup all audio, timers, and utterances
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

  // Audio wave pulse animation during speech
  useEffect(() => {
    if (!isSpeaking || isMuted) {
      setWaveHeights([4, 6, 4, 8, 6, 4, 6, 4]);
      return;
    }
    const waveInterval = window.setInterval(() => {
      setWaveHeights(
        Array.from({ length: 12 }, () => Math.floor(Math.random() * 16) + 4)
      );
    }, 120);
    return () => clearInterval(waveInterval);
  }, [isSpeaking, isMuted]);

  // Typewriter effect & narration for current line
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
        // Pause before next line
        const pauseTime = currentLine.pauseAfterMs || 1400;
        pauseTimerRef.current = window.setTimeout(() => {
          handleNextOrComplete();
        }, pauseTime);
      }
    ) || null;

    return () => {
      cleanupStory();
    };
  }, [isOpen, currentLineIndex, sequence?.storyKey]);

  // Keyboard navigation: Escape or Space to skip immediately, M to mute
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'm' || e.key === 'M') {
        const next = voiceNarratorService.toggleMute();
        setIsMuted(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSkip]);

  const toggleMute = () => {
    const next = voiceNarratorService.toggleMute();
    setIsMuted(next);
  };

  if (!isOpen || !sequence) return null;

  return (
    <div className="cinematic-story-overlay" role="dialog" aria-modal="true">
      <div className="cinematic-story-scanlines" />
      <div className="cinematic-story-vignette" />

      <div className="cinematic-story-container">
        {/* Header Telemetry */}
        <div className="cinematic-story-header">
          <div className="cinematic-story-header-status">
            <Radio size={14} className="animate-pulse" />
            <span>AUTHORITATIVE TELEMETRY // {sequence.title}</span>
          </div>
          <div className="cinematic-story-header-controls">
            <span>TIMER PAUSED (0s COMPETITIVE LOSS)</span>
            <button
              type="button"
              onClick={toggleMute}
              className="cinematic-mute-btn"
              title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isMuted ? 'MUTED' : 'VOICE ON'}</span>
            </button>
          </div>
        </div>

        {/* Center: Character Portrait + Credentials + Synchronized Dialogue */}
        <div className="cinematic-story-body">
          {/* Character Visual */}
          <div className="cinematic-character-frame">
            <img
              src={character.avatar}
              alt={character.name}
              className="cinematic-character-img"
            />
            <div className="cinematic-character-corners" />
          </div>

          {/* Subtitles & Speech */}
          <div className="cinematic-dialogue-content">
            <div className="cinematic-character-badge">
              <Terminal size={12} />
              <span>TRANSMISSION SIGNAL VERIFIED</span>
            </div>

            <div className="cinematic-character-name">
              {character.name}
              <span className="cinematic-character-title">{character.title}</span>
            </div>

            <div className="cinematic-speech-bubble">
              {displayedText}
              <span className="cinematic-speech-cursor" />
            </div>

            {/* Speaking Waveform */}
            <div className="cinematic-audio-waveform">
              {waveHeights.map((h, i) => (
                <div
                  key={i}
                  className="cinematic-wave-bar"
                  style={{
                    height: `${h}px`,
                    opacity: isSpeaking && !isMuted ? 0.9 : 0.25,
                    backgroundColor: character.id === 'node06' ? '#ff003c' : '#00f0ff',
                  }}
                />
              ))}
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '8px' }}>
                {isSpeaking ? (isMuted ? '[AUDIO MUTED — SUBTITLES ACTIVE]' : '[VOICE ACTIVE]') : '[STANDBY]'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="cinematic-story-footer">
          <div>
            <span>NARRATIVE SEQUENCE: {currentLineIndex + 1} / {lines.length}</span>
            <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
            <span>PRESS [ESC] OR [SPACE] TO SKIP</span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="cinematic-skip-button"
            title="Skip story immediately without competitive penalty"
          >
            <span>SKIP SEQUENCE</span>
            <FastForward size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
