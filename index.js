/* ───────── multi-daycare API (sin autenticación) ───────── */
import express from "express";
import multer   from "multer";
import fs       from "fs/promises";
import path     from "path";
import cors     from "cors";
import "dotenv/config";

const app  = express();
const port = process.env.PORT || 3000;

/* ───── Config ───── */
const DATA_DIR    = "server/data";
const IMG_ROOT    = "public/images";
const ALLOWED_SITES = ["anthony", "mamitas"];   // ← añade aquí más sitios

/* ───── Middlewares ───── */
app.use(cors({ origin:"*", methods:["GET","POST","PUT","OPTIONS"],
               allowedHeaders:["Content-Type"] }));
app.use(express.json({ limit:"20mb" }));
app.use(express.static("public"));

/* multer: destino temporal (luego movemos nosotros) */
const upload = multer({ dest:"tmp/" });

/* ───── Helpers ───── */
function validSite(site){ return ALLOWED_SITES.includes(site); }

async function ensureDataFile(site){
  const file = `${DATA_DIR}/${site}.json`;
  try{ await fs.access(file); }
  catch{
    await fs.mkdir(DATA_DIR,{ recursive:true });
    await fs.writeFile(file,"{}\n");
  }
  return file;
}

/* carpeta imágenes de cada sitio */
async function siteImageDir(site){
  const dir = `${IMG_ROOT}/${site}`;
  await fs.mkdir(dir,{ recursive:true });
  return dir;
}

/* ───── Rutas con nombre de sitio ───── */

/* 1. Obtener contenido */
app.get("/api/:site/content", async (req,res)=>{
  const { site } = req.params;
  if(!validSite(site)) return res.sendStatus(404);

  const file = await ensureDataFile(site);
  res.sendFile(path.resolve(file));
});

/* 2. Guardar contenido */
app.put("/api/:site/content", async (req,res)=>{
  const { site } = req.params;
  if(!validSite(site)) return res.sendStatus(404);

  const file = await ensureDataFile(site);
  await fs.writeFile(file, JSON.stringify(req.body,null,2));
  res.sendStatus(204);
});

/* 3. Subir imagen */
app.post("/api/:site/image", upload.single("file"), async (req,res)=>{
  const { site } = req.params;
  if(!validSite(site)) return res.sendStatus(404);

  const dstDir   = await siteImageDir(site);
  const ext      = path.extname(req.file.originalname) || ".jpg";
  const filename = `${Date.now()}${ext}`;
  const final    = path.join(dstDir, filename);

  await fs.rename(req.file.path, final);
  res.json({ url:`/images/${site}/${filename}` });
});

/* ───── Endpoints “legacy” (compatibilidad) ─────
   -> siguen usando el sitio por defecto: anthony          */
app.get ("/api/content",      (_,res)=> res.redirect("/api/anthony/content"));
app.put ("/api/content",      (_,res)=> res.redirect(307,"/api/anthony/content"));
app.post("/api/image", upload.single("file"),
                                  (_,res)=> res.redirect(307,"/api/anthony/image"));

/* health-check para Render */
app.get("/health", (_,res)=>res.sendStatus(200));

app.listen(port, ()=> console.log(`API listening on ${port}`));
