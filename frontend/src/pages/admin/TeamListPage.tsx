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
    <div className="">
      <Link
        to={eventId ? `/admin/events/${eventId}` : '/admin/events'}
        className="text-accent text-secondary flex items-center gap-2"
      >
        <ArrowLeft className="" />
        BACK TO EVENT DETAILS
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-accent">
            ARENA EVENT: {event?.name || `#${eventId}`}
          </span>
          <h1 className="text-primary flex items-center">
            <Users className="text-accent" />
            REGISTERED TEAMS ({teams.length})
          </h1>
        </div>
        <div className="flex items-center">
          <button
            onClick={loadData}
            className="admin-panel text-primary"
            title="Refresh list"
          >
            <RefreshCw className="admin-dynamic-element" />
          </button>
          <button
            onClick={openImportModal}
            className="flex items-center gap-2"
            id="import-excel-btn"
          >
            <FileSpreadsheet className="" />
            <span>BULK IMPORT EXCEL</span>
          </button>
          <Link
            to={`/admin/events/${eventId}/teams/new`}
            className="flex items-center gap-2"
          >
            <Plus className="" />
            <span>CREATE TEAM</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center">
          <ShieldAlert className="text-danger flex" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-secondary flex items-center justify-center">
          <div className="animate-spin"></div>
          <span className="">Loading team records & authentication codes...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="admin-panel">
          <Users className="" />
          <h3 className="">No Teams Registered Yet</h3>
          <p className="text-secondary">Add teams individually or bulk-import a full roster using Excel (.xlsx).</p>
          <div className="flex items-center justify-center">
            <button
              onClick={openImportModal}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="" />
              <span>Import from Excel</span>
            </button>
            <Link
              to={`/admin/events/${eventId}/teams/new`}
              className="flex items-center gap-2"
            >
              <Plus className="" />
              <span>Create Single Team</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="admin-panel">
          <div className="">
            <table className="">
              <thead className="text-secondary">
                <tr>
                  <th className="">TEAM CODE</th>
                  <th className="">TEAM NAME</th>
                  <th className="">PLAYER 1 NODE</th>
                  <th className="">PLAYER 2 NODE</th>
                  <th className="">CLEARANCE STATUS</th>
                  <th className="">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="">
                {teams.map((tm) => (
                  <tr key={tm.id} className="admin-panel">
                    <td className="">
                      <span className="flex items-center">
                        <Key className="text-accent" />
                        {tm.teamCode}
                      </span>
                    </td>
                    <td className="text-primary">{tm.teamName}</td>
                    <td className="">
                      <span className="flex items-center">
                        <User className="text-accent" />
                        {tm.player1DisplayName || 'Player 1'}
                      </span>
                    </td>
                    <td className="">
                      <span className="flex items-center">
                        <User className="" />
                        {tm.player2DisplayName || 'Player 2'}
                      </span>
                    </td>
                    <td className="">
                      <button
                        onClick={() => handleStatusToggle(tm.id, tm.status)}
                        className="admin-dynamic-element"
                      >
                        {tm.status}
                      </button>
                    </td>
                    <td className="">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/teams/${tm.id}`}
                          className="admin-panel admin-btn-secondary"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteTeam(tm.id, tm.teamCode)}
                          className="text-danger"
                          title="Delete Team"
                        >
                          <Trash2 className="" />
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
        <div className="flex items-center justify-center" onClick={closeImportModal}>
          <div className="admin-panel" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-primary flex items-center gap-2">
                <FileSpreadsheet className="text-success" />
                BULK IMPORT TEAMS VIA EXCEL (.XLSX)
              </h2>
              <button onClick={closeImportModal} className="text-secondary text-primary">✕</button>
            </div>

            <div className="">
              {/* Step 1: File Upload */}
              {!importResult && (
                <div className="">
                  <div className="">
                    <p className="text-primary">Required Columns in First Sheet:</p>
                    <div className="flex gap-2">
                      <span className="">Column A: Team Name</span>
                      <span className="">Column B: Player 1 Name</span>
                      <span className="">Column C: Player 2 Name</span>
                    </div>
                    <p className="">Header row is automatically detected and skipped.</p>
                  </div>

                  <div className="flex items-center">
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
                      className="admin-panel admin-btn-secondary flex items-center gap-2"
                    >
                      <Upload className="text-accent" />
                      {importFile ? importFile.name : 'Choose Excel File (.xlsx)'}
                    </button>
                    {importFile && !importPreview && (
                      <button
                        onClick={handlePreview}
                        disabled={importLoading}
                        className="flex items-center gap-2"
                      >
                        {importLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 className="" />}
                        VALIDATE FILE
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {importError && (
                <div className="flex items-center gap-2">
                  <XCircle className="text-danger" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Step 2: Preview */}
              {importPreview && !importResult && (
                <div className="">
                  <div className="grid">
                    <div className="">
                      <div className="text-primary">{importPreview.totalRows}</div>
                      <div className="text-secondary">Total Rows</div>
                    </div>
                    <div className="">
                      <div className="text-success">{importPreview.validRows}</div>
                      <div className="text-secondary">Valid</div>
                    </div>
                    <div className="">
                      <div className="text-danger">{importPreview.invalidRows}</div>
                      <div className="text-secondary">Invalid</div>
                    </div>
                    <div className="">
                      <div className="text-warning">{importPreview.duplicateRows}</div>
                      <div className="text-secondary">Duplicates</div>
                    </div>
                  </div>

                  {importPreview.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <AlertTriangle className="text-warning" />
                      <span>{w}</span>
                    </div>
                  ))}

                  <div className="">
                    <table className="">
                      <thead className="text-secondary">
                        <tr>
                          <th className="">Row</th>
                          <th className="">Team Name</th>
                          <th className="">Player 1</th>
                          <th className="">Player 2</th>
                          <th className="">Status</th>
                        </tr>
                      </thead>
                      <tbody className="">
                        {importPreview.rows.map((row, i) => (
                          <tr key={i} className={row.valid ? 'text-slate-300' : 'text-rose-300 bg-rose-950/20'}>
                            <td className="">{row.rowNumber}</td>
                            <td className="">{row.teamName || '—'}</td>
                            <td className="">{row.player1Name || '—'}</td>
                            <td className="">{row.player2Name || '—'}</td>
                            <td className="">
                              {row.valid ? (
                                <span className="text-success">✓ Valid</span>
                              ) : (
                                <span className="text-danger" title={row.validationErrors.join('; ')}>
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
                    <div className="flex items-center">
                      <button onClick={closeImportModal} className="admin-panel text-primary">
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmImport}
                        disabled={importLoading}
                        className="flex items-center gap-2"
                      >
                        {importLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 className="" />}
                        CONFIRM IMPORT ({importPreview.validRows} TEAMS)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Result */}
              {importResult && (
                <div className="">
                  <div className="">
                    <CheckCircle2 className="text-success" />
                    <h3 className="">Import Operation Completed</h3>
                    <p className="">{importResult.summary}</p>
                  </div>
                  <div className="grid">
                    <div className="">
                      <div className="text-success">{importResult.teamsCreated}</div>
                      <div className="text-secondary">Teams Created</div>
                    </div>
                    <div className="">
                      <div className="text-accent">{importResult.playersCreated}</div>
                      <div className="text-secondary">Players Created</div>
                    </div>
                    <div className="">
                      <div className="text-warning">{importResult.duplicatesSkipped}</div>
                      <div className="text-secondary">Rows Skipped</div>
                    </div>
                  </div>
                  <div className="flex">
                    <button onClick={closeImportModal} className="">
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



