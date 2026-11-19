"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
function authMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.BUSINESS_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
