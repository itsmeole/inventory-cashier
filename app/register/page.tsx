'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Automatically login the registered user by saving the session
        localStorage.setItem('user', JSON.stringify(data.user));
        Swal.fire('Berhasil!', 'Akun berhasil dibuat. Anda ditambahkan sebagai Admin.', 'success').then(() => {
          // Immediately redirect to dashboard, the auto-prompt for store details will trigger
          router.push('/dashboard');
        });
      } else {
        setError(data.error || 'Gagal membuat akun');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 relative z-0 overflow-hidden">
        {/* Background Gradient Decorative Blobs */}
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-400/20 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-indigo-400/20 blur-[120px]" />
        </div>
        
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl relative z-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Daftar WARDIG</h1>
          <p className="text-slate-500">Buat akun untuk kelola warung Anda</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input
              type="text"
              name="nama"
              required
              value={formData.nama}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Masukkan nama lengkap admin"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Pilih username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 mt-2"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 border-t border-slate-100 pt-5">
          Sudah punya akun?{' '}
          <Link href="/" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
            Login di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
