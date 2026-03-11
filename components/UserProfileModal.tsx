'use client';

import { useState, useEffect } from 'react';
import { X, User as UserIcon, Store, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';
import { fetchWithAuth } from '@/lib/fetcher';

export default function UserProfileModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [mandatoryInit, setMandatoryInit] = useState(false);

    const [formData, setFormData] = useState({
        nama_admin: '',
        role: '',
        nama_toko: 'WARDIG - Warung Digital',
        jalan: '',
        rt_rw: '',
        kecamatan: '',
        kabupaten: '',
        provinsi: ''
    });

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            fetchData();
        };

        window.addEventListener('openUserProfileModal', handleOpen);
        
        // Auto-check on mount if it's a new store
        autoCheckStore();

        return () => window.removeEventListener('openUserProfileModal', handleOpen);
    }, []);

    const autoCheckStore = async () => {
        try {
            const res = await fetchWithAuth('/api/store-settings');
            const data = await res.json();
            if (data && data.nama_toko === '') {
                setMandatoryInit(true);
                setIsOpen(true);
                fetchData();
            }
        } catch (error) {
            console.error('Failed to auto check store', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Read local user
            const userStr = localStorage.getItem('user');
            let currentUser = null;
            if (userStr) {
                currentUser = JSON.parse(userStr);
                setUser(currentUser);
            }

            // Fetch store settings
            const res = await fetchWithAuth('/api/store-settings');
            const data = await res.json();
            
            setFormData({
                nama_admin: currentUser?.nama || '',
                role: currentUser?.role || '',
                nama_toko: data.nama_toko || '',
                jalan: data.jalan || '',
                rt_rw: data.rt_rw || '',
                kecamatan: data.kecamatan || '',
                kabupaten: data.kabupaten || '',
                provinsi: data.provinsi || ''
            });
        } catch (error) {
            console.error('Failed to load profile data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetchWithAuth('/api/store-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    user_id: user?.user_id
                })
            });

            if (res.ok) {
                // Update local storage name
                if (user) {
                    const updatedUser = { ...user, nama: formData.nama_admin };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    // Dispatch event just in case any component is listening for name changes locally
                    window.dispatchEvent(new Event('userProfileUpdated'));
                }
                Swal.fire('Sukses', 'Profil dan profil toko berhasil diperbarui', 'success');
                setIsOpen(false);
                // Hard refresh to update names everywhere and prevent stale state
                window.location.reload();
            } else {
                Swal.fire('Error', 'Gagal menyimpan perubahan', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const isAdmin = user?.role === 'admin';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <UserIcon className="text-blue-600" size={24} /> 
                        {mandatoryInit ? 'Lengkapi Profil Toko' : 'Profil & Toko'}
                    </h3>
                    {!mandatoryInit && (
                        <button onClick={() => setIsOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="py-10 text-center text-slate-500 animate-pulse">Memuat data profil...</div>
                    ) : (
                        <form id="profileForm" onSubmit={handleSave} className="space-y-6">
                            
                            {/* Personal Info Group */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                                    <CreditCard size={16}/> Informasi Pribadi
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Nama Lengkap</label>
                                        <input 
                                            name="nama_admin"
                                            value={formData.nama_admin}
                                            onChange={handleChange}
                                            disabled={!isAdmin}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Status / Role</label>
                                        <input 
                                            name="role"
                                            value={formData.role.toUpperCase()}
                                            disabled
                                            className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2.5 outline-none text-slate-500 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Store Info Group */}
                            <div className="space-y-4 pt-2">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
                                    <Store size={16}/> Alamat Toko (Struk)
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Nama Toko WARDIG Anda</label>
                                        <input 
                                            name="nama_toko"
                                            value={formData.nama_toko}
                                            onChange={handleChange}
                                            disabled={!isAdmin}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 font-bold"
                                            placeholder="Contoh: Toko Sembako Jaya"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Nama Jalan</label>
                                        <input 
                                            name="jalan"
                                            value={formData.jalan}
                                            onChange={handleChange}
                                            disabled={!isAdmin}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                            placeholder="Contoh: Jl. Diponegoro No. 10"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 block mb-1">RT / RW</label>
                                            <input 
                                                name="rt_rw"
                                                value={formData.rt_rw}
                                                onChange={handleChange}
                                                disabled={!isAdmin}
                                                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                placeholder="Contoh: 01/02"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 block mb-1">Kecamatan</label>
                                            <input 
                                                name="kecamatan"
                                                value={formData.kecamatan}
                                                onChange={handleChange}
                                                disabled={!isAdmin}
                                                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 block mb-1">Kabupaten/Kota</label>
                                            <input 
                                                name="kabupaten"
                                                value={formData.kabupaten}
                                                onChange={handleChange}
                                                disabled={!isAdmin}
                                                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 block mb-1">Provinsi</label>
                                            <input 
                                                name="provinsi"
                                                value={formData.provinsi}
                                                onChange={handleChange}
                                                disabled={!isAdmin}
                                                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </form>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    {!mandatoryInit && (
                        <button 
                            type="button" 
                            onClick={() => setIsOpen(false)}
                            className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors"
                        >
                            Tutup
                        </button>
                    )}
                    {isAdmin && (
                        <button 
                            type="submit" 
                            form="profileForm"
                            disabled={loading || saving}
                            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
