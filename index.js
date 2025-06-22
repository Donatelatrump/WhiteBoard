/* ───────── anthony-daycare  API  (sin autenticación) ───────── */
import express from "express";
import multer   from "multer";
import fs       from "fs/promises";
import path     from "path";
import cors     from "cors";
import "dotenv/config";                      // lee .env (ya no usa ADMIN_TOKEN)

const app  = express();
const port = process.env.PORT || 3000;

const UPLOAD_DIR = "public/images";          // carpeta servida estáticamente
const DATA_FILE  = "server/data/content.json";

// ───────── middlewares ─────────────────────────────────────────
app.use(cors());                             // CORS abierto a cualquier origen
app.use(express.json({ limit: "6mb" }));
app.use(express.static("public"));           // index.html, css, imágenes…
const upload = multer({ dest: "tmp/" });

// ───────── helper: crea data/content.json si no existe ─────────
async function ensureDataFile() {
  try { await fs.access(DATA_FILE); }
  catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, "{}\n");
  }
}

// ───────── rutas públicas (sin token) ──────────────────────────
app.get("/api/content", async (_, res) => {
  await ensureDataFile();
  res.sendFile(path.resolve(DATA_FILE));
});

app.put("/api/content", async (req, res) => {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.sendStatus(204);
});

app.post("/api/image", upload.single("file"), async (req, res) => {
  const tmpPath = req.file.path;
  const ext     = path.extname(req.file.originalname) || ".jpg";
  const final   = `${Date.now()}${ext}`;
  const dest    = path.join(UPLOAD_DIR, final);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.rename(tmpPath, dest);

  res.json({ url: `/images/${final}` });
});

/* endpoint de health-check para Render */
app.get("/health", (_, res) => res.sendStatus(200));

app.listen(port, () =>
  console.log(`API en http://localhost:${port}   (sin autenticación)`));
