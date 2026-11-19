import 'dotenv/config';
import express from "express";
import path from "path";

// Import our API routes
import ordersRouter from "./routes/orders";
import paymentsRouter from "./routes/payments";
import whatsappRouter from "./routes/whatsapp";
import adminRouter from "./routes/admin";
import inventoryRouter from "./routes/inventory";
import rewardsRouter from "./routes/rewards_api";
import messengerRouter from "./routes/messenger";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Middleware to parse JSON bodies (essential for webhooks and API requests)
  app.use(express.json());

  // Health Check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Namibia Commerce API is running" });
  });

  // Mount the modules
  app.use("/api/orders", ordersRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/whatsapp", whatsappRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/rewards", rewardsRouter);

  // Facebook Messenger webhook (no /api prefix — Meta calls the URL you configure)
  app.use("/messenger", messengerRouter);

  // Production static file serving (frontend build, if present)
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/{*splat}", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
