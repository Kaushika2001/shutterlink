'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getUserRoleById } from '@/services/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoading(true);

      // 1️⃣ Login and get user
      const user = await signIn(email, password);

      if (!user) {
        throw new Error('Login failed');
      }

      // 2️⃣ Get role using user.id (SAFE)
      const role = await getUserRoleById(user.id);

      alert('Login successful');

      // 3️⃣ Role-based redirection
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'provider') {
        router.push('/provider/dashboard');
      } else if (role === 'customer') {
        router.push('/customer/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
  
}
