import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTeamsForEvent, updateTeamStatus, deleteTeam, uploadTeamExcelPreview, confirmTeamImport } from '../../services/teamService';
import type { TeamImportPreview, TeamImportResult } from '../../services/teamService';
import { fetchEventById } from '../../services/eventService';
import { Team, TeamStatus } from '../../types/team';
import { Event } from '../../types/event';
import { Users, Plus, ArrowLeft, ShieldAlert, RefreshCw, Trash2, User, Key, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const TeamListPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Excel Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<TeamImportPreview | null>(null);
  const [importResult, setImportResult] = useState<TeamImportResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [evtData, teamData] = await Promise.all([
        fetchEventById(Number(eventId)),
        fetchTeamsForEvent(Number(eventId)),
      ]);
      setEvent(evtData);
      setTeams(teamData);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleStatusToggle = async (teamId: number, currentStatus: TeamStatus) => {
    const nextStatus: TeamStatus = currentStatus === 'ACTIVE' ? 'REGISTERED' : 'ACTIVE';
    try {
      const updated = await updateTeamStatus(teamId, nextStatus);
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: updated.status } : t));
    } catch (err: any) {
      alert(err.message || 'Failed to update team status');
    }
  };

  const handleDeleteTeam = async (teamId: number, teamCode: string) => {
    if (!window.confirm(`Are you sure you want to delete team ${teamCode}?`)) return;
    try {
      await deleteTeam(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete team');
    }
  };

  // ---- Excel Import Handlers ----

  const openImportModal = () => {
    setShowImportModal(true);
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
    setImportError(null);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
    setImportError(null);
    if (importResult && importResult.teamsCreated > 0) {
      loadData();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportPreview(null);
      setImportResult(null);
      setImportError(null);
    }
  };

  const handlePreview = async () => {
    if (!importFile || !eventId) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const preview = await uploadTeamExcelPreview(Number(eventId), importFile);
      setImportPreview(preview);
    } catch (err: any) {
      setImportError(err.message || 'Failed to validate Excel file');
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile || !eventId) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const result = await confirmTeamImport(Number(eventId), importFile);
      setImportResult(result);
      setImportPreview(null);
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Link
        to={eventId ? `/admin/events/${eventId}` : '/admin/events'}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO EVENT DETAILS
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">
            EVENT: {event?.name || `#${eventId}`}
          </span>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-3 mt-1">
            <Users className="w-7 h-7 text-cyan-400" />
            REGISTERED TEAMS ({teams.length})
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openImportModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-sm shadow-lg shadow-emerald-600/20 transition"
            id="import-excel-btn"
          >
            <FileSpreadsheet className="w-4 h-4" />
            IMPORT EXCEL
          </button>
          <Link
            to={`/admin/events/${eventId}/teams/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            CREATE TEAM
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-3 font-mono">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="font-mono text-sm">Loading team records...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200 font-mono">No Teams Created</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">Add teams manually or import from an Excel file.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={openImportModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-mono transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import from Excel
            </button>
            <Link
              to={`/admin/events/${eventId}/teams/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-sm font-mono transition"
            >
              <Plus className="w-4 h-4" />
              Create Team
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#0e1322] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold">TEAM CODE</th>
                  <th className="px-6 py-4 font-bold">TEAM NAME</th>
                  <th className="px-6 py-4 font-bold">PLAYER 1</th>
                  <th className="px-6 py-4 font-bold">PLAYER 2</th>
                  <th className="px-6 py-4 font-bold">STATUS</th>
                  <th className="px-6 py-4 font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {teams.map((tm) => (
                  <tr key={tm.id} className="hover:bg-slate-900/50 transition">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-400 font-bold">
                        <Key className="w-3.5 h-3.5" />
                        {tm.teamCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{tm.teamName}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-300">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        {tm.player1DisplayName || 'Player 1'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-300">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        {tm.player2DisplayName || 'Player 2'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(tm.id, tm.status)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                          tm.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 hover:bg-emerald-900/80'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {tm.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/teams/${tm.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteTeam(tm.id, tm.teamCode)}
                          className="p-1.5 rounded-lg bg-red-950/50 border border-red-800/40 text-red-400 hover:bg-red-900/60 transition"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Excel Import Modal ---- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={closeImportModal}>
          <div className="bg-[#0e1322] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                IMPORT TEAMS FROM EXCEL
              </h2>
              <button onClick={closeImportModal} className="text-slate-400 hover:text-white text-xl font-bold transition">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Step 1: File Upload */}
              {!importResult && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 font-mono">
                    Upload an Excel file (.xlsx) with columns: <span className="text-cyan-400">Team Name</span> | <span className="text-emerald-400">Player 1 Name</span> | <span className="text-emerald-400">Player 2 Name</span>
                  </p>
                  <p className="text-xs text-slate-500 font-mono">First row must be a header row. It will be skipped during import.</p>

                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="excel-file-input"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 font-mono text-sm transition"
                    >
                      <Upload className="w-4 h-4" />
                      {importFile ? importFile.name : 'Choose Excel File'}
                    </button>
                    {importFile && !importPreview && (
                      <button
                        onClick={handlePreview}
                        disabled={importLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm transition disabled:opacity-50"
                      >
                        {importLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        VALIDATE
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {importError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm font-mono flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {importError}
                </div>
              )}

              {/* Step 2: Preview */}
              {importPreview && !importResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xl font-bold text-white font-mono">{importPreview.totalRows}</div>
                      <div className="text-xs text-slate-400 font-mono">Total Rows</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50">
                      <div className="text-xl font-bold text-emerald-400 font-mono">{importPreview.validRows}</div>
                      <div className="text-xs text-slate-400 font-mono">Valid</div>
                    </div>
                    <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/50">
                      <div className="text-xl font-bold text-red-400 font-mono">{importPreview.invalidRows}</div>
                      <div className="text-xs text-slate-400 font-mono">Invalid</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/50">
                      <div className="text-xl font-bold text-amber-400 font-mono">{importPreview.duplicateRows}</div>
                      <div className="text-xs text-slate-400 font-mono">Duplicates</div>
                    </div>
                  </div>

                  {importPreview.warnings.map((w, i) => (
                    <div key={i} className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs font-mono flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {w}
                    </div>
                  ))}

                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-64 overflow-y-auto">
                    <table className="w-full text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Row</th>
                          <th className="px-3 py-2 text-left">Team Name</th>
                          <th className="px-3 py-2 text-left">Player 1</th>
                          <th className="px-3 py-2 text-left">Player 2</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {importPreview.rows.map((row, i) => (
                          <tr key={i} className={row.valid ? 'text-slate-300' : 'text-red-300 bg-red-950/20'}>
                            <td className="px-3 py-2">{row.rowNumber}</td>
                            <td className="px-3 py-2">{row.teamName || '—'}</td>
                            <td className="px-3 py-2">{row.player1Name || '—'}</td>
                            <td className="px-3 py-2">{row.player2Name || '—'}</td>
                            <td className="px-3 py-2">
                              {row.valid ? (
                                <span className="text-emerald-400">✓ Valid</span>
                              ) : (
                                <span className="text-red-400" title={row.validationErrors.join('; ')}>
                                  ✕ {row.validationErrors[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {importPreview.importReady && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button onClick={closeImportModal} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-sm transition">
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmImport}
                        disabled={importLoading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-sm shadow-lg transition disabled:opacity-50"
                      >
                        {importLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        CONFIRM IMPORT ({importPreview.validRows} TEAMS)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Result */}
              {importResult && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-emerald-300 font-mono">Import Complete</h3>
                    <p className="text-sm text-slate-300 font-mono mt-1">{importResult.summary}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xl font-bold text-emerald-400 font-mono">{importResult.teamsCreated}</div>
                      <div className="text-xs text-slate-400 font-mono">Teams Created</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xl font-bold text-cyan-400 font-mono">{importResult.playersCreated}</div>
                      <div className="text-xs text-slate-400 font-mono">Players Created</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-xl font-bold text-amber-400 font-mono">{importResult.duplicatesSkipped}</div>
                      <div className="text-xs text-slate-400 font-mono">Rows Skipped</div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={closeImportModal} className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm transition">
                      DONE
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamListPage;



