'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, UserCog } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        nama: '',
        role: 'kasir'
    });

    useEffect(() => {
        // Auth Check
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role !== 'admin') {
                Swal.fire('Akses Ditolak', 'Halaman ini hanya untuk Admin.', 'error').then(() => {
                    router.push('/dashboard');
                });
                return;
            }
        } else {
            router.push('/');
        }

        fetchUsers();
    }, []);

    const fetchUsers = () => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingUser ? `/api/users/${editingUser.user_id}` : '/api/users';
        const method = editingUser ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        setShowModal(false);
        setEditingUser(null);
        setFormData({ username: '', password: '', nama: '', role: 'kasir' });
        fetchUsers();
        Swal.fire('Sukses', 'Data user berhasil disimpan', 'success');
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '', // Keep empty to not overwrite unless changed
            nama: user.nama,
            role: user.role
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus User?',
            text: 'User yang dihapus tidak bisa dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            fetchUsers();
            Swal.fire('Terhapus', 'User berhasil dihapus.', 'success');
        }
    };

    const filteredUsers = users.filter(u =>
        u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <UserCog size={28} /> Kelola User
                </h2>
                <button
                    onClick={() => { setEditingUser(null); setFormData({ username: '', password: '', nama: '', role: 'kasir' }); setShowModal(true); }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    <Plus size={18} /> Tambah User
                </button>
            </div>

            <div className="flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2">
                <Search size={20} className="text-slate-600" />
                <input
                    type="text"
                    placeholder="Cari user (nama/username)..."
                    className="ml-3 flex-1 outline-none font-medium text-slate-900"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-medium">Username</th>
                            <th className="px-6 py-4 font-medium">Nama Lengkap</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-6 text-center">Loading...</td></tr>
                        ) : filteredUsers.map((user) => (
                            <tr key={user.user_id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{user.username}</td>
                                <td className="px-6 py-4 text-slate-700">{user.nama}</td>
                                <td className="px-6 py-4">
                                    <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(user)} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(user.user_id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Username</label>
                                <input
                                    required
                                    className="w-full rounded-lg border p-2 text-sm outline-none focus:border-blue-500"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Nama Lengkap</label>
                                <input
                                    required
                                    className="w-full rounded-lg border p-2 text-sm outline-none focus:border-blue-500"
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Password {editingUser && '(Kosongkan jika tidak diganti)'}</label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    className="w-full rounded-lg border p-2 text-sm outline-none focus:border-blue-500"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Role</label>
                                <select
                                    className="w-full rounded-lg border p-2 text-sm outline-none focus:border-blue-500"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="kasir">Kasir</option>
                                    <option value="admin">Admin / Pemilik</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-700">Simpan Data</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
