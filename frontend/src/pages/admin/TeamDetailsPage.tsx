import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTeamById, updateTeam } from '../../services/teamService';
import { TeamDetail, TeamStatus } from '../../types/team';
import { ArrowLeft, Key, Users, User, ShieldAlert, RefreshCw, Save, Activity } from 'lucide-react';

export const TeamDetailsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for editing team & player names
  const [teamName, setTeamName] = useState('');
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [status, setStatus] = useState<TeamStatus>('REGISTERED');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadTeam = async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamById(Number(teamId));
      setTeam(data);
      setTeamName(data.teamName);
      setStatus(data.status);
      const p1 = data.players.find(p => p.playerNumber === 1);
      const p2 = data.players.find(p => p.playerNumber === 2);
      setP1Name(p1?.displayName || '');
      setP2Name(p2?.displayName || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await updateTeam(team.id, {
        teamName: teamName.trim(),
        status,
        player1DisplayName: p1Name.trim(),
        player2DisplayName: p2Name.trim(),
      });
      setTeam(updated);
      setSuccessMsg('Team details updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="font-mono text-sm">Loading team profile...</span>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-mono text-white mb-2">Team Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'The requested team could not be located.'}</p>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-mono text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        to={`/admin/events/${team.eventId}/teams`}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO TEAM LIST
      </Link>

      <div className="rounded-2xl bg-[#0e1322] border border-slate-800 p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold font-mono">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">{team.eventName}</span>
              <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
                {team.teamName}
                <span className="px-3 py-0.5 rounded-md bg-slate-900 border border-cyan-500/40 text-cyan-400 text-sm font-mono">
                  {team.teamCode}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-3 font-mono">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center gap-3 font-mono">
            <Activity className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold">
                TEAM NAME
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold">
                TEAM STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TeamStatus)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-sm font-bold focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="REGISTERED">REGISTERED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
              </select>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono text-slate-300 font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              ASSIGNED PLAYERS (2 SLOTS)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    PLAYER 1
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">SLOT #1</span>
                </div>
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    PLAYER 2
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">SLOT #2</span>
                </div>
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamDetailsPage;
