import Sidebar from '@/components/Sidebar';
import UserProfileModal from '@/components/UserProfileModal';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden md:p-3 relative z-0">
            {/* Background Gradient Decorative Blobs */}
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-400/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-indigo-400/10 blur-[120px]" />
            </div>

            <Sidebar />
            <main className="flex-1 overflow-y-auto z-10 px-4 pb-4 pt-20 md:p-5 md:pl-2">
                <div className="mx-auto max-w-7xl animate-fade-in relative z-10">
                    {children}
                </div>
            </main>

            <UserProfileModal />
        </div>
    );
}
