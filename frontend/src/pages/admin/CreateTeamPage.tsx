import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createTeam } from '../../services/teamService';
import { Users, ArrowLeft, ShieldAlert, Key, UserCheck, Sparkles, Terminal, Cpu } from 'lucide-react';

export const CreateTeamPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [teamName, setTeamName] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [customTeamCode, setCustomTeamCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }
    if (!player1Name.trim()) {
      setError('Player 1 display name is required');
      return;
    }
    if (!player2Name.trim()) {
      setError('Player 2 display name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createTeam(Number(eventId), {
        teamName: teamName.trim(),
        player1DisplayName: player1Name.trim(),
        player2DisplayName: player2Name.trim(),
        customTeamCode: customTeamCode.trim() || undefined,
      });

      navigate(`/admin/events/${eventId}/teams`);
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="">
      <Link
        to={`/admin/events/${eventId}/teams`}
        className="text-accent text-secondary flex items-center gap-2"
      >
        <ArrowLeft className="" />
        BACK TO TEAMS REGISTRY
      </Link>

      <div className="admin-panel">
        <div className="flex items-center">
          <div className="text-accent flex items-center justify-center">
            <Users className="" />
          </div>
          <div>
            <h1 className="text-primary">REGISTER TEAM IDENTITY</h1>
            <p className="text-secondary">Assign team credentials, Player 1 Operator, Player 2 Analyzer, and unique access code.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center">
            <ShieldAlert className="text-danger flex" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="">
          <div>
            <label className="block">
              TEAM DESIGNATION / NAME <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. CyberKnights"
              className="text-primary"
              required
            />
          </div>

          <div className="">
            <div className="text-accent flex items-center gap-2">
              <UserCheck className="" />
              <span>CO-OP NODE ALLOCATION (EXACTLY TWO PLAYERS)</span>
            </div>

            <div className="grid gap-4">
              <div className="admin-panel">
                <label className="flex items-center">
                  <Terminal className="" />
                  <span>PLAYER 01 (OPERATOR)</span> <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="e.g. Operator Zero"
                  className="text-primary"
                  required
                />
              </div>

              <div className="admin-panel">
                <label className="flex items-center">
                  <Cpu className="" />
                  <span>PLAYER 02 (ANALYZER)</span> <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="e.g. Analyzer Prime"
                  className="text-primary"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between block">
              <span className="flex items-center">
                <Key className="text-accent" />
                CUSTOM ACCESS TEAM CODE (OPTIONAL)
              </span>
              <span className="flex items-center">
                <Sparkles className="text-accent" />
                Auto-generated (e.g. TEAM-001) if blank
              </span>
            </label>
            <input
              type="text"
              value={customTeamCode}
              onChange={(e) => setCustomTeamCode(e.target.value.toUpperCase())}
              placeholder="e.g. TEAM-005"
              className=""
            />
          </div>

          <div className="flex items-center">
            <Link
              to={`/admin/events/${eventId}/teams`}
              className="admin-panel text-primary"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2"
            >
              <UserCheck className="" />
              <span>{submitting ? 'SAVING TEAM...' : 'AUTHORIZE & CREATE TEAM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamPage;

