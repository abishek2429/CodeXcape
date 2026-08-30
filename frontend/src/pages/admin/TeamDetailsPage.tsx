import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTeamById, updateTeam } from '../../services/teamService';
import { TeamDetail, TeamStatus } from '../../types/team';
import { ArrowLeft, Key, Users, ShieldAlert, Save, Activity, Terminal, Cpu } from 'lucide-react';

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
      setSuccessMsg('Team credentials and player slots successfully updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-secondary flex items-center justify-center">
        <div className="animate-spin"></div>
        <span className="">Loading team profile...</span>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="admin-panel">
        <ShieldAlert className="text-danger animate-pulse" />
        <h2 className="text-primary">TEAM NOT FOUND</h2>
        <p className="">{error || 'The requested team could not be located on the server.'}</p>
        <Link
          to="/admin/events"
          className="admin-panel text-primary flex items-center gap-2"
        >
          <ArrowLeft className="" />
          <span>RETURN TO EVENTS</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="">
      <Link
        to={`/admin/events/${team.eventId}/teams`}
        className="text-accent text-secondary flex items-center gap-2"
      >
        <ArrowLeft className="" />
        BACK TO TEAMS REGISTRY
      </Link>

      <div className="admin-panel">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="text-accent flex items-center justify-center">
              <Key className="" />
            </div>
            <div>
              <span className="text-accent">
                EVENT: {team.eventName}
              </span>
              <h1 className="text-primary flex items-center">
                {team.teamName}
                <span className="">
                  {team.teamCode}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center">
            <ShieldAlert className="text-danger flex" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center">
            <Activity className="text-success flex" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="">
          <div className="grid gap-4">
            <div>
              <label className="block">
                TEAM NAME
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="text-primary"
                required
              />
            </div>

            <div>
              <label className="block">
                CLEARANCE STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TeamStatus)}
                className=""
              >
                <option value="REGISTERED">REGISTERED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
              </select>
            </div>
          </div>

          <div className="">
            <h3 className="flex items-center gap-2">
              <Users className="text-accent" />
              ASSIGNED PLAYERS (2 CO-OP SLOTS)
            </h3>

            <div className="grid gap-4">
              <div className="admin-panel">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Terminal className="" />
                    PLAYER 01 (OPERATOR)
                  </span>
                  <span className="">SLOT #1</span>
                </div>
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="text-primary"
                  required
                />
              </div>

              <div className="admin-panel">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Cpu className="" />
                    PLAYER 02 (ANALYZER)
                  </span>
                  <span className="">SLOT #2</span>
                </div>
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="text-primary"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="" />
              <span>{saving ? 'SAVING...' : 'SAVE CHANGES'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamDetailsPage;

