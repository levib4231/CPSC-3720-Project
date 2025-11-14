import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login, delivery } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.assign('/profile');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display:'grid', gap:12, maxWidth:360 }}>
      <h2>Login {delivery === 'memory' ? '(Bearer token)' : '(Cookie)'}</h2>
      <input placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input type="password" placeholder="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button>Sign in</button>
      {err && <small style={{color:'crimson'}}>{err}</small>}
    </form>
  );
}