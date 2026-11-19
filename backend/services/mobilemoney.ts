/**
 * Mobile Money Service (MTC MobileMoney & TN Mobile)
 * Abstraction layer for Namibian mobile money providers.
 */

export type MobileMoneyProvider = 'MTC_Money' | 'TN_Mobile';

/**
 * Initiates a payment request (USSD Push / STK Push) to the customer's phone.
 * 
 * @param phoneNumber The customer's mobile number (e.g., +26481...)
 * @param amount The amount to charge in NAD
 * @param provider The mobile network operator
 * @returns A promise that resolves to the provider's transaction reference ID
 */
export const requestPayment = async (
  phoneNumber: string,
  amount: number,
  provider: MobileMoneyProvider
): Promise<string> => {
  console.log(`[Mobile Money API] Initiating ${provider} payment request...`);
  console.log(`[Mobile Money API] Phone: ${phoneNumber}, Amount: NAD ${amount.toFixed(2)}`);
  
  // TODO: Implement actual HTTP calls to MTC or Telecom Namibia APIs here.
  // For now, we simulate a successful API request and return a mock reference.
  
  const timestamp = Date.now();
  const prefix = provider === 'MTC_Money' ? 'MTC' : 'TNM';
  const mockReference = `${prefix}-${timestamp}-${Math.floor(Math.random() * 1000)}`;
  
  console.log(`[Mobile Money API] Request successful. Reference: ${mockReference}`);
  
  return mockReference;
};
