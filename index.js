import express from "express";
import multer  from "multer";
import fs      from "fs/promises";
import path    from "path";
import cors    from "cors";
import "dotenv/config";              // lee .env

const app  = express();
const port = process.env.PORT || 3000;
const UPLOAD_DIR  = "public/images";   // se sirve estático
const DATA_FILE   = "server/data/content.json";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// ─── middlewares ──────────────────────────────────────────────────────
app.use(cors());                    // * Permite peticiones CORS simples *
app.use(express.json({limit:"6mb"}));
app.use(express.static("public")); // sirve index.html, imágenes, css…
const upload = multer({ dest: "tmp/" });

function auth(req, res, next) {
  if (req.headers["x-admin-token"] !== ADMIN_TOKEN) return res.sendStatus(401);
  next();
}

// ─── helpers ──────────────────────────────────────────────────────────
async function ensureDataFile() {
  try { await fs.access(DATA_FILE); }
  catch { await fs.mkdir(path.dirname(DATA_FILE), {recursive:true}); await fs.writeFile(DATA_FILE, "{}\n"); }
}

// ─── rutas ────────────────────────────────────────────────────────────
app.get("/api/content", async (_, res) => {
  await ensureDataFile();
  res.sendFile(path.resolve(DATA_FILE));
});
app.get("/api/ping", auth, (_, res) => res.sendStatus(200));
app.listen(port, () => console.log(`API en http://localhost:${port}`));
app.put("/api/content", auth, async (req, res) => {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.sendStatus(204);
});

app.post("/api/image", auth, upload.single("file"), async (req, res) => {
  const tmpPath = req.file.path;
  const ext     = path.extname(req.file.originalname) || ".jpg";
  const final   = `${Date.now()}${ext}`;
  const dest    = path.join(UPLOAD_DIR, final);
  await fs.mkdir(UPLOAD_DIR, {recursive:true});
  await fs.rename(tmpPath, dest);
  res.json({ url: `/images/${final}` });
});

app.listen(port, () => console.log(`API en http://localhost:${port}`));