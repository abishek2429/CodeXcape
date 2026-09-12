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
        const data = await response.json().catch(() => ({}));
        const token = data.token || data.sessionToken;
        if (token) {
          localStorage.setItem('codexcape_admin_session', token);
          sessionStorage.setItem('codexcape_admin_session', token);
        }
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-void)', position: 'relative' }}>
      <div style={{ maxWidth: '450px', width: '100%', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '74px', height: '74px', borderRadius: '4px', backgroundColor: 'rgba(225, 6, 19, 0.12)', border: '1px solid var(--accent-crimson)', marginBottom: '20px', boxShadow: '0 0 25px rgba(225, 6, 19, 0.25)', position: 'relative' }}>
            <ShieldAlert size={36} color="var(--accent-crimson-bright)" />
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 900, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '0.08em' }}>
            MISSION CONTROL
          </h1>
          <p style={{ color: 'var(--accent-crimson-bright)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', fontWeight: 700 }}>
            ADMINISTRATIVE CLEARANCE REQUIRED
          </p>
        </div>

        {/* Login Form */}
        <Card style={{ padding: '32px', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-panel-elevated)', border: '1px solid var(--border-crimson)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(225, 6, 19, 0.15)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, transparent, var(--accent-crimson), transparent)', opacity: 0.8 }}></div>
          
          <form onSubmit={handleLogin} style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {error && (
              <div style={{ backgroundColor: 'rgba(225, 6, 19, 0.12)', border: '1px solid var(--accent-crimson)', color: '#ff99a4', padding: '14px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px', boxShadow: '0 0 12px rgba(225, 6, 19, 0.2)' }}>
                <ShieldAlert size={18} color="var(--accent-crimson-bright)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p>{error}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-crimson-bright)', letterSpacing: '0.08em', marginLeft: '2px', fontFamily: 'var(--font-mono)' }}>AUTHORIZATION KEY</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <Lock size={18} color="var(--accent-crimson)" />
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="> INPUT MASTER KEY_"
                  required
                  style={{ paddingLeft: '44px', paddingRight: '16px', backgroundColor: 'rgba(8, 8, 10, 0.8)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', letterSpacing: '0.12em', fontWeight: 800 }}
            >
              {isLoading ? (
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin"></div>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>INITIALIZE UPLINK</span>
                </>
              )}
            </Button>
          </form>
        </Card>
        
        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>
            SECURE ENCRYPTED SESSION • CRIMSON PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
};
