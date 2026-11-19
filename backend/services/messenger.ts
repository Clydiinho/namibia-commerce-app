import axios from 'axios';

const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN || '';
const GRAPH_VERSION = process.env.MESSENGER_GRAPH_VERSION || 'v19.0';

/**
 * Sends a text message back to a Messenger user.
 */
export const sendMessengerMessage = async (recipientId: string, text: string): Promise<void> => {
  if (!PAGE_ACCESS_TOKEN) {
    console.warn('[Messenger] No PAGE_ACCESS_TOKEN set; skipping send. Message:', text);
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text },
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN },
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[Messenger] Failed to send message:', err?.response?.data || err.message);
  }
};
