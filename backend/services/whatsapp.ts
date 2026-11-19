/**
 * WhatsApp Gateway Service (Mock)
 * This module will be fully implemented when we build the WhatsApp Gateway module.
 * For now, it provides the interface needed by the Orders module.
 */

export const sendCustomerConfirmation = async (
  businessId: string,
  customerPhone: string,
  orderId: string,
  totalAmount: number
) => {
  // TODO: Integrate with WhatsApp Business API (e.g., Meta Graph API or Twilio)
  console.log(`[WhatsApp API] Sending Order Confirmation to ${customerPhone}`);
  console.log(`[WhatsApp API] Message: "Thank you for your order! Order ID: ${orderId}. Total: NAD ${totalAmount.toFixed(2)}. We will process it shortly."`);
  return true;
};

export const sendBusinessNotification = async (
  businessId: string,
  businessPhone: string,
  orderId: string,
  totalAmount: number
) => {
  // TODO: Integrate with WhatsApp Business API
  console.log(`[WhatsApp API] Sending New Order Alert to Business (${businessPhone})`);
  console.log(`[WhatsApp API] Message: "New Order Received! Order ID: ${orderId}. Total: NAD ${totalAmount.toFixed(2)}."`);
  return true;
};

export const sendPaymentSuccessNotification = async (
  businessId: string,
  customerPhone: string,
  orderId: string,
  amount: number,
  pointsEarned: number,
  newBalance: number
) => {
  console.log(`[WhatsApp API] Sending Payment Success to ${customerPhone}`);
  console.log(`[WhatsApp API] Message: "Payment of NAD ${amount.toFixed(2)} received for Order ${orderId}. You earned ${pointsEarned} points! Your new balance is ${newBalance} points. 🎉"`);
  return true;
};

export const sendRewardNotification = async (
  businessId: string,
  customerPhone: string,
  rewardDescription: string
) => {
  console.log(`[WhatsApp API] Sending Reward Alert to ${customerPhone}`);
  console.log(`[WhatsApp API] Message: "Congratulations! You just spun the wheel and won: ${rewardDescription} 🎁"`);
  return true;
};

export const sendMessage = async (
  to: string,
  text: string
) => {
  console.log(`[WhatsApp API] Sending Message to ${to}`);
  console.log(`[WhatsApp API] Message: "${text}"`);
  return true;
};
