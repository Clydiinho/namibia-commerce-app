"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessengerMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN || '';
const GRAPH_VERSION = process.env.MESSENGER_GRAPH_VERSION || 'v19.0';
/**
 * Sends a text message back to a Messenger user.
 */
const sendMessengerMessage = async (recipientId, text) => {
    if (!PAGE_ACCESS_TOKEN) {
        console.warn('[Messenger] No PAGE_ACCESS_TOKEN set; skipping send. Message:', text);
        return;
    }
    try {
        await axios_1.default.post(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages`, {
            recipient: { id: recipientId },
            message: { text },
        }, {
            params: { access_token: PAGE_ACCESS_TOKEN },
            headers: { 'Content-Type': 'application/json' },
        });
    }
    catch (err) {
        console.error('[Messenger] Failed to send message:', err?.response?.data || err.message);
    }
};
exports.sendMessengerMessage = sendMessengerMessage;
