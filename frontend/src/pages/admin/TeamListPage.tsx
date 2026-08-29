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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <Link
        to={eventId ? `/admin/events/${eventId}` : '/admin/events'}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO EVENT DETAILS
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 uppercase tracking-wider">
            ARENA EVENT: {event?.name || `#${eventId}`}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading flex items-center gap-3 mt-1.5">
            <Users className="w-8 h-8 text-cyan-400" />
            REGISTERED TEAMS ({teams.length})
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer shadow-lg"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={openImportModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition cursor-pointer"
            id="import-excel-btn"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>BULK IMPORT EXCEL</span>
          </button>
          <Link
            to={`/admin/events/${eventId}/teams/new`}
            className="cyber-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE TEAM</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 font-mono">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-xs">Loading team records & authentication codes...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="py-20 text-center rounded-3xl cyber-panel border border-slate-800 p-8">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200 font-heading">No Teams Registered Yet</h3>
          <p className="text-xs text-slate-400 font-mono mt-1 mb-6">Add teams individually or bulk-import a full roster using Excel (.xlsx).</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={openImportModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono transition shadow-lg"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import from Excel</span>
            </button>
            <Link
              to={`/admin/events/${eventId}/teams/new`}
              className="cyber-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-950 text-xs font-mono font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Single Team</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="cyber-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">TEAM CODE</th>
                  <th className="px-6 py-4">TEAM NAME</th>
                  <th className="px-6 py-4">PLAYER 1 NODE</th>
                  <th className="px-6 py-4">PLAYER 2 NODE</th>
                  <th className="px-6 py-4">CLEARANCE STATUS</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {teams.map((tm) => (
                  <tr key={tm.id} className="hover:bg-slate-900/50 transition">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs shadow-inner">
                        <Key className="w-3.5 h-3.5 text-cyan-400" />
                        {tm.teamCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white font-heading text-sm">{tm.teamName}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-200">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        {tm.player1DisplayName || 'Player 1'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-200">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        {tm.player2DisplayName || 'Player 2'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(tm.id, tm.status)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          tm.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/80'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {tm.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/teams/${tm.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteTeam(tm.id, tm.teamCode)}
                          className="p-1.5 rounded-lg bg-rose-950/50 border border-rose-800/40 text-rose-400 hover:bg-rose-900/60 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={closeImportModal}>
          <div className="cyber-panel border border-slate-700 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 sm:px-8 py-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading flex items-center gap-2.5 uppercase">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                BULK IMPORT TEAMS VIA EXCEL (.XLSX)
              </h2>
              <button onClick={closeImportModal} className="text-slate-400 hover:text-white text-lg font-bold transition cursor-pointer">✕</button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 font-mono">
              {/* Step 1: File Upload */}
              {!importResult && (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    <p className="font-bold text-white uppercase mb-1">Required Columns in First Sheet:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">Column A: Team Name</span>
                      <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">Column B: Player 1 Name</span>
                      <span className="px-2.5 py-1 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">Column C: Player 2 Name</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2.5 italic">Header row is automatically detected and skipped.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
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
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 font-mono text-xs font-bold transition cursor-pointer shadow-inner"
                    >
                      <Upload className="w-4 h-4 text-cyan-400" />
                      {importFile ? importFile.name : 'Choose Excel File (.xlsx)'}
                    </button>
                    {importFile && !importPreview && (
                      <button
                        onClick={handlePreview}
                        disabled={importLoading}
                        className="cyber-btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-slate-950 font-bold font-mono text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {importLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        VALIDATE FILE
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {importError && (
                <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Step 2: Preview */}
              {importPreview && !importResult && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-xl font-bold text-white font-mono">{importPreview.totalRows}</div>
                      <div className="text-[10px] text-slate-400 uppercase">Total Rows</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                      <div className="text-xl font-bold text-emerald-400 font-mono">{importPreview.validRows}</div>
                      <div className="text-[10px] text-slate-400 uppercase">Valid</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                      <div className="text-xl font-bold text-rose-400 font-mono">{importPreview.invalidRows}</div>
                      <div className="text-[10px] text-slate-400 uppercase">Invalid</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40">
                      <div className="text-xl font-bold text-amber-400 font-mono">{importPreview.duplicateRows}</div>
                      <div className="text-[10px] text-slate-400 uppercase">Duplicates</div>
                    </div>
                  </div>

                  {importPreview.warnings.map((w, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{w}</span>
                    </div>
                  ))}

                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-64 overflow-y-auto shadow-inner">
                    <table className="w-full text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="px-3.5 py-2.5 text-left">Row</th>
                          <th className="px-3.5 py-2.5 text-left">Team Name</th>
                          <th className="px-3.5 py-2.5 text-left">Player 1</th>
                          <th className="px-3.5 py-2.5 text-left">Player 2</th>
                          <th className="px-3.5 py-2.5 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                        {importPreview.rows.map((row, i) => (
                          <tr key={i} className={row.valid ? 'text-slate-300' : 'text-rose-300 bg-rose-950/20'}>
                            <td className="px-3.5 py-2">{row.rowNumber}</td>
                            <td className="px-3.5 py-2 font-bold">{row.teamName || '—'}</td>
                            <td className="px-3.5 py-2">{row.player1Name || '—'}</td>
                            <td className="px-3.5 py-2">{row.player2Name || '—'}</td>
                            <td className="px-3.5 py-2">
                              {row.valid ? (
                                <span className="text-emerald-400 font-bold">✓ Valid</span>
                              ) : (
                                <span className="text-rose-400 font-bold" title={row.validationErrors.join('; ')}>
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
                      <button onClick={closeImportModal} className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs font-bold transition cursor-pointer">
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmImport}
                        disabled={importLoading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg transition cursor-pointer disabled:opacity-50"
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
                <div className="space-y-5">
                  <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-emerald-300 font-heading uppercase">Import Operation Completed</h3>
                    <p className="text-xs text-slate-300 font-mono mt-1">{importResult.summary}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-2xl font-bold text-emerald-400 font-heading">{importResult.teamsCreated}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Teams Created</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-2xl font-bold text-cyan-400 font-heading">{importResult.playersCreated}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Players Created</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-2xl font-bold text-amber-400 font-heading">{importResult.duplicatesSkipped}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Rows Skipped</div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={closeImportModal} className="cyber-btn-primary px-6 py-2.5 rounded-xl text-slate-950 font-bold font-mono text-xs transition cursor-pointer">
                      FINISH & REFRESH
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



