import { useState, useMemo } from 'react';

/**
 * Custom hook untuk pagination client-side.
 * @param data - Array data lengkap
 * @param itemsPerPage - Jumlah item per halaman (default 10)
 */
export function usePagination<T>(data: T[], itemsPerPage: number = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

    // Reset ke halaman 1 jika data berubah (misalnya setelah search)
    useMemo(() => {
        setCurrentPage(1);
    }, [data.length]);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return data.slice(start, start + itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    };

    return { currentItems, currentPage, totalPages, goToPage };
}
