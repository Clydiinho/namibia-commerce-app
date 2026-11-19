"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const messenger_1 = require("../services/messenger");
const router = (0, express_1.Router)();
const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || 'verify_token';
const BUSINESS_ID = process.env.BUSINESS_ID || '';
/**
 * GET /webhook  (Messenger verification challenge)
 */
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Messenger] Webhook verified');
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});
/**
 * POST /webhook  (incoming messages)
 */
router.post('/webhook', async (req, res) => {
    const body = req.body;
    if (body.object !== 'page') {
        return res.sendStatus(404);
    }
    // Acknowledge quickly
    res.status(200).send('EVENT_RECEIVED');
    for (const entry of body.entry || []) {
        for (const event of entry.messaging || []) {
            const senderId = event.sender?.id;
            const text = event.message?.text?.trim();
            if (!senderId || !text)
                continue;
            try {
                await handleMessage(senderId, text);
            }
            catch (err) {
                console.error('[Messenger] Error handling message:', err);
            }
        }
    }
});
async function handleMessage(senderId, text) {
    const lower = text.toLowerCase();
    if (['hi', 'hello', 'hey', 'start', 'help'].includes(lower)) {
        await (0, messenger_1.sendMessengerMessage)(senderId, `Hi! 👋 I can check product availability and prices for you.\n\n` +
            `• Type a product name to check stock & price (e.g. "rice")\n` +
            `• Type "list" to see all products\n` +
            `• Type "help" anytime`);
        return;
    }
    if (lower === 'list') {
        const result = await db_1.pool.query(`SELECT name, price, stock_quantity, is_active FROM products
       WHERE business_id = $1 AND is_active = true ORDER BY name LIMIT 20`, [BUSINESS_ID]);
        if (result.rowCount === 0) {
            await (0, messenger_1.sendMessengerMessage)(senderId, 'No products are currently listed.');
            return;
        }
        const lines = result.rows.map((p) => `• ${p.name} — NAD ${Number(p.price).toFixed(2)} (${p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : 'OUT OF STOCK'})`);
        await (0, messenger_1.sendMessengerMessage)(senderId, `Available products:\n${lines.join('\n')}`);
        return;
    }
    // Product search
    const result = await db_1.pool.query(`SELECT name, price, stock_quantity, is_active FROM products
     WHERE business_id = $1 AND is_active = true AND name ILIKE $2
     ORDER BY name LIMIT 5`, [BUSINESS_ID, `%${text}%`]);
    if (result.rowCount === 0) {
        await (0, messenger_1.sendMessengerMessage)(senderId, `Sorry, I couldn't find "${text}". Try "list" to see all products.`);
        return;
    }
    const lines = result.rows.map((p) => {
        const stock = p.stock_quantity > 0
            ? `✅ In stock: ${p.stock_quantity} units`
            : '❌ Out of stock';
        return `${p.name}\n   Price: NAD ${Number(p.price).toFixed(2)}\n   ${stock}`;
    });
    await (0, messenger_1.sendMessengerMessage)(senderId, lines.join('\n\n'));
}
exports.default = router;
