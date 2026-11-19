"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
/**
 * GET /admin/report
 * Generates a comprehensive summary report for a specific business dashboard.
 *
 * Query Parameters:
 * - business_id (UUID): Required for multi-tenant isolation.
 * - from (YYYY-MM-DD): Start date for the report period.
 * - to (YYYY-MM-DD): End date for the report period.
 */
router.get('/report', async (req, res) => {
    const { business_id, from, to } = req.query;
    // 1. Validate Input Parameters
    if (!business_id || typeof business_id !== 'string') {
        res.status(400).json({ error: 'business_id query parameter is required.' });
        return;
    }
    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
        res.status(400).json({ error: 'Both "from" and "to" date parameters (YYYY-MM-DD) are required.' });
        return;
    }
    try {
        // Append time to ensure inclusive end-of-day querying for the 'to' date
        const fromDate = `${from} 00:00:00`;
        const toDate = `${to} 23:59:59`;
        // 2. Execute Queries Concurrently for Performance
        // We use Promise.all to run these independent read queries at the same time.
        const [summaryResult, rewardsResult, topProductsResult, lowStockResult] = await Promise.all([
            // Query A: Total Orders & Revenue (Only counting 'paid' orders)
            // COALESCE ensures we return 0 instead of NULL if there are no sales.
            db_1.pool.query(`SELECT 
           COUNT(id)::int as total_orders, 
           COALESCE(SUM(total_amount), 0)::numeric as total_revenue 
         FROM orders 
         WHERE business_id = $1 
           AND status = 'paid' 
           AND created_at >= $2::timestamp 
           AND created_at <= $3::timestamp`, [business_id, fromDate, toDate]),
            // Query B: Rewards Breakdown
            // Groups by reward_type to show how many times each reward was issued and its total value.
            db_1.pool.query(`SELECT 
           reward_type, 
           COUNT(id)::int as times_issued, 
           COALESCE(SUM(value), 0)::numeric as total_value_issued 
         FROM rewards 
         WHERE business_id = $1 
           AND created_at >= $2::timestamp 
           AND created_at <= $3::timestamp 
         GROUP BY reward_type`, [business_id, fromDate, toDate]),
            // Query C: Top Selling Products
            // Joins order_items with products to aggregate total quantity sold and revenue per product.
            db_1.pool.query(`SELECT 
           p.id, 
           p.name, 
           SUM(oi.quantity)::int as total_quantity_sold, 
           SUM(oi.subtotal)::numeric as total_revenue_generated 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.business_id = $1 
           AND oi.created_at >= $2::timestamp 
           AND oi.created_at <= $3::timestamp
         GROUP BY p.id, p.name
         ORDER BY total_quantity_sold DESC
         LIMIT 5`, [business_id, fromDate, toDate]),
            // Query D: Low Stock Alerts
            // Date range does not apply here; we want the *current* real-time stock levels.
            // Alerts for active products with 10 or fewer items in stock.
            db_1.pool.query(`SELECT 
           id, 
           name, 
           stock_quantity 
         FROM products 
         WHERE business_id = $1 
           AND is_active = true 
           AND stock_quantity <= 10
         ORDER BY stock_quantity ASC`, [business_id])
        ]);
        // 3. Format and Return the Response
        res.status(200).json({
            business_id,
            period: { from, to },
            summary: {
                total_orders: summaryResult.rows[0]?.total_orders || 0,
                total_revenue: parseFloat(summaryResult.rows[0]?.total_revenue || '0')
            },
            rewards_breakdown: rewardsResult.rows.map(row => ({
                type: row.reward_type,
                times_issued: row.times_issued,
                total_value: parseFloat(row.total_value_issued)
            })),
            top_selling_products: topProductsResult.rows.map(row => ({
                id: row.id,
                name: row.name,
                quantity_sold: row.total_quantity_sold,
                revenue: parseFloat(row.total_revenue_generated)
            })),
            low_stock_alerts: lowStockResult.rows
        });
    }
    catch (error) {
        console.error('Failed to generate admin report:', error);
        res.status(500).json({ error: 'Internal server error while generating report.' });
    }
});
exports.default = router;
