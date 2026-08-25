import React, { useState } from 'react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { getMockGameState } from '../../services/mockGameState';
import { GameHeader } from '../../components/game/GameHeader';
import { LevelProgress } from '../../components/game/LevelProgress';
import { ChallengePanel } from '../../components/game/ChallengePanel';
import { AnswerInput } from '../../components/game/AnswerInput';
import { PartnerStatus } from '../../components/game/PartnerStatus';
import { HintPanel } from '../../components/game/HintPanel';
import { FinalTerminal } from '../../components/game/FinalTerminal';
import { GameStatus } from '../../components/game/GameStatus';
import { GameLoadingState } from '../../components/game/GameLoadingState';
import { GameErrorState } from '../../components/game/GameErrorState';
import { Shield, User } from 'lucide-react';

export const PlayerGamePage: React.FC = () => {
  const { player, logout, authStatus } = usePlayerAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authStatus === 'INITIALIZING' || !player) {
    return <GameLoadingState message="Connecting to Player Game Session..." />;
  }

  if (authStatus !== 'AUTHENTICATED') {
    return <GameErrorState message="Player session expired or unauthenticated." />;
  }

  // Phase 5 Mock Game State Provider
  const gameState = getMockGameState(player.playerNumber);

  const handleAnswerSubmit = (_answer: string) => {
    setIsSubmitting(true);
    // Placeholder action for Phase 5 (No backend answer submission calls yet)
    setTimeout(() => {
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
      {/* Reusable Game Header */}
      <GameHeader
        player={player}
        currentLevel={gameState.currentLevel}
        totalLevels={gameState.totalLevels}
        connectionStatus={gameState.connectionStatus}
        onLogout={logout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Six-Level Progress Component */}
        <LevelProgress levels={gameState.levels} currentLevel={gameState.currentLevel} />

        {/* Desktop 2-Column Main Game Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Challenge & Answer Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Game Event/Status Banner */}
            <GameStatus message={gameState.gameStatusMessage} />

            {/* Primary Challenge Area */}
            <ChallengePanel challenge={gameState.challenge} playerNumber={player.playerNumber} />

            {/* Reusable Answer Entry Interface */}
            <AnswerInput
              answerType={gameState.challenge.answerType}
              placeholderText={gameState.challenge.placeholderText}
              options={gameState.challenge.options}
              onSubmit={handleAnswerSubmit}
              isSubmitting={isSubmitting}
            />

            {/* Locked Final Terminal Placeholder */}
            <FinalTerminal isUnlocked={gameState.isFinalTerminalUnlocked} />
          </div>

          {/* Sidebar Info Column (1/3 width) */}
          <div className="space-y-6">
            
            {/* Teammate Connection & Status Panel */}
            <PartnerStatus partner={gameState.partner} />

            {/* Progressive Passkey Clues Panel */}
            <HintPanel hints={gameState.hints} />

            {/* Team Identity Summary Card */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl font-mono">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 text-slate-300">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs tracking-widest uppercase font-bold text-slate-300">TEAM IDENTITY</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400">Team Code:</span>
                  <span className="text-cyan-400 font-bold tracking-widest text-sm">{player.teamCode}</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center justify-between ${
                  player.playerNumber === 1 ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Player 1 {player.playerNumber === 1 ? '(You)' : ''}</span>
                  </div>
                  <span className="text-slate-400">{player.playerNumber === 1 ? player.playerName : 'Teammate'}</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center justify-between ${
                  player.playerNumber === 2 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Player 2 {player.playerNumber === 2 ? '(You)' : ''}</span>
                  </div>
                  <span className="text-slate-400">{player.playerNumber === 2 ? player.playerName : 'Teammate'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
