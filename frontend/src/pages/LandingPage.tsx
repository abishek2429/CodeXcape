import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CinematicButton } from '../components/cinematic/CinematicButton';
import { soundService } from '../services/soundService';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    soundService.playClick();
    navigate('/player/login');
  };

  return (
    <div className="minimal-landing-container">
      {/* Subtle CRT raster & scanlines */}
      <div className="minimal-crt-overlay" aria-hidden="true" />

      {/* Atmospheric center glow */}
      <div className="minimal-ambient-glow" aria-hidden="true" />

      {/* Hero Content: Title + Single Primary Button */}
      <div className="minimal-landing-content animate-fade-in">
        <h1 className="minimal-landing-title">
          CODEXCAPE
        </h1>

        <div className="minimal-landing-action">
          <CinematicButton
            variant="primary"
            onClick={handleLoginClick}
            className="minimal-login-btn"
          >
            <span>GO TO PLAYER LOGIN</span>
          </CinematicButton>
        </div>
      </div>
    </div>
  );
};
