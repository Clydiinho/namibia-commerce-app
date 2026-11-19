"use strict";
/**
 * WhatsApp Gateway Service (Mock)
 * This module will be fully implemented when we build the WhatsApp Gateway module.
 * For now, it provides the interface needed by the Orders module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.sendRewardNotification = exports.sendPaymentSuccessNotification = exports.sendBusinessNotification = exports.sendCustomerConfirmation = void 0;
const sendCustomerConfirmation = async (businessId, customerPhone, orderId, totalAmount) => {
    // TODO: Integrate with WhatsApp Business API (e.g., Meta Graph API or Twilio)
    console.log(`[WhatsApp API] Sending Order Confirmation to ${customerPhone}`);
    console.log(`[WhatsApp API] Message: "Thank you for your order! Order ID: ${orderId}. Total: NAD ${totalAmount.toFixed(2)}. We will process it shortly."`);
    return true;
};
exports.sendCustomerConfirmation = sendCustomerConfirmation;
const sendBusinessNotification = async (businessId, businessPhone, orderId, totalAmount) => {
    // TODO: Integrate with WhatsApp Business API
    console.log(`[WhatsApp API] Sending New Order Alert to Business (${businessPhone})`);
    console.log(`[WhatsApp API] Message: "New Order Received! Order ID: ${orderId}. Total: NAD ${totalAmount.toFixed(2)}."`);
    return true;
};
exports.sendBusinessNotification = sendBusinessNotification;
const sendPaymentSuccessNotification = async (businessId, customerPhone, orderId, amount, pointsEarned, newBalance) => {
    console.log(`[WhatsApp API] Sending Payment Success to ${customerPhone}`);
    console.log(`[WhatsApp API] Message: "Payment of NAD ${amount.toFixed(2)} received for Order ${orderId}. You earned ${pointsEarned} points! Your new balance is ${newBalance} points. 🎉"`);
    return true;
};
exports.sendPaymentSuccessNotification = sendPaymentSuccessNotification;
const sendRewardNotification = async (businessId, customerPhone, rewardDescription) => {
    console.log(`[WhatsApp API] Sending Reward Alert to ${customerPhone}`);
    console.log(`[WhatsApp API] Message: "Congratulations! You just spun the wheel and won: ${rewardDescription} 🎁"`);
    return true;
};
exports.sendRewardNotification = sendRewardNotification;
const sendMessage = async (to, text) => {
    console.log(`[WhatsApp API] Sending Message to ${to}`);
    console.log(`[WhatsApp API] Message: "${text}"`);
    return true;
};
exports.sendMessage = sendMessage;
