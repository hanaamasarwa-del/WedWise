const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const submissionsRouter = require("./routes/submissions");
const aiReportRouter = require("./routes/ai-report");
const imageRouter = require("./routes/image");
const suppliersRouter = require("./routes/suppliers");
const leadsRouter = require("./routes/leads");
const telegramLeadRouter = require("./routes/telegram-lead");
const chatRouter = require("./routes/chat");
const blessingRouter = require("./routes/blessing");
const countdownDesignRouter = require("./routes/countdown-design");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "64kb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "WedWise backend is running" });
});

// Routes
app.use("/api/submissions", submissionsRouter);
app.use("/api", aiReportRouter);
app.use("/api", imageRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/telegram-lead", telegramLeadRouter);
app.use("/api/chat", chatRouter);
app.use("/api", blessingRouter);
app.use("/api", countdownDesignRouter);

const frontendDirectory = path.resolve(__dirname, "..", "frontend");
app.use(express.static(frontendDirectory));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(path.join(frontendDirectory, "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`WedWise backend running on http://localhost:${PORT}`);
});
