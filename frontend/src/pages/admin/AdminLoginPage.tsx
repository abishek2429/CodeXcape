import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsAdminAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAdminAuthenticated(true);
        navigate(from, { replace: true });
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-void)' }}>
      <div style={{ maxWidth: '450px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.3)', marginBottom: '24px', boxShadow: '0 0 30px rgba(0, 217, 255, 0.15)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0, 217, 255, 0.2)' }} className=""></div>
            <ShieldAlert size={40} color="var(--accent-cyan)" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '0.05em' }}>
            MISSION CONTROL
          </h1>
          <p style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', fontWeight: 600 }}>
            ADMINISTRATIVE ACCESS ONLY
          </p>
        </div>

        {/* Login Form */}
        <Card style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, transparent, var(--accent-cyan), transparent)', opacity: 0.8 }}></div>
          
          <form onSubmit={handleLogin} style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fda4af', padding: '16px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <ShieldAlert size={20} color="var(--status-error)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p>{error}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '4px', fontFamily: 'var(--font-mono)' }}>Authorization Key</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <Lock size={20} color="rgba(0, 217, 255, 0.5)" />
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  style={{ paddingLeft: '48px', paddingRight: '16px', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', letterSpacing: '0.05em' }}
            >
              {isLoading ? (
                <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255, 255, 255, 0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>INITIALIZE UPLINK</span>
                </>
              )}
            </Button>
          </form>
        </Card>
        
        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            SECURE CONNECTION ESTABLISHED • ENCRYPTED CHANNEL
          </p>
        </div>
      </div>
    </div>
  );
};
