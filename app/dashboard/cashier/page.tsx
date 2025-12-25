'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function CashierPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    const [cashierName, setCashierName] = useState('');

    useEffect(() => {
        // Role Check
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCashierName(user.nama || 'Kasir');
            if (user.role !== 'karyawan') {
                Swal.fire('Akses Ditolak', 'Halaman ini hanya untuk Kasir.', 'error').then(() => {
                    router.push('/dashboard');
                });
                return;
            }
        } else {
            router.push('/');
        }

        fetch('/api/inventory')
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            });
    }, []);

    const addToCart = (product: any) => {
        if (product.stok <= 0) return Swal.fire('Stok Habis', 'Barang ini sudah habis.', 'warning');

        setCart(prev => {
            const existing = prev.find(p => p.barang_id === product.barang_id);
            if (existing) {
                // Check stock limit
                if (existing.qty >= product.stok) {
                    Swal.fire('Stok Limit', 'Jumlah melebihi stok tersedia.', 'warning');
                    return prev;
                }
                return prev.map(p => p.barang_id === product.barang_id ? { ...p, qty: p.qty + 1 } : p);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.barang_id === id) {
                const product = products.find(p => p.barang_id === id);
                const newQty = item.qty + delta;

                if (newQty < 1) return item;
                if (newQty > product.stok) {
                    Swal.fire('Stok Limit', 'Jumlah melebihi stok tersedia.', 'warning');
                    return item;
                }
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const editCartQty = (item: any) => {
        Swal.fire({
            title: `Ubah Jumlah (${item.satuan || 'Pcs'})`,
            input: 'text',
            inputValue: item.qty,
            inputLabel: 'Masukkan jumlah baru (Bisa desimal, cth: 0.5)',
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            inputValidator: (value) => {
                if (!value) return 'Harus diisi!';
                const val = parseFloat(value);
                if (isNaN(val) || val <= 0) return 'Jumlah tidak valid!';
                const product = products.find(p => p.barang_id === item.barang_id);
                if (val > product.stok) return `Stok tidak cukup! (Sisa: ${product.stok})`;
                return null;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newQty = parseFloat(result.value);
                setCart(prev => prev.map(p => p.barang_id === item.barang_id ? { ...p, qty: newQty } : p));
            }
        });
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(p => p.barang_id !== id));
    };

    const grandTotal = Math.ceil(cart.reduce((sum, item) => sum + (item.harga_jual * item.qty), 0));

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // 1. Input Cash Amount
        const { value: bayarStr } = await Swal.fire({
            title: 'Pembayaran',
            text: `Total Tagihan: Rp ${grandTotal.toLocaleString('id-ID')}`,
            input: 'text',
            inputLabel: 'Masukkan Jumlah Uang Tunai',
            inputPlaceholder: 'Contoh: 100000',
            showCancelButton: true,
            confirmButtonText: 'Proses',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#2563eb',
            inputValidator: (value) => {
                if (!value) return 'Harap masukkan jumlah uang!';
                const num = parseInt(value.replace(/\D/g, ''));
                if (isNaN(num)) return 'Format uang tidak valid!';
                if (num < grandTotal) return 'Uang tunai kurang!';
                return null;
            }
        });

        if (!bayarStr) return;

        const bayar = parseInt(bayarStr.replace(/\D/g, ''));
        const kembali = bayar - grandTotal;

        setProcessing(true);
        try {
            // Get user from localStorage
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : { user_id: 1 }; // Fallback to 1 if missing

            const payload = {
                user_id: user.user_id,
                total_harga: grandTotal,
                metode_pembayaran: 'Tunai',
                items: cart.map(item => ({
                    barang_id: item.barang_id,
                    qty: item.qty,
                    harga_satuan: item.harga_jual
                }))
            };

            const res = await fetch('/api/transactions', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                // Success Modal with Print Option
                Swal.fire({
                    title: 'Transaksi Berhasil!',
                    html: `
                        <div class="text-left text-sm">
                            <p>Total: <b>Rp ${grandTotal.toLocaleString('id-ID')}</b></p>
                            <p>Tunai: <b>Rp ${bayar.toLocaleString('id-ID')}</b></p>
                            <hr class="my-2"/>
                            <p class="text-lg">Kembali: <b class="text-blue-600">Rp ${kembali.toLocaleString('id-ID')}</b></p>
                        </div>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Cetak Struk (PDF)',
                    cancelButtonText: 'Tutup',
                    confirmButtonColor: '#2563eb'
                }).then((result) => {
                    if (result.isConfirmed) {
                        printReceipt(data.transaksi_id, cart, grandTotal, bayar, kembali);
                    }
                    // Reset cart and refresh stock
                    setCart([]);
                    fetch('/api/inventory').then(r => r.json()).then(setProducts);
                });
            } else {
                Swal.fire('Gagal', data.error || 'Terjadi kesalahan saat memproses transaksi.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Terjadi kesalahan sistem.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const printReceipt = (transaksiId: number, items: any[], total: number, bayar: number, kembali: number) => {
        const receiptWindow = window.open('', '_blank', 'width=400,height=600');
        if (receiptWindow) {
            const date = new Date().toLocaleString('id-ID');
            receiptWindow.document.write(`
                <html>
                <head>
                    <title>Struk #${transaksiId}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; text-transform: uppercase; color: #000; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed black; padding-bottom: 10px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .total { border-top: 1px dashed black; margin-top: 10px; padding-top: 10px; font-weight: bold; display: flex; justify-content: space-between; font-size: 14px; }
                        .payment { margin-top: 5px; display: flex; justify-content: space-between; }
                        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #000; }
                        @media print { 
                            .no-print { display: none; } 
                            body { color: #000; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2 style="margin:0">WARDIG</h2>
                        <p style="margin:0; font-size: 10px; font-weight: normal;">warung digital</p>
                        <p style="margin:5px 0 0 0">Gang lurah Kp Mekarsari RT 04/ RW 02</p>
                        <p style="margin:0 0 5px 0">Kec Bungursari Kab Purwakarta</p>
                        <p style="margin:0">#${transaksiId} | ${date}</p>
                    </div>
                    <div>
                        ${items.map(item => `
                            <div class="item">
                                <span>${item.nama_barang} (${item.qty} ${item.satuan || ''})</span>
                                <span>${(item.harga_jual * item.qty).toLocaleString('id-ID')}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="total">
                        <span>TOTAL</span>
                        <span>Rp ${total.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="payment">
                        <span>TUNAI</span>
                        <span>Rp ${bayar.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="payment">
                        <span>KEMBALI</span>
                        <span>Rp ${kembali.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="footer">
                        <p>KASIR: ${cashierName.toUpperCase()}</p>
                        <p>Terima Kasih</p>
                        <p class="no-print" style="margin-top:10px; font-style:italic; font-weight:bold;">* Pilih 'Save as PDF' pada dialog print untuk menyimpan struk digital.</p>
                    </div>
                    <script>
                        window.print();
                    </script>
                </body>
                </html>
            `);
            receiptWindow.document.close();
        }
    };

    const filteredProducts = products.filter(p =>
        p.nama_barang.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4 md:gap-6">
            {/* Left Column: Product List */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                <div className="flex items-center rounded-xl bg-white p-4 shadow-sm border border-slate-200 shrink-0">
                    <Search className="text-slate-600" />
                    <input
                        className="ml-3 flex-1 outline-none font-medium text-slate-900 placeholder:text-slate-400"
                        placeholder="Cari produk..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.barang_id}
                                onClick={() => addToCart(product)}
                                className={`cursor-pointer rounded-xl border border-slate-200 bg-white p-3 md:p-4 transition-all hover:shadow-md hover:border-blue-400 active:scale-95 ${product.stok === 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                            >
                                <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-lg bg-slate-100 text-slate-500 overflow-hidden">
                                    {product.gambar ? (
                                        <img src={product.gambar} alt={product.nama_barang} className="h-full w-full object-cover" />
                                    ) : (
                                        <PackageIcon />
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-900 truncate text-sm md:text-base">{product.nama_barang}</h3>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="text-blue-600 font-bold text-sm md:text-base">Rp {parseInt(product.harga_jual).toLocaleString('id-ID')}</span>
                                    <span className="text-[10px] md:text-xs text-slate-500 font-medium">{product.stok} {product.satuan || 'Pcs'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Cart */}
            <div className="w-full lg:w-96 flex flex-col rounded-2xl bg-white shadow-xl border border-slate-100 h-1/2 lg:h-full shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingCart size={20} /> Keranjang
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center text-slate-400 mt-10">Keranjang kosong</div>
                    ) : cart.map(item => (
                        <div key={item.barang_id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex-1 cursor-pointer" onClick={() => editCartQty(item)}>
                                <p className="font-medium text-sm text-slate-900 line-clamp-1">
                                    {item.nama_barang}
                                    <span className="text-xs text-slate-500 ml-1">({item.satuan || 'Pcs'})</span>
                                </p>
                                <p className="text-xs text-blue-600 font-bold">Rp {(item.harga_jual * item.qty).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateQty(item.barang_id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600 border border-slate-200"><Minus size={14} /></button>
                                <span
                                    className="text-sm font-bold w-10 text-center text-slate-900 cursor-pointer hover:bg-slate-200 rounded"
                                    onClick={() => editCartQty(item)}
                                >
                                    {item.qty}
                                </span>
                                <button onClick={() => updateQty(item.barang_id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600 border border-slate-200"><Plus size={14} /></button>
                                <button onClick={() => removeFromCart(item.barang_id)} className="ml-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    <div className="flex justify-between mb-4 text-lg font-bold text-slate-800">
                        <span>Total</span>
                        <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {processing ? 'Memproses...' : (
                            <>
                                <CreditCard size={20} /> Bayar Sekarang
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PackageIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22v-9.9" /></svg>
    )
}
