import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from './api';
import { setMemoryToken } from './http';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

/**
 * delivery:
 *  - 'cookie' (default): JWT stored in httpOnly cookie by the auth service.
 *  - 'memory'         : JWT returned in body; we keep it in memory and attach as Bearer to other services.
 */
export function AuthProvider({ children, delivery = 'cookie' }) {
  const [user, setUser] = useState(null);

  // On load, quick check (cookie mode will return authenticated: true if cookie exists)
  useEffect(() => {
    authApi.get('/auth/me')
      .then(({ data }) => { if (data.authenticated) setUser(prev => prev ?? { email: '(loading...)' }); })
      .catch(() => {});
  }, []);

  const register = async (email, password) => {
    await authApi.post('/auth/register', { email, password });
  };

  const login = async (email, password) => {
    if (delivery === 'cookie') {
      const { data } = await authApi.post('/auth/login', { email, password, delivery: 'cookie' });
      setUser({ email: data.email });
    } else {
      const { data } = await authApi.post('/auth/login', { email, password, delivery: 'memory' });
      // data = { token, email, expiresIn }
      setMemoryToken(data.token);
      setUser({ email: data.email });
    }
  };

  const logout = async () => {
    await authApi.post('/auth/logout');
    setMemoryToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, register, logout, delivery }}>
      {children}
    </AuthCtx.Provider>
  );
}