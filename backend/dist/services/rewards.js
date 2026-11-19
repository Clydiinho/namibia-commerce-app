"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerReward = exports.spinWheel = void 0;
const db_1 = require("../db");
const whatsapp_1 = require("./whatsapp");
/**
 * Simulates an airtime disbursement via MTC or TN Mobile APIs.
 *
 * @param phoneNumber The customer's mobile number
 * @param amount The amount of airtime to disburse in NAD
 */
const disburseAirtime = async (phoneNumber, amount) => {
    console.log(`[Airtime API] Disbursing NAD ${amount} airtime to ${phoneNumber}...`);
    // TODO: Integrate with actual Namibian airtime API (e.g., DPO, MTC direct, etc.)
    console.log(`[Airtime API] Success! Airtime sent.`);
};
/**
 * Spins the gamified reward wheel.
 * It uses a weighted random selection to guarantee a win, keeping it legal-safe
 * and engaging for the customer.
 *
 * Weights:
 * - 50%: 20 Bonus Points
 * - 30%: 10% Next-Order Discount
 * - 15%: Free Item (e.g., Sample)
 * - 5%: NAD 10 Airtime
 *
 * @param orderAmount The total amount of the order (can be used to scale rewards later)
 * @returns The selected reward outcome
 */
const spinWheel = (orderAmount) => {
    const rand = Math.random() * 100;
    if (rand < 50) {
        return { type: 'points', value: 20, description: '20 Bonus Loyalty Points' };
    }
    else if (rand < 80) {
        return { type: 'discount', value: 10, description: '10% Discount on your next order' };
    }
    else if (rand < 95) {
        return { type: 'free_item', value: 1, description: 'Free Kapana Spice Sample' };
    }
    else {
        return { type: 'airtime', value: 10, description: 'NAD 10 Mobile Airtime' };
    }
};
exports.spinWheel = spinWheel;
/**
 * Triggers the reward process after a successful order/payment.
 *
 * 1. Spins the wheel to determine the prize.
 * 2. Saves the reward to the database ledger.
 * 3. Updates customer points (if the prize was points).
 * 4. Disburses airtime (if the prize was airtime).
 * 5. Sends a WhatsApp notification to the customer.
 */
const triggerReward = async ({ orderId, customerId, businessId, orderAmount }) => {
    const client = await db_1.pool.connect();
    try {
        // 1. Fetch customer details (needed for notifications and airtime)
        const customerResult = await client.query(`SELECT phone_number FROM customers WHERE id = $1 AND business_id = $2`, [customerId, businessId]);
        if (customerResult.rowCount === 0) {
            throw new Error('Customer not found or does not belong to this business.');
        }
        const customerPhone = customerResult.rows[0].phone_number;
        // 2. Spin the wheel to determine the guaranteed-win reward
        const reward = (0, exports.spinWheel)(orderAmount);
        // Begin transaction for database updates
        await client.query('BEGIN');
        // 3. Save the reward to the database ledger
        // Map our internal RewardType to the DB's expected reward_type strings
        let dbRewardType = 'points_earned';
        if (reward.type === 'discount')
            dbRewardType = 'discount';
        if (reward.type === 'free_item')
            dbRewardType = 'free_item';
        if (reward.type === 'airtime')
            dbRewardType = 'airtime';
        await client.query(`INSERT INTO rewards (business_id, customer_id, reward_type, value, description)
       VALUES ($1, $2, $3, $4, $5)`, [businessId, customerId, dbRewardType, reward.value, reward.description]);
        // 4. Update customer points if the reward was points
        if (reward.type === 'points') {
            await client.query(`UPDATE customers 
         SET points_balance = points_balance + $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`, [reward.value, customerId]);
        }
        // Commit the database changes
        await client.query('COMMIT');
        // 5. Optionally trigger airtime disbursement
        if (reward.type === 'airtime') {
            // Fire and forget airtime API call so it doesn't block the response
            disburseAirtime(customerPhone, reward.value).catch(console.error);
        }
        // 6. Send WhatsApp Notification
        // Fire and forget WhatsApp API call
        (0, whatsapp_1.sendRewardNotification)(businessId, customerPhone, reward.description).catch(console.error);
        return reward;
    }
    catch (error) {
        // Rollback if any database operation fails
        await client.query('ROLLBACK');
        console.error('Failed to trigger reward:', error);
        return null;
    }
    finally {
        client.release();
    }
};
exports.triggerReward = triggerReward;
