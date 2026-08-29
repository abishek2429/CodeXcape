import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, Code, Terminal, Zap, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-10">
      <div className="text-center space-y-8 w-full">
        {/* Main Banner */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Welcome to the Arena</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-cyan-500 tracking-tight font-mono drop-shadow-sm">
            CodeXcape
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 font-mono font-medium max-w-2xl mx-auto">
            The Ultimate College Technical Event
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-8 pb-12 flex justify-center">
          <Link
            to="/player/login"
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-mono font-bold text-lg transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:-translate-y-1"
          >
            <span>ENTER SESSION</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-slate-950 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
        </div>

        {/* Rules and Regulations */}
        <div className="mt-8 text-left glass-card p-8 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white font-mono mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            Rules & Regulations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Users className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold mb-1">Two-Player Co-op</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Teams must consist of exactly two players working together to solve technical challenges. Communication is key to escaping.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Code className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold mb-1">No External Tools</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Use of external IDEs, AI assistants, or unapproved internet resources is strictly prohibited during the event.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <Terminal className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold mb-1">Time Limits</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Each room has a strict time limit. Failure to solve the puzzle within the allocated time will result in point deductions.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold mb-1">Fair Play</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Any attempt to exploit the server architecture or tamper with other teams' progress will lead to immediate disqualification.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
