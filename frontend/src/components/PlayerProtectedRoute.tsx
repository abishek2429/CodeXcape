import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayerAuth } from '../context/PlayerAuthContext';

interface Props {
  children: React.ReactNode;
}

export const PlayerProtectedRoute: React.FC<Props> = ({ children }) => {
  const { authStatus } = usePlayerAuth();

  if (authStatus === 'INITIALIZING') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-cyan-400">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm tracking-wider uppercase">Validating Session...</p>
        </div>
      </div>
    );
  }

  if (authStatus !== 'AUTHENTICATED') {
    return <Navigate to="/player/login" replace />;
  }

  return <>{children}</>;
};
