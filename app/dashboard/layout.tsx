import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-4 pb-4 pt-20 md:p-8">
                <div className="mx-auto max-w-7xl animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
