import { useEffect, useState } from 'react';
import { authApi } from '../auth/api';
import { useAuth } from '../auth/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    authApi.get('/protected/profile')
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile({ error: 'Unauthorized' }));
  }, []);

  return (
    <div>
      <h2>Profile</h2>
      <p>{user ? `Logged in as ${user.email}` : 'Logged out'}</p>
      <pre>{profile ? JSON.stringify(profile, null, 2) : 'Loading...'}</pre>
    </div>
  );
}