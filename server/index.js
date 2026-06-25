require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const submissionsRouter = require("./routes/submissions");
const aiReportRouter = require("./routes/aiReport");
const imageRouter = require("./routes/image");
const suppliersRouter = require("./routes/suppliers");
const leadsRouter = require("./routes/leads");
const telegramLeadRouter = require("./routes/telegramLead");

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
