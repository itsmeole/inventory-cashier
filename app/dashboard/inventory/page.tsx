'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nama_barang: '',
        harga_beli: '',
        harga_jual: '',
        stok: '',
        stok_minimum: '',
        satuan: 'Pcs'
    });

    const fetchItems = () => {
        fetch('/api/inventory?search=' + searchTerm)
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchItems();
    }, [searchTerm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingItem ? `/api/inventory/${editingItem.barang_id}` : '/api/inventory';
        const method = editingItem ? 'PUT' : 'POST';

        const data = new FormData();
        data.append('nama_barang', formData.nama_barang);
        data.append('harga_beli', formData.harga_beli);
        data.append('harga_jual', formData.harga_jual);
        data.append('stok', formData.stok);
        data.append('stok_minimum', formData.stok_minimum);
        data.append('satuan', formData.satuan);

        // Append user_id for logging
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.user_id) data.append('user_id', user.user_id);
        }

        if (imageFile) {
            data.append('image', imageFile);
        }

        await fetch(url, {
            method,
            body: data
        });

        setShowModal(false);
        setEditingItem(null);
        setFormData({ nama_barang: '', harga_beli: '', harga_jual: '', stok: '', stok_minimum: '', satuan: 'Pcs' });
        setImageFile(null);
        setPreviewUrl(null);
        fetchItems();
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            nama_barang: item.nama_barang,
            harga_beli: item.harga_beli,
            harga_jual: item.harga_jual,
            stok: item.stok,
            stok_minimum: item.stok_minimum,
            satuan: item.satuan || 'Pcs'
        });
        setPreviewUrl(item.gambar || null);
        setImageFile(null);
        setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Anda tidak akan dapat mengembalikan ini!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Gagal menghapus barang');
                }

                fetchItems(); // Changed from fetchInventory to fetchItems
                Swal.fire('Terhapus!', 'Barang telah dihapus permanen.', 'success');
            } catch (error: any) {
                Swal.fire('Gagal!', error.message, 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Stok Barang</h2>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setFormData({ nama_barang: '', harga_beli: '', harga_jual: '', stok: '', stok_minimum: '', satuan: 'Pcs' });
                        setImageFile(null);
                        setPreviewUrl(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    <Plus size={18} /> Tambah Barang
                </button>
            </div>

            <div className="flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2">
                <Search size={20} className="text-slate-600" />
                <input
                    type="text"
                    placeholder="Cari nama barang..."
                    className="ml-3 flex-1 outline-none"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-medium">Gambar</th>
                                <th className="px-6 py-4 font-medium">Nama Barang</th>
                                <th className="px-6 py-4 font-medium">Harga Beli</th>
                                <th className="px-6 py-4 font-medium">Harga Jual</th>
                                <th className="px-6 py-4 font-medium">Stok</th>
                                <th className="px-6 py-4 font-medium">Satuan</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.barang_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        {item.gambar ? (
                                            <img src={item.gambar} alt={item.nama_barang} className="h-10 w-10 rounded-md object-cover border border-slate-200" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No Img</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.nama_barang}</td>
                                    <td className="px-6 py-4">Rp {item.harga_beli.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 font-bold text-green-600">Rp {item.harga_jual.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${parseFloat(item.stok) <= parseFloat(item.stok_minimum) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {item.stok}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{item.satuan || 'Pcs'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(item)} className="rounded p-1 text-blue-600 hover:bg-blue-50"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(item.barang_id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-24 w-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-slate-400 text-center p-2">Upload Gambar</span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Nama Barang</label>
                                <input
                                    required
                                    className="w-full rounded-lg border p-2 text-sm outline-none focus:border-blue-500"
                                    value={formData.nama_barang}
                                    onChange={e => setFormData({ ...formData, nama_barang: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Harga Beli</label>
                                    <input
                                        type="number" required
                                        step="0.01"
                                        className="w-full rounded-lg border p-2 text-sm outline-none focus:border-blue-500"
                                        value={formData.harga_beli}
                                        onChange={e => setFormData({ ...formData, harga_beli: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Harga Jual</label>
                                    <input
                                        type="number" required
                                        step="0.01"
                                        className="w-full rounded-lg border p-2 text-sm outline-none focus:border-blue-500"
                                        value={formData.harga_jual}
                                        onChange={e => setFormData({ ...formData, harga_jual: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stok Awal</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-blue-500"
                                        value={formData.stok}
                                        onChange={e => setFormData({ ...formData, stok: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stok Minimum</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-blue-500"
                                        value={formData.stok_minimum}
                                        onChange={e => setFormData({ ...formData, stok_minimum: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-blue-500"
                                    value={formData.satuan}
                                    onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                                >
                                    <option value="Pcs">Pcs</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Liter">Liter</option>
                                    <option value="Box">Box</option>
                                    <option value="Pak">Pak</option>
                                    <option value="Botol">Botol</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-700">Simpan</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
