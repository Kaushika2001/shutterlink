'use client';

import { useState } from 'react';
import { signUp } from '@/services/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');

  const handleRegister = async () => {
    try {
      await signUp(email, password, name, role);
      alert('Registration successful');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>

      <input placeholder="Name" onChange={e => setName(e.target.value)} />
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />

      <select onChange={e => setRole(e.target.value as any)}>
        <option value="customer">Customer</option>
        <option value="provider">Service Provider</option>
      </select>

      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

// This file is intentionally left blank to allow for code splitting
// and to be imported by other files.
