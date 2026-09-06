import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (value: boolean) => void;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/events`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    })
      .then((response) => {
        if (mounted) setIsAdminAuthenticated(response.ok);
      })
      .catch(() => {
        if (mounted) setIsAdminAuthenticated(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const logoutAdmin = () => {
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
