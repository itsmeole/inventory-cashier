import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Generate page numbers to show: always show first, last, current ±1
    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        const delta = 1;

        const range: number[] = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) pages.push(1, '...');
        else pages.push(1);

        pages.push(...range);

        if (currentPage + delta < totalPages - 1) pages.push('...', totalPages);
        else if (totalPages > 1) pages.push(totalPages);

        return pages;
    };

    const from = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
    const to = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
            {/* Info text */}
            <p className="text-xs text-slate-500">
                {from && to && totalItems
                    ? `Menampilkan ${from}–${to} dari ${totalItems} data`
                    : `Halaman ${currentPage} dari ${totalPages}`
                }
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman sebelumnya"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page as number)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman berikutnya"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
