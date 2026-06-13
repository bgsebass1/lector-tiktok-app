/**
 * Punto de entrada del backend.
 *
 * Levanta un servidor Express con CORS habilitado, inicializa la base de datos
 * SQLite y monta las tres familias de rutas: libros, ideas (Grok) y tiktok.
 */
import "dotenv/config"; // carga las variables de backend/.env
import express from "express";
import cors from "cors";

import { initDb } from "./db.js";
import { booksRouter } from "./routes/books.js";
import { grokRouter } from "./routes/grok.js";
import { tiktokRouter } from "./routes/tiktok.js";
import { scriptsRouter } from "./routes/scripts.js";
import { studioRouter } from "./routes/studio.js";
import { quotesRouter } from "./routes/quotes.js";
import { wordsRouter } from "./routes/words.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { seriesRouter } from "./routes/series.js";
import { inspirationRouter } from "./routes/inspiration.js";
import { backupRouter } from "./routes/backup.js";
import { searchRouter } from "./routes/search.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// Middlewares globales.
app.use(cors()); // permite que el frontend (otro puerto) consuma la API
app.use(express.json({ limit: "25mb" })); // JSON en req.body (límite alto para restaurar backups)

// Creamos las tablas si no existen.
initDb();

// Endpoint de salud, útil para comprobar que el servidor está vivo.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Rutas de la aplicación.
app.use("/api/books", booksRouter);
app.use("/api/grok", grokRouter);
app.use("/api/tiktok", tiktokRouter);
app.use("/api/scripts", scriptsRouter);
app.use("/api/studio", studioRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/words", wordsRouter);
app.use("/api/pipeline", pipelineRouter);
app.use("/api/series", seriesRouter);
app.use("/api/inspiration", inspirationRouter);
app.use("/api", backupRouter); // expone /api/backup y /api/restore
app.use("/api/search", searchRouter);


app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
});
