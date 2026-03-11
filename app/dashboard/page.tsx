'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Package, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, User } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetcher';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserName(user.nama || 'User');
            } catch (e) { }
        }

        fetchWithAuth('/api/reports')
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
    );

    const getTrendProps = (current: any, previous: any) => {
        const curr = parseFloat(current || 0);
        const prev = parseFloat(previous || 0);
        const diff = curr - prev;
        const trend = prev === 0 ? (curr > 0 ? 100 : 0) : ((diff / prev) * 100);
        const isUp = diff >= 0;
        return {
            trendNum: Math.abs(trend).toFixed(1) + '%',
            isUp
        };
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-row items-center justify-between gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                <div 
                    onClick={() => window.dispatchEvent(new Event('openUserProfileModal'))}
                    className="hidden md:flex flex-row items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <span className="font-semibold text-slate-800 text-xs md:text-sm">Hallo, {userName}</span>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-slate-200 flex justify-center items-center shadow-sm">
                        <User size={18} className="text-slate-600 md:w-5 md:h-5" />
                    </div>
                </div>
            </div>

            {/* Banner Section */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0F172A] px-6 py-6 md:px-10 md:py-10 shadow-sm flex flex-row md:flex-row items-center justify-between gap-6 md:gap-0">
                <div className="relative z-10 w-full md:max-w-lg text-white">
                    <h3 className="text-xl md:text-3xl font-bold mb-1  md:mb-2">
                        WARDIG <span className="block md:inline text-slate-400 text-lg md:text-2xl font-normal">Warung Digital</span>
                    </h3>
                    <p className="text-xs md:text-xl text-slate-300 md:leading-relaxed font-medium">
                        Solusi cerdas karya anak<br />
                        bangsa untuk UMKM naik level
                    </p>
                </div>
                {/* Image decoration */}
                <div className="relative md:absolute md:right-8 md:bottom-0 md:top-4 w-full md:w-1/2 flex justify-end md:justify-end mt-2 md:mt-0">
                    <img 
                        src="/object.png" 
                        alt="Decoration" 
                        className="h-25 md:h-40 w-auto object-contain object-center md:object-left md:mr-0 drop-shadow-2xl"
                    />
                </div>
            </div>

            {/* Top Stats & Top Products Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatsCard
                        title="Penjualan Hari Ini"
                        value={`Rp ${parseInt(stats?.todaySales || 0).toLocaleString('id-ID')}`}
                        icon={DollarSign}
                        bgColor="bg-blue-500"
                        trend={stats ? getTrendProps(stats.todaySales, stats.yesterdaySales).trendNum : null}
                        isUp={stats ? getTrendProps(stats.todaySales, stats.yesterdaySales).isUp : null}
                        subtitle="vs kemarin"
                    />
                    <StatsCard
                        title="Penjualan Bulan Ini"
                        value={`Rp ${parseInt(stats?.monthSales || 0).toLocaleString('id-ID')}`}
                        icon={TrendingUp}
                        bgColor="bg-emerald-500"
                        trend={stats ? getTrendProps(stats.monthSales, stats.lastMonthSales).trendNum : null}
                        isUp={stats ? getTrendProps(stats.monthSales, stats.lastMonthSales).isUp : null}
                        subtitle="vs bulan lalu"
                    />
                    <StatsCard
                        title="Estimasi Laba (Hari Ini)"
                        value={`Rp ${parseInt(stats?.todayProfit || 0).toLocaleString('id-ID')}`}
                        icon={Package}
                        bgColor="bg-indigo-500"
                        trend={stats ? getTrendProps(stats.todayProfit, stats.yesterdayProfit).trendNum : null}
                        isUp={stats ? getTrendProps(stats.todayProfit, stats.yesterdayProfit).isUp : null}
                        subtitle="vs kemarin"
                    />
                    <StatsCard
                        title="Stok Menipis"
                        value={`${stats?.lowStockItems?.length || 0} Barang`}
                        icon={AlertTriangle}
                        bgColor="bg-amber-500"
                        subtitle={stats?.lowStockItems?.length > 0 ? "Perlu restock" : "Tidak ada stok menipis"}
                    />
                </div>

                {/* Top 3 Products Table */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-800">Produk dengan penjualan terbanyak</h3>
                    </div>
                    <div className="p-4 flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[500px]">
                            <thead className="text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="pb-2 font-medium px-2">#</th>
                                    <th className="pb-2 font-medium px-2">Foto Produk</th>
                                    <th className="pb-2 font-medium px-2">Nama Produk</th>
                                    <th className="pb-2 font-medium px-2">Harga Produk</th>
                                    <th className="pb-2 font-medium text-center px-2">Unit Terjual</th>
                                    <th className="pb-2 font-medium text-right px-2">Keuntungan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats?.topProducts?.length === 0 ? (
                                    <tr><td colSpan={6} className="py-4 text-center text-slate-400">Belum ada data penjualan.</td></tr>
                                ) : (
                                    stats?.topProducts?.map((product: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 text-slate-600 font-medium px-2">{idx + 1}.</td>
                                            <td className="py-3 px-2">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                    {product.gambar ? (
                                                        <img src={product.gambar} alt={product.nama_barang} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Foto<br/>Produk</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 font-semibold text-slate-800 px-2">{product.nama_barang}</td>
                                            <td className="py-3 text-slate-600 px-2 whitespace-nowrap">Rp {parseInt(product.harga_satuan).toLocaleString('id-ID')}</td>
                                            <td className="py-3 text-center font-bold text-slate-700 px-2">{Math.round(product.total_qty || 0)}</td>
                                            <td className="py-3 text-right text-emerald-600 font-semibold px-2 whitespace-nowrap">Rp {parseInt(product.total_profit).toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>



            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Bar Chart: Pembelian vs penjualan */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[350px] md:h-[400px]">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-800">Pembelian vs penjualan</h3>
                    </div>
                    <div className="p-4 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.salesVsPurchase || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date_label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`} />
                                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                                <Legend iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar dataKey="sales" name="Sales" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="purchase" name="Purchase" fill="#FDBA74" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Line/Area Chart: Sales Overview */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[350px] md:h-[400px]">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-800">Sales Overview</h3>
                    </div>
                    <div className="p-4 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.yearlyOverview || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month_label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `${value}`} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} verticalAlign="top" align="right" />
                                
                                {/* Background Area for Last Year */}
                                <Area type="monotone" dataKey="last_year" name="Last Year" stroke="none" fillOpacity={1} fill="url(#colorLastYear)" />
                                
                                {/* Lines */}
                                <Line type="monotone" dataKey="last_year" name="Last Year" stroke="#22C55E" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="this_year" name="This Year" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Low Stock Table */}
            {stats?.lowStockItems?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm mt-6">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        <h3 className="font-semibold text-slate-800">Peringatan Stok Limit</h3>
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

            {/* Bottom Row - Stok Log (Reused from old layout) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm mt-6">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                    <Package size={20} className="text-blue-500" />
                    <h3 className="font-semibold text-slate-800">Stok Log (Riwayat Masuk/Keluar)</h3>
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
                                    <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Jumlah</th>
                                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Harga (Est)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats?.stockLogs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
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
                                            <td className="px-6 py-4 text-slate-900 font-bold whitespace-nowrap">{log.nama_barang}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${log.jenis === 'masuk'
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'bg-red-100 text-red-500'
                                                    }`}>
                                                    {log.jenis === 'masuk' ? 'Barang Masuk' : 'Terjual/Keluar'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-800 whitespace-nowrap">
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

// Sub-component for Top Stats Cards
function StatsCard({ title, value, icon: Icon, bgColor, trend, isUp, subtitle }: any) {
    return (
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                {trend && (
                    <p className="mt-2 flex items-center gap-1 text-xs">
                        <span className={`font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${isUp ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trend}
                        </span>
                        <span className="text-slate-400 ml-1">{subtitle}</span>
                    </p>
                )}
                {!trend && subtitle && (
                    <p className="mt-2 text-xs font-medium text-slate-400">{subtitle}</p>
                )}
            </div>
            <div className={`p-4 rounded-xl text-white ${bgColor} shadow-sm ml-4`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
    )
}
