import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthStatus, PlayerInfo, PlayerLoginRequest } from '../types/player';
import { getCurrentPlayer, loginPlayer, logoutPlayer } from '../services/playerAuthService';

interface PlayerAuthContextType {
  player: PlayerInfo | null;
  authStatus: AuthStatus;
  login: (payload: PlayerLoginRequest) => Promise<PlayerInfo>;
  logout: () => Promise<void>;
  refreshPlayer: () => Promise<void>;
}

const PlayerAuthContext = createContext<PlayerAuthContextType | undefined>(undefined);

export const PlayerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('INITIALIZING');

  const refreshPlayer = useCallback(async () => {
    const playerInfo = await getCurrentPlayer();
    if (playerInfo) {
      setPlayer(playerInfo);
      setAuthStatus('AUTHENTICATED');
    } else {
      setPlayer(null);
      setAuthStatus('NOT_AUTHENTICATED');
    }
  }, []);

  useEffect(() => {
    refreshPlayer();
  }, [refreshPlayer]);

  const handleLogin = async (payload: PlayerLoginRequest): Promise<PlayerInfo> => {
    const playerInfo = await loginPlayer(payload);
    setPlayer(playerInfo);
    setAuthStatus('AUTHENTICATED');
    return playerInfo;
  };

  const handleLogout = async () => {
    await logoutPlayer();
    setPlayer(null);
    setAuthStatus('LOGGED_OUT');
  };

  return (
    <PlayerAuthContext.Provider
      value={{
        player,
        authStatus,
        login: handleLogin,
        logout: handleLogout,
        refreshPlayer,
      }}
    >
      {children}
    </PlayerAuthContext.Provider>
  );
};

export const usePlayerAuth = (): PlayerAuthContextType => {
  const context = useContext(PlayerAuthContext);
  if (!context) {
    throw new Error('usePlayerAuth must be used within a PlayerAuthProvider');
  }
  return context;
};
