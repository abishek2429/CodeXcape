import React from 'react';
import { Bell } from 'lucide-react';

interface GameStatusProps {
  message: string | null;
}

export const GameStatus: React.FC<GameStatusProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 font-mono text-xs flex items-center gap-3 shadow-lg animate-fade-in">
      <div className="p-2 rounded-lg bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 shrink-0">
        <Bell className="w-4 h-4 animate-bounce" />
      </div>

      <div className="flex-1">
        <span className="font-bold text-cyan-300 uppercase tracking-wider block mb-0.5">Game Notification</span>
        <p className="text-slate-300 font-sans text-sm">{message}</p>
      </div>
    </div>
  );
};
