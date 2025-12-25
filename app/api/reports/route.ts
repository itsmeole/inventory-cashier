import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period');

        // Common Data: Low Stock        // 5. Get items with low stock (excluding deleted items)
        const [lowStockRows] = await pool.query<RowDataPacket[]>(
            `SELECT barang_id, nama_barang, stok, stok_minimum 
             FROM barang 
             WHERE stok <= stok_minimum AND is_deleted = 0
             ORDER BY stok ASC LIMIT 5`
        );

        const [logs] = await pool.query<RowDataPacket[]>(`
            SELECT 
                l.log_id, l.jenis, l.jumlah, l.tanggal, 
                COALESCE(l.nama_barang, b.nama_barang, 'Item Terhapus') as nama_barang,
                u.nama as user_nama,
                b.harga_jual, b.harga_beli
            FROM stok_log l 
            LEFT JOIN barang b ON l.barang_id = b.barang_id
            LEFT JOIN users u ON l.user_id = u.user_id
            ORDER BY l.tanggal DESC
            LIMIT 10
        `);

        // --- DASHBOARD MODE (No Period Selected) ---
        if (!period) {
            const today = new Date().toISOString().slice(0, 10);
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

            // 1. Today's Sales
            const [todaySales] = await pool.query<RowDataPacket[]>(
                'SELECT SUM(total_harga) as total FROM transaksi WHERE DATE(tanggal_transaksi) = ?',
                [today]
            );

            // 2. Month's Sales
            const [monthSales] = await pool.query<RowDataPacket[]>(
                'SELECT SUM(total_harga) as total FROM transaksi WHERE DATE(tanggal_transaksi) >= ?',
                [firstDayOfMonth]
            );

            // 3. Today's Profit (Use Snapshot harga_beli if available)
            const [profit] = await pool.query<RowDataPacket[]>(`
                SELECT SUM((d.subtotal) - (COALESCE(d.harga_beli, b.harga_beli) * d.qty)) as profit 
                FROM detail_transaksi d 
                LEFT JOIN barang b ON d.barang_id = b.barang_id 
                JOIN transaksi t ON d.transaksi_id = t.transaksi_id 
                WHERE DATE(t.tanggal_transaksi) = ?`,
                [today]
            );

            return NextResponse.json({
                todaySales: todaySales[0].total || 0,
                monthSales: monthSales[0].total || 0,
                todayProfit: profit[0].profit || 0,
                lowStockItems: lowStockRows,
                stockLogs: logs
            });
        }

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // --- REPORTS PAGE MODE (With Period) ---
        let dateCondition = '';
        switch (period) {
            case 'daily':
                dateCondition = 'DATE(tanggal_transaksi) = CURDATE()';
                break;
            case 'weekly':
                dateCondition = 'YEARWEEK(tanggal_transaksi, 1) = YEARWEEK(CURDATE(), 1)';
                break;
            case 'monthly':
                dateCondition = 'MONTH(tanggal_transaksi) = MONTH(CURDATE()) AND YEAR(tanggal_transaksi) = YEAR(CURDATE())';
                break;
            case 'custom':
                if (startDate && endDate) {
                    dateCondition = `DATE(tanggal_transaksi) BETWEEN '${startDate}' AND '${endDate}'`;
                } else {
                    dateCondition = 'DATE(tanggal_transaksi) = CURDATE()'; // Fallback
                }
                break;
            default:
                dateCondition = 'DATE(tanggal_transaksi) = CURDATE()';
        }

        // Summary Stats based on period
        const [statsRows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                COALESCE(SUM(total_harga), 0) as totalSales,
                COUNT(transaksi_id) as totalTransactions
            FROM transaksi 
            WHERE ${dateCondition}
        `);

        // Profit based on period (Use Snapshot)
        const [profitRows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                COALESCE(SUM((dt.harga_satuan - COALESCE(dt.harga_beli, b.harga_beli)) * dt.qty), 0) as totalProfit
            FROM detail_transaksi dt
            JOIN transaksi t ON dt.transaksi_id = t.transaksi_id
            LEFT JOIN barang b ON dt.barang_id = b.barang_id
            WHERE ${dateCondition.replace(/tanggal_transaksi/g, 't.tanggal_transaksi')}
        `);

        // Transaction List (Headers)
        const [transactions] = await pool.query<RowDataPacket[]>(`
            SELECT 
                t.transaksi_id, 
                t.tanggal_transaksi, 
                t.total_harga, 
                t.metode_pembayaran,
                u.nama as kasir_nama
            FROM transaksi t
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE ${dateCondition.replace(/tanggal_transaksi/g, 't.tanggal_transaksi')}
            ORDER BY t.tanggal_transaksi DESC
        `);

        // Fetch items for these transactions manually (since JSON_ARRAYAGG is not supported on older MySQL)
        if (transactions.length > 0) {
            const transactionIds = transactions.map((t: any) => t.transaksi_id);

            const [details] = await pool.query<RowDataPacket[]>(`
                SELECT 
                    dt.transaksi_id,
                    COALESCE(dt.nama_barang, b.nama_barang, 'Item Terhapus') as nama_barang,
                    dt.qty,
                    dt.harga_satuan as harga,
                    dt.subtotal
                FROM detail_transaksi dt
                LEFT JOIN barang b ON dt.barang_id = b.barang_id
                WHERE dt.transaksi_id IN (${transactionIds.join(',')})
            `);

            // Attach items to transactions
            transactions.forEach((t: any) => {
                const relatedItems = details.filter((d: any) => d.transaksi_id === t.transaksi_id);
                t.items = relatedItems.map((item: any) => ({
                    nama_barang: item.nama_barang || 'Item Terhapus',
                    qty: item.qty,
                    harga: item.harga,
                    subtotal: item.subtotal
                }));
            });
        } else {
            // Ensure items is an empty array if no transactions
            transactions.forEach((t: any) => t.items = []);
        }

        return NextResponse.json({
            summary: {
                period,
                totalSales: statsRows[0].totalSales,
                totalTransactions: statsRows[0].totalTransactions,
                totalProfit: profitRows[0].totalProfit
            },
            transactions,
            lowStockItems: lowStockRows,
            stockLogs: logs
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}
