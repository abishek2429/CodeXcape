import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createEvent } from '../../services/eventService';
import { Calendar, ArrowLeft, ShieldAlert, Key, CheckCircle } from 'lucide-react';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [passkey, setPasskey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Event name is required');
      return;
    }

    if (startTime && endTime && new Date(endTime) < new Date(startTime)) {
      setError('End time cannot be before start time');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        passkey: passkey.trim() || undefined,
      });

      navigate(`/admin/events/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link
        to="/admin/events"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO EVENTS
      </Link>

      <div className="rounded-2xl bg-[#0e1322] border border-slate-800 p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-mono">CREATE NEW EVENT</h1>
            <p className="text-xs text-slate-400">Configure competition metadata, timeframe, and security passkey.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-3 font-mono">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold">
              EVENT NAME <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Inter-College Technical Fest 2026"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the competition rules, target participants, or format..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold">
                START TIME
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold">
                END TIME
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                EVENT PASSKEY (OPTIONAL)
              </span>
              <span className="text-slate-500 text-[11px]">Auto-generated if left blank</span>
            </label>
            <input
              type="text"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="e.g. 849201"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Link
              to="/admin/events"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white font-mono text-sm transition"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? 'CREATING...' : 'CREATE EVENT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
