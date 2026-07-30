/**
 * Cloud Run server: static site + /api/contact
 * Forwards inquiries (with optional file) to Google Apps Script → Gmail.
 * Browser talks same-origin only — no CORS with script.google.com.
 */
const path = require("path");
const express = require("express");
const multer = require("multer");

const PORT = Number(process.env.PORT || 8080);
const APPS_SCRIPT_URL =
  process.env.APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbz_g_l4qRYuCLZokUulYcVVktgdBxspoq0eASGIufhQJsmXEwsTLliBMuy0l_iBFBIx/exec";
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      cb(new Error("Непозволен тип файл"));
      return;
    }
    cb(null, true);
  },
});

const app = express();
const root = __dirname;

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/api/contact", (req, res) => {
  upload.single("attachment")(req, res, async (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Файлът е твърде голям. Максимум 4 MB."
          : err.message || "Невалиден файл";
      res.status(400).json({ success: false, message });
      return;
    }

    try {
      const name = String(req.body.name || "").trim();
      const phone = String(req.body.phone || "").trim();
      const email = String(req.body.email || "").trim();
      const message = String(req.body.message || "").trim();

      if (name.length < 2 || phone.length < 8 || !email || message.length < 3) {
        res.status(400).json({ success: false, message: "Невалидни полета" });
        return;
      }

      const payload = { name, phone, email, message };

      if (req.file) {
        payload.attachment = req.file.buffer.toString("base64");
        payload.attachmentName = req.file.originalname || "attachment";
        payload.attachmentType = req.file.mimetype || "application/octet-stream";
      }

      const scriptRes = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      const text = await scriptRes.text();
      let result = {};
      try {
        result = JSON.parse(text);
      } catch {
        result = {};
      }

      if (!scriptRes.ok || result.success === false) {
        console.error("Apps Script mail failed", scriptRes.status, text.slice(0, 500));
        res.status(502).json({
          success: false,
          message: result.message || "Изпращането не успя",
        });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Contact API error", error);
      res.status(500).json({ success: false, message: "Сървърна грешка" });
    }
  });
});

// HTML — no cache so form/JS updates apply immediately
app.get(["/", "/index.html"], (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(root, "index.html"));
});

app.get(["/otkrivane-na-techove", "/otkrivane-na-techove/"], (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(root, "otkrivane-na-techove", "index.html"));
});

app.use(
  express.static(root, {
    index: false,
    maxAge: "7d",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  })
);

app.use((_req, res) => {
  res.status(404).send("Not found");
});

app.listen(PORT, () => {
  console.log(`hydro-inspect listening on ${PORT}`);
});
