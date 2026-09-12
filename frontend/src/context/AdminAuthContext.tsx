import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAdminHeaders } from '../services/adminService';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (value: boolean) => void;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('codexcape_admin_session') || sessionStorage.getItem('codexcape_admin_session'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let mounted = true;
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events`, {
      headers: getAdminHeaders(),
      credentials: 'include',
      cache: 'no-store',
    })
      .then((response) => {
        if (mounted) {
          if (response.ok) {
            setIsAdminAuthenticated(true);
          } else {
            try {
              localStorage.removeItem('codexcape_admin_session');
              sessionStorage.removeItem('codexcape_admin_session');
            } catch {}
            setIsAdminAuthenticated(false);
          }
        }
      })
      .catch(() => {
        // network issue
      });

    return () => {
      mounted = false;
    };
  }, []);

  const logoutAdmin = () => {
    try {
      localStorage.removeItem('codexcape_admin_session');
      sessionStorage.removeItem('codexcape_admin_session');
    } catch {}
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, setIsAdminAuthenticated, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
