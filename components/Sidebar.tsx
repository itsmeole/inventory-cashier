'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, BarChart3, LogOut, User, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Sidebar() {
    const [role, setRole] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setRole(user.role || '');
            setUserName(user.nama || '');
        }
    }, []);

    const pathname = usePathname();

    // Close mobile sidebar when route changes
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const links = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Stok Barang', href: '/dashboard/inventory', icon: Package },
        ...(role === 'kasir' ? [{ name: 'Kasir', href: '/dashboard/cashier', icon: ShoppingCart }] : []),
        ...(role === 'admin' ? [
            { name: 'Laporan', href: '/dashboard/reports', icon: BarChart3 },
            { name: 'Kelola User', href: '/dashboard/users', icon: User }
        ] : []),
    ];

    const handleLogout = () => {
        Swal.fire({
            title: 'Konfirmasi Logout',
            text: 'Apakah Anda yakin ingin keluar dari aplikasi?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        });
    };

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="fixed left-0 right-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-4 shadow-md md:hidden">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="text-slate-300 hover:text-white"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="text-lg font-bold tracking-wider text-blue-400">WARDIG</span>
                </div>
                {/* User Greeting on Mobile Topbar */}
                {userName && (
                    <div 
                        onClick={() => window.dispatchEvent(new Event('openUserProfileModal'))}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <span className="text-xs font-semibold text-slate-300">Hallo, {userName}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                            <User size={16} className="text-slate-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-[#0F172A] text-white transition-all duration-300
                ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'} 
                md:relative md:translate-x-0 
                ${isCollapsed ? 'md:w-[80px]' : 'md:w-[260px]'} 
                md:rounded-2xl md:h-[calc(100vh-24px)] md:shadow-xl shrink-0
            `}>
                <div className={`flex items-center min-h-[80px] border-b border-white/5 ${isCollapsed ? 'md:justify-center' : 'justify-between px-6'}`}>
                    {(!isCollapsed || isMobileOpen) && (
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-wider text-blue-500">WARDIG</h1>
                            <span className="text-[10px] text-slate-400 font-medium tracking-[0.2em] uppercase">Warung Digital</span>
                        </div>
                    )}

                    {/* Desktop Collapse Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden rounded-lg p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors md:block"
                    >
                        {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="block rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors md:hidden"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 p-4">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                title={isCollapsed ? link.name : ''}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    } ${isCollapsed ? 'md:justify-center px-0' : ''}`}
                            >
                                <Icon size={20} />
                                {(!isCollapsed || isMobileOpen) && <span>{link.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/5 p-4">
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? 'Keluar' : ''}
                        className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed ? 'md:justify-center px-0' : ''}`}
                    >
                        <LogOut size={20} />
                        {(!isCollapsed || isMobileOpen) && <span>Keluar</span>}
                    </button>
                </div>
            </div>
        </>
    );
}
