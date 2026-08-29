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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <Link
        to="/admin/events"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO EVENTS REGISTRY
      </Link>

      <div className="cyber-panel hud-corner p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading uppercase tracking-wide">INITIALIZE ARENA EVENT</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Configure competition parameters, timeframe windows, and security hash.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 font-mono">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 font-mono">
          <div>
            <label className="block text-xs text-slate-300 mb-2 font-bold uppercase tracking-wider">
              EVENT NAME <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CodeXcape Cyber Championship 2026"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 shadow-inner font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-2 font-bold uppercase tracking-wider">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of the escape room competition format, rules, and objectives..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 shadow-inner font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-2 font-bold uppercase tracking-wider">
                START TIMESTAMP
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 shadow-inner font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-2 font-bold uppercase tracking-wider">
                END TIMESTAMP
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 shadow-inner font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-2 font-bold flex items-center justify-between uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                EVENT PASSKEY (OPTIONAL)
              </span>
              <span className="text-slate-500 text-[10px] font-normal">Auto-generated if left blank</span>
            </label>
            <input
              type="text"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="e.g. 849201"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-400 shadow-inner tracking-widest font-mono"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Link
              to="/admin/events"
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="cyber-btn-primary px-6 py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'CREATING EVENT...' : 'INITIALIZE EVENT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;

