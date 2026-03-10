import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period');

        // Common Data: Low Stock
        const { rows: lowStockRows } = await pool.query(
            `SELECT barang_id, nama_barang, stok, stok_minimum 
             FROM barang 
             WHERE stok <= stok_minimum AND is_deleted = 0
             ORDER BY stok ASC LIMIT 5`
        );

        const { rows: logs } = await pool.query(`
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

            // 1. Today's Sales
            const { rows: todaySales } = await pool.query(
                'SELECT SUM(total_harga) as total FROM transaksi WHERE DATE(tanggal_transaksi) = $1',
                [today]
            );

            // 1.5. Yesterday's Sales
            const { rows: yesterdaySales } = await pool.query(
                "SELECT SUM(total_harga) as total FROM transaksi WHERE DATE(tanggal_transaksi) = (CURRENT_DATE - INTERVAL '1 day')::date"
            );

            // 2. Month's Sales
            const { rows: monthSales } = await pool.query(
                "SELECT SUM(total_harga) as total FROM transaksi WHERE date_trunc('month', tanggal_transaksi) = date_trunc('month', CURRENT_DATE)"
            );

            // 2.5. Last Month's Sales
            const { rows: lastMonthSales } = await pool.query(
                "SELECT SUM(total_harga) as total FROM transaksi WHERE date_trunc('month', tanggal_transaksi) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')"
            );

            // 3. Today's Profit
            const { rows: profit } = await pool.query(`
                SELECT SUM((d.subtotal) - (COALESCE(d.harga_beli, b.harga_beli) * d.qty)) as profit 
                FROM detail_transaksi d 
                LEFT JOIN barang b ON d.barang_id = b.barang_id 
                JOIN transaksi t ON d.transaksi_id = t.transaksi_id 
                WHERE DATE(t.tanggal_transaksi) = $1`,
                [today]
            );

            // 3.5. Yesterday's Profit
            const { rows: yesterdayProfit } = await pool.query(`
                SELECT SUM((d.subtotal) - (COALESCE(d.harga_beli, b.harga_beli) * d.qty)) as profit 
                FROM detail_transaksi d 
                LEFT JOIN barang b ON d.barang_id = b.barang_id 
                JOIN transaksi t ON d.transaksi_id = t.transaksi_id 
                WHERE DATE(t.tanggal_transaksi) = (CURRENT_DATE - INTERVAL '1 day')::date`
            );

            // 4. Top 3 Products (Current Month)
            const { rows: topProducts } = await pool.query(`
                SELECT 
                    dt.barang_id, 
                    COALESCE(dt.nama_barang, b.nama_barang) as nama_barang,
                    MAX(b.gambar) as gambar,
                    MAX(dt.harga_satuan) as harga_satuan,
                    SUM(dt.qty) as total_qty,
                    SUM((dt.harga_satuan - COALESCE(dt.harga_beli, b.harga_beli)) * dt.qty) as total_profit
                FROM detail_transaksi dt
                JOIN transaksi t ON dt.transaksi_id = t.transaksi_id
                LEFT JOIN barang b ON dt.barang_id = b.barang_id
                WHERE date_trunc('month', t.tanggal_transaksi) = date_trunc('month', CURRENT_DATE)
                GROUP BY dt.barang_id, COALESCE(dt.nama_barang, b.nama_barang)
                ORDER BY total_qty DESC
                LIMIT 3
            `);

            // 5. Pembelian vs Penjualan (Current Month, grouped by day)
            // Penjualan = sum(total_harga) from transaksi
            // Pembelian = sum(jumlah * harga_beli) from stok_log where jenis='masuk' OR from direct barang check
            // For simplicity based on existing schema: We'll aggregate daily sales. 
            // We'll aggregate daily purchases from stok_log (jenis='masuk').
            const { rows: salesVsPurchase } = await pool.query(`
                WITH days AS (
                    SELECT generate_series(
                        date_trunc('month', CURRENT_DATE),
                        (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date,
                        '1 day'::interval
                    )::date as day
                ),
                daily_sales AS (
                    SELECT DATE(tanggal_transaksi) as d, SUM(total_harga) as sales
                    FROM transaksi
                    WHERE date_trunc('month', tanggal_transaksi) = date_trunc('month', CURRENT_DATE)
                    GROUP BY 1
                ),
                daily_purchase AS (
                    SELECT DATE(l.tanggal) as d, SUM(l.jumlah * COALESCE(b.harga_beli, 0)) as purchase
                    FROM stok_log l
                    LEFT JOIN barang b ON l.barang_id = b.barang_id
                    WHERE l.jenis = 'masuk' AND date_trunc('month', l.tanggal) = date_trunc('month', CURRENT_DATE)
                    GROUP BY 1
                )
                SELECT 
                    to_char(days.day, 'DD Mon') as date_label,
                    days.day,
                    COALESCE(s.sales, 0) as sales,
                    COALESCE(p.purchase, 0) as purchase
                FROM days
                LEFT JOIN daily_sales s ON days.day = s.d
                LEFT JOIN daily_purchase p ON days.day = p.d
                WHERE days.day <= CURRENT_DATE
                ORDER BY days.day
            `);

            // 6. Sales Overview (Yearly Comparison)
            const { rows: yearlyOverview } = await pool.query(`
                WITH months AS (
                    SELECT generate_series(
                        date_trunc('year', CURRENT_DATE),
                        date_trunc('year', CURRENT_DATE) + interval '11 months',
                        '1 month'::interval
                    )::date as month_start
                ),
                this_year AS (
                    SELECT date_trunc('month', tanggal_transaksi)::date as m, SUM(total_harga) as sales
                    FROM transaksi
                    WHERE EXTRACT(YEAR FROM tanggal_transaksi) = EXTRACT(YEAR FROM CURRENT_DATE)
                    GROUP BY 1
                ),
                last_year AS (
                    SELECT (date_trunc('month', tanggal_transaksi) + interval '1 year')::date as m, SUM(total_harga) as sales
                    FROM transaksi
                    WHERE EXTRACT(YEAR FROM tanggal_transaksi) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
                    GROUP BY 1
                )
                SELECT 
                    to_char(months.month_start, 'Mon') as month_label,
                    COALESCE(ty.sales, 0) as this_year,
                    COALESCE(ly.sales, 0) as last_year
                FROM months
                LEFT JOIN this_year ty ON months.month_start = ty.m
                LEFT JOIN last_year ly ON months.month_start = ly.m
                ORDER BY months.month_start
            `);

            return NextResponse.json({
                todaySales: todaySales[0].total || 0,
                yesterdaySales: yesterdaySales[0].total || 0,
                monthSales: monthSales[0].total || 0,
                lastMonthSales: lastMonthSales[0].total || 0,
                todayProfit: profit[0].profit || 0,
                yesterdayProfit: yesterdayProfit[0].profit || 0,
                lowStockItems: lowStockRows,
                stockLogs: logs,
                topProducts: topProducts,
                salesVsPurchase: salesVsPurchase,
                yearlyOverview: yearlyOverview
            });
        }

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // --- REPORTS PAGE MODE (With Period) ---
        let dateCondition = '';
        let prevDateCondition = '';
        const params: any[] = [];
        let paramIndex = 1;

        switch (period) {
            case 'daily':
                dateCondition = `DATE(tanggal_transaksi) = CURRENT_DATE`;
                prevDateCondition = `DATE(tanggal_transaksi) = (CURRENT_DATE - INTERVAL '1 day')::date`;
                break;
            case 'weekly':
                dateCondition = `EXTRACT(WEEK FROM tanggal_transaksi) = EXTRACT(WEEK FROM CURRENT_DATE) AND EXTRACT(YEAR FROM tanggal_transaksi) = EXTRACT(YEAR FROM CURRENT_DATE)`;
                prevDateCondition = `EXTRACT(WEEK FROM tanggal_transaksi) = EXTRACT(WEEK FROM CURRENT_DATE - INTERVAL '1 week') AND EXTRACT(YEAR FROM tanggal_transaksi) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 week')`;
                break;
            case 'monthly':
                dateCondition = `EXTRACT(MONTH FROM tanggal_transaksi) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM tanggal_transaksi) = EXTRACT(YEAR FROM CURRENT_DATE)`;
                prevDateCondition = `EXTRACT(MONTH FROM tanggal_transaksi) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND EXTRACT(YEAR FROM tanggal_transaksi) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')`;
                break;
            case 'custom':
                if (startDate && endDate) {
                    dateCondition = `DATE(tanggal_transaksi) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
                    
                    const startInfo = new Date(startDate);
                    const endInfo = new Date(endDate);
                    const diffDays = Math.ceil((endInfo.getTime() - startInfo.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    
                    prevDateCondition = `DATE(tanggal_transaksi) BETWEEN ($${paramIndex}::date - INTERVAL '${diffDays} days') AND ($${paramIndex + 1}::date - INTERVAL '${diffDays} days')`;
                    
                    params.push(startDate, endDate);
                    paramIndex += 2;
                } else {
                    dateCondition = `DATE(tanggal_transaksi) = CURRENT_DATE`;
                    prevDateCondition = `DATE(tanggal_transaksi) = (CURRENT_DATE - INTERVAL '1 day')::date`;
                }
                break;
            default:
                dateCondition = `DATE(tanggal_transaksi) = CURRENT_DATE`;
                prevDateCondition = `DATE(tanggal_transaksi) = (CURRENT_DATE - INTERVAL '1 day')::date`;
        }

        // Summary Stats based on period
        const { rows: statsRows } = await pool.query(`
            SELECT 
                COALESCE(SUM(total_harga), 0) as "totalSales",
                COUNT(transaksi_id) as "totalTransactions"
            FROM transaksi 
            WHERE ${dateCondition}
        `, params);

        // Profit based on period
        const { rows: profitRows } = await pool.query(`
            SELECT 
                COALESCE(SUM((dt.harga_satuan - COALESCE(dt.harga_beli, b.harga_beli)) * dt.qty), 0) as "totalProfit"
            FROM detail_transaksi dt
            JOIN transaksi t ON dt.transaksi_id = t.transaksi_id
            LEFT JOIN barang b ON dt.barang_id = b.barang_id
            WHERE ${dateCondition.replace(/tanggal_transaksi/g, 't.tanggal_transaksi')}
        `, params);

        // Summary Stats based on period (Previous)
        const { rows: prevStatsRows } = await pool.query(`
            SELECT 
                COALESCE(SUM(total_harga), 0) as "totalSales",
                COUNT(transaksi_id) as "totalTransactions"
            FROM transaksi 
            WHERE ${prevDateCondition}
        `, params);

        // Profit based on period (Previous)
        const { rows: prevProfitRows } = await pool.query(`
            SELECT 
                COALESCE(SUM((dt.harga_satuan - COALESCE(dt.harga_beli, b.harga_beli)) * dt.qty), 0) as "totalProfit"
            FROM detail_transaksi dt
            JOIN transaksi t ON dt.transaksi_id = t.transaksi_id
            LEFT JOIN barang b ON dt.barang_id = b.barang_id
            WHERE ${prevDateCondition.replace(/tanggal_transaksi/g, 't.tanggal_transaksi')}
        `, params);

        // Transaction List (Headers)
        const { rows: transactions } = await pool.query(`
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
        `, params);

        if (transactions.length > 0) {
            const transactionIds = transactions.map((t: any) => t.transaksi_id);

            // Postgres supports ANY() for array comparison which is cleaner, but IN (...) works if stringified.
            // Using ANY($1::int[]) is better but string injection is easier to port from existing code for now.
            // Let's use IN with parameter generation for safety or just dynamic string if array is small.
            // For now, simpler to just use dynamic string as before but verify ids are numbers.

            const { rows: details } = await pool.query(`
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
            transactions.forEach((t: any) => t.items = []);
        }

        return NextResponse.json({
            summary: {
                period,
                totalSales: statsRows[0].totalSales,
                totalTransactions: statsRows[0].totalTransactions,
                totalProfit: profitRows[0].totalProfit,
                prevTotalSales: prevStatsRows[0].totalSales,
                prevTotalTransactions: prevStatsRows[0].totalTransactions,
                prevTotalProfit: prevProfitRows[0].totalProfit
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
