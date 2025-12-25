'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { BarChart3, Calendar, DollarSign, TrendingUp, Filter, Printer } from 'lucide-react';

export default function ReportsPage() {
    const [filter, setFilter] = useState('daily'); // daily, weekly, monthly, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Role Check
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role !== 'admin') {
                Swal.fire('Akses Ditolak', 'Halaman ini hanya untuk Admin/Pemilik.', 'error').then(() => {
                    router.push('/dashboard');
                });
                return;
            }
        } else {
            router.push('/');
        }

        fetchReport();
        fetchReport();
    }, [filter, startDate, endDate]);

    const fetchReport = () => {
        if (filter === 'custom' && (!startDate || !endDate)) return; // Don't fetch if incomplete custom dates

        setLoading(true);
        let url = `/api/reports?period=${filter}`;
        if (filter === 'custom') {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            });
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            const label = filter === 'custom'
                ? `${new Date(startDate).toLocaleDateString('id-ID')} s/d ${new Date(endDate).toLocaleDateString('id-ID')}`
                : periodLabels[filter];

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Laporan ${label}</title>
                        <style>
                            body { font-family: sans-serif; padding: 20px; color: #000; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                            th { background-color: #eee; font-weight: bold; }
                            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                            .summary { display: flex; justify-content: space-between; margin-bottom: 30px; }
                            .card { border: 1px solid #ccc; padding: 15px; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center; }
                            .card h3 { font-size: 14px; color: #555; margin-bottom: 5px; }
                            .card p { font-size: 18px; font-weight: bold; margin: 0; }
                            @media print { body { -webkit-print-color-adjust: exact; } }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2 style="margin:0">LAPORAN PENJUALAN</h2>
                            <p style="margin:5px 0 0 0; text-transform:uppercase;">PERIODE: ${label}</p>
                            <small>Dicetak: ${new Date().toLocaleString('id-ID')}</small>
                        </div>
                        
                        <div class="summary">
                             <div class="card">
                                <h3>TOTAL OMSET</h3>
                                <p>Rp ${parseInt(data?.summary?.totalSales || 0).toLocaleString('id-ID')}</p>
                             </div>
                             <div class="card">
                                <h3>KEUNTUNGAN</h3>
                                <p>Rp ${parseInt(data?.summary?.totalProfit || 0).toLocaleString('id-ID')}</p>
                             </div>
                             <div class="card">
                                <h3>TOTAL TRANSAKSI</h3>
                                <p>${data?.summary?.totalTransactions}</p>
                             </div>
                        </div>
    
                        <h3>Riwayat Transaksi</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Waktu</th>
                                    <th>Kasir</th>
                                    <th>Detail Barang</th>
                                    <th style="text-align:right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data?.transactions?.length === 0 ? '<tr><td colspan="5" style="text-align:center">Tidak ada data</td></tr>' : ''}
                                ${data?.transactions?.map((trx: any) => {
                const items = typeof trx.items === 'string' ? JSON.parse(trx.items) : trx.items;
                const itemsHtml = items.map((i: any) => `<div>- ${i.nama_barang} (x${i.qty})</div>`).join('');
                return `
                                    <tr>
                                        <td>#${trx.transaksi_id}</td>
                                        <td>${new Date(trx.tanggal_transaksi).toLocaleString('id-ID')}</td>
                                        <td>${trx.kasir_nama}</td>
                                        <td>${itemsHtml}</td>
                                        <td style="text-align:right">Rp ${parseInt(trx.total_harga).toLocaleString('id-ID')}</td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                        <script>
                            window.print();
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const periodLabels: any = {
        daily: 'Hari Ini',
        weekly: 'Minggu Ini',
        monthly: 'Bulan Ini',
        custom: 'Rentang Waktu'
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 size={28} /> Laporan Penjualan
                </h2>

                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {/* Period Selection */}
                    <div className="flex flex-wrap gap-2">
                        {['daily', 'weekly', 'monthly', 'custom'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setFilter(p)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${filter === p
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : p === 'monthly' ? 'Bulanan' : 'Custom'}
                            </button>
                        ))}
                    </div>

                    {/* Date Range Inputs (Only show if custom) */}
                    {filter === 'custom' && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="hidden text-slate-400 sm:inline">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <button
                        onClick={handlePrint}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-700 active:scale-95"
                    >
                        <Printer size={18} />
                        Cetak
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Memuat data laporan...</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <StatsCard
                            title={`Omset ${periodLabels[filter]}`}
                            value={`Rp ${parseInt(data?.summary?.totalSales || 0).toLocaleString('id-ID')}`}
                            icon={DollarSign}
                            color="bg-blue-500"
                        />
                        <StatsCard
                            title={`Keuntungan ${periodLabels[filter]}`}
                            value={`Rp ${parseInt(data?.summary?.totalProfit || 0).toLocaleString('id-ID')}`}
                            icon={TrendingUp}
                            color="bg-emerald-500"
                        />
                        <StatsCard
                            title={`Total Transaksi`}
                            value={`${data?.summary?.totalTransactions} Transaksi`}
                            icon={Calendar}
                            color="bg-purple-500"
                        />
                    </div>

                    {/* Transaction History Table */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50">
                            <h3 className="font-semibold text-slate-800">Riwayat Transaksi ({periodLabels[filter]})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-slate-200 text-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">ID Transaksi</th>
                                        <th className="px-6 py-3 font-semibold">Waktu</th>
                                        <th className="px-6 py-3 font-semibold">Kasir</th>
                                        <th className="px-6 py-3 font-semibold">Detail Barang</th>
                                        <th className="px-6 py-3 font-semibold text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.transactions?.length === 0 ? (
                                        <tr><td colSpan={5} className="p-6 text-center text-slate-500">Belum ada transaksi pada periode ini.</td></tr>
                                    ) : data?.transactions?.map((trx: any) => {
                                        const items = typeof trx.items === 'string' ? JSON.parse(trx.items) : trx.items;
                                        return (
                                            <tr key={trx.transaksi_id} className="hover:bg-slate-50 relative group">
                                                <td className="px-6 py-3 font-medium text-slate-900 align-top">#{trx.transaksi_id}</td>
                                                <td className="px-6 py-3 text-slate-600 align-top">
                                                    {new Date(trx.tanggal_transaksi).toLocaleString('id-ID', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </td>
                                                <td className="px-6 py-3 text-slate-600 align-top font-medium">{trx.kasir_nama}</td>
                                                <td className="px-6 py-3 text-slate-600 align-top">
                                                    <ul className="space-y-1">
                                                        {items.map((item: any, idx: number) => (
                                                            <li key={idx} className="text-xs">
                                                                <span className="font-semibold text-slate-700">{item.nama_barang}</span>
                                                                <span className="text-slate-500"> x{item.qty}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-900 align-top">
                                                    Rp {parseInt(trx.total_harga).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`rounded-lg p-3 text-white ${color}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    )
}
