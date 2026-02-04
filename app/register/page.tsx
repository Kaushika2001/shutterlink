'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/services/auth';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    role: 'customer' as 'customer' | 'provider' | 'admin'
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.contactNumber) {
      alert('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await signUp(formData.email, formData.password, formData.name, formData.role, formData.contactNumber);
      alert('Registration successful! Check your email for confirmation.');
      router.push('/login');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Register</h2>

      <input
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={e => setFormData({...formData, name: e.target.value})}
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={e => setFormData({...formData, email: e.target.value})}
      />

      <input
        type="tel"
        placeholder="Contact Number"
        value={formData.contactNumber}
        onChange={e => setFormData({...formData, contactNumber: e.target.value})}
      />

      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={e => setFormData({...formData, password: e.target.value})}
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
      />

      <select 
        value={formData.role}
        onChange={e => setFormData({...formData, role: e.target.value as any})}
      >
        <option value="customer">Customer</option>
        <option value="provider">Service Provider</option>
        <option value="admin">Admin</option>
      </select>

      <button onClick={handleRegister} disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </div>
  );
}
