import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('smartpark_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('smartpark_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    setUser({
      userId: authData.userId,
      name: authData.name,
      email: authData.email,
      role: authData.role,
    });
    localStorage.setItem('smartpark_token', authData.token);
    localStorage.setItem('smartpark_user', JSON.stringify({
      userId: authData.userId,
      name: authData.name,
      email: authData.email,
      role: authData.role,
    }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartpark_token');
    localStorage.removeItem('smartpark_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
