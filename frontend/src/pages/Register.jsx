import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    await register(email, password);
    setMsg('Registered! You can now log in.');
  };

  return (
    <form onSubmit={onSubmit} style={{ display:'grid', gap:12, maxWidth:360 }}>
      <h2>Register</h2>
      <input placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input type="password" placeholder="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button>Create account</button>
      {msg && <small>{msg}</small>}
    </form>
  );
}