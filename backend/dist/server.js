"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
// Import our API routes
const orders_1 = __importDefault(require("./routes/orders"));
const payments_1 = __importDefault(require("./routes/payments"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const admin_1 = __importDefault(require("./routes/admin"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const rewards_api_1 = __importDefault(require("./routes/rewards_api"));
const messenger_1 = __importDefault(require("./routes/messenger"));
async function startServer() {
    const app = (0, express_1.default)();
    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
    // Middleware to parse JSON bodies (essential for webhooks and API requests)
    app.use(express_1.default.json());
    // Health Check API
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", message: "Namibia Commerce API is running" });
    });
    // Mount the modules
    app.use("/api/orders", orders_1.default);
    app.use("/api/payments", payments_1.default);
    app.use("/api/whatsapp", whatsapp_1.default);
    app.use("/api/admin", admin_1.default);
    app.use("/api/inventory", inventory_1.default);
    app.use("/api/rewards", rewards_api_1.default);
    // Facebook Messenger webhook (no /api prefix — Meta calls the URL you configure)
    app.use("/messenger", messenger_1.default);
    // Production static file serving (frontend build, if present)
    if (process.env.NODE_ENV === "production") {
        const distPath = path_1.default.join(process.cwd(), "dist");
        app.use(express_1.default.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path_1.default.join(distPath, "index.html"));
        });
    }
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
startServer();
