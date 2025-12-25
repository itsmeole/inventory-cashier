'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Package, AlertTriangle, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/reports')
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Penjualan Hari Ini"
                    value={`Rp ${parseInt(stats?.todaySales || 0).toLocaleString('id-ID')}`}
                    icon={DollarSign}
                    color="bg-blue-500"
                />
                <StatsCard
                    title="Penjualan Bulan Ini"
                    value={`Rp ${parseInt(stats?.monthSales || 0).toLocaleString('id-ID')}`}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
                <StatsCard
                    title="Estimasi Laba (Hari Ini)"
                    value={`Rp ${parseInt(stats?.todayProfit || 0).toLocaleString('id-ID')}`}
                    icon={Package}
                    color="bg-indigo-500"
                />
                <StatsCard
                    title="Stok Menipis"
                    value={`${stats?.lowStockItems?.length || 0} Barang`}
                    icon={AlertTriangle}
                    color="bg-amber-500"
                />
            </div>

            {/* Low Stock Table */}
            {stats?.lowStockItems?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Peringatan Stok Limit
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b text-slate-700">
                                        <th className="pb-3 whitespace-nowrap px-2">Nama Barang</th>
                                        <th className="pb-3 whitespace-nowrap px-2">Sisa Stok</th>
                                        <th className="pb-3 whitespace-nowrap px-2">Minimum</th>
                                        <th className="pb-3 text-right whitespace-nowrap px-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.lowStockItems.map((item: any) => (
                                        <tr key={item.barang_id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="py-3 font-medium text-slate-700 whitespace-nowrap px-2">{item.nama_barang}</td>
                                            <td className="py-3 text-slate-600 font-bold text-red-500 whitespace-nowrap px-2">{item.stok}</td>
                                            <td className="py-3 text-slate-400 whitespace-nowrap px-2">{item.stok_minimum}</td>
                                            <td className="py-3 text-right whitespace-nowrap px-2">
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 whitespace-nowrap">
                                                    Perlu Restock
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Log History */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Package size={18} className="text-blue-500" />
                        Stok Log (Riwayat Masuk/Keluar)
                    </h3>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium whitespace-nowrap">Waktu</th>
                                    <th className="px-6 py-4 font-medium whitespace-nowrap">User</th>
                                    <th className="px-6 py-4 font-medium whitespace-nowrap">Barang</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Jumlah</th>
                                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Harga (Est)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats?.stockLogs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                                            Belum ada data riwayat stok
                                        </td>
                                    </tr>
                                ) : (
                                    stats?.stockLogs?.map((log: any) => (
                                        <tr key={log.log_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                                                {new Date(log.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })},
                                                <span className="text-xs ml-1">{new Date(log.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 font-medium text-sm whitespace-nowrap">{log.user_nama || '-'}</td>
                                            <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">{log.nama_barang}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${log.jenis === 'masuk'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {log.jenis === 'masuk' ? 'Barang Masuk' : 'Terjual/Keluar'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-700 whitespace-nowrap">
                                                {parseFloat(log.jumlah).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                                                Rp {parseInt(log.harga_beli || log.harga_jual || 0).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
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
