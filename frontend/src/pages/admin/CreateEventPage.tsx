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
    <div className="">
      <Link
        to="/admin/events"
        className="text-accent text-secondary flex items-center gap-2"
      >
        <ArrowLeft className="" />
        BACK TO EVENTS REGISTRY
      </Link>

      <div className="admin-panel">
        <div className="flex items-center">
          <div className="text-accent flex items-center justify-center">
            <Calendar className="" />
          </div>
          <div>
            <h1 className="text-primary">INITIALIZE ARENA EVENT</h1>
            <p className="text-secondary">Configure competition parameters, timeframe windows, and security hash.</p>
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
              EVENT NAME <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CodeXcape Cyber Championship 2026"
              className="text-primary"
              required
            />
          </div>

          <div>
            <label className="block">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of the escape room competition format, rules, and objectives..."
              className="text-primary"
            />
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block">
                START TIMESTAMP
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-primary"
              />
            </div>

            <div>
              <label className="block">
                END TIMESTAMP
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-primary"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between block">
              <span className="flex items-center">
                <Key className="text-accent" />
                EVENT PASSKEY (OPTIONAL)
              </span>
              <span className="">Auto-generated if left blank</span>
            </label>
            <input
              type="text"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="e.g. 849201"
              className=""
            />
          </div>

          <div className="flex items-center">
            <Link
              to="/admin/events"
              className="admin-panel text-primary"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2"
            >
              <CheckCircle className="" />
              <span>{submitting ? 'CREATING EVENT...' : 'INITIALIZE EVENT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;

