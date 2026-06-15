/**
 * Configuración de la base de datos SQLite (better-sqlite3).
 *
 * better-sqlite3 es síncrono: cada consulta devuelve el resultado directamente,
 * sin promesas ni callbacks. Es perfecto para una app local de un solo usuario.
 *
 * PERSISTENCIA SEGURA (A2): la base de datos vive en ~/.pliego/data.db, FUERA de
 * la carpeta del proyecto, para que sobreviva a borrados/reinstalaciones del repo.
 * Al arrancar:
 *   - Si existe la BD antigua del proyecto (backend/lector.db) y aún no hay
 *     data.db, se migra automáticamente (copia consistente vía VACUUM INTO).
 *   - Se crea un backup diario en ~/.pliego/backups/ y se conservan los 30 más
 *     recientes.
 */
import Database from "better-sqlite3";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, readdirSync, statSync, rmSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Carpeta de datos persistente.
 *  - En local: ~/.pliego
 *  - En Railway/servidor: se define PLIEGO_DATA_DIR apuntando a un volumen
 *    persistente (ej. /data) para que la BD sobreviva a cada despliegue.
 */
export const DATA_DIR = process.env.PLIEGO_DATA_DIR || join(homedir(), ".pliego");
export const BACKUPS_DIR = join(DATA_DIR, "backups");
const DB_PATH = join(DATA_DIR, "data.db");

/** Ruta antigua dentro del proyecto (para migrar una sola vez). */
const LEGACY_DB = join(__dirname, "..", "lector.db");

/** Escapa una ruta para usarla dentro de una sentencia SQL ('...'). */
const sqlPath = (p: string) => p.replace(/\\/g, "/").replace(/'/g, "''");

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(BACKUPS_DIR, { recursive: true });

// Migración única: BD antigua del proyecto -> ~/.pliego/data.db
if (!existsSync(DB_PATH) && existsSync(LEGACY_DB)) {
  try {
    const legacy = new Database(LEGACY_DB);
    legacy.exec(`VACUUM INTO '${sqlPath(DB_PATH)}'`);
    legacy.close();
    console.log("📦 Migrada la BD antigua (lector.db) → ~/.pliego/data.db");
  } catch (e) {
    console.warn("⚠️ No se pudo migrar la BD antigua:", e);
  }
}

// Abrimos (o creamos) la base de datos en la ubicación persistente.
export const db = new Database(DB_PATH);

// WAL mejora el rendimiento en lecturas/escrituras concurrentes.
db.pragma("journal_mode = WAL");

/**
 * Crea un backup diario (uno por día) y conserva solo los 30 más recientes.
 * Se llama al iniciar el servidor.
 */
export function backupDaily(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dest = join(BACKUPS_DIR, `data-${today}.db`);
    if (!existsSync(dest)) {
      db.exec(`VACUUM INTO '${sqlPath(dest)}'`);
      console.log(`💾 Backup diario: ${dest}`);
    }
    const backups = readdirSync(BACKUPS_DIR)
      .filter((f) => f.startsWith("data-") && f.endsWith(".db"))
      .map((f) => ({ f, t: statSync(join(BACKUPS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const { f } of backups.slice(30)) {
      rmSync(join(BACKUPS_DIR, f), { force: true });
    }
  } catch (e) {
    console.warn("⚠️ No se pudo crear el backup diario:", e);
  }
}

/**
 * Crea las tablas si no existen todavía.
 * Se llama una sola vez al iniciar el servidor.
 */
export function initDb(): void {
  // Activamos las llaves foráneas (SQLite las desactiva por defecto).
  db.pragma("foreign_keys = ON");

  db.exec(`
    /* ---- Núcleo original ---- */
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      year INTEGER,
      cover_url TEXT,
      rating INTEGER,
      notes TEXT,
      themes TEXT,
      read_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS book_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      reason TEXT,
      based_on_books TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    /* ---- Módulo 1: Studio de guiones (con versionado) ---- */
    CREATE TABLE IF NOT EXISTS scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      topic TEXT,
      book_ref TEXT,
      duration TEXT,
      tone TEXT,
      blocks TEXT,            -- JSON con los bloques [{label, timestamp, content}]
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    );

    -- Cada cambio guardado de un guion queda como una versión histórica.
    CREATE TABLE IF NOT EXISTS script_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id INTEGER NOT NULL,
      blocks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE
    );

    /* ---- Módulo 3: Banco de citas ---- */
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      text TEXT NOT NULL,
      page INTEGER,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
    );

    /* ---- Módulo 4: Etimologías y palabras ---- */
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      etymology TEXT,
      story TEXT,
      video_ideas TEXT,
      status TEXT DEFAULT 'pendiente',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    /* ---- Módulo 5: Calendario editorial (kanban) ---- */
    CREATE TABLE IF NOT EXISTS content_pipeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      status TEXT DEFAULT 'idea',
      script_id INTEGER,
      scheduled_date TEXT,
      notes TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    );

    /* ---- Módulo 6: Series y formatos recurrentes ---- */
    CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      hashtag TEXT,
      template TEXT,
      frequency TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS series_episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER NOT NULL,
      episode_number INTEGER,
      title TEXT,
      script TEXT,
      status TEXT DEFAULT 'idea',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
    );

    /* ---- Módulo 7: Banco de inspiración ---- */
    CREATE TABLE IF NOT EXISTS inspiration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    /* ---- Módulo: Diálogos con autores ---- */
    CREATE TABLE IF NOT EXISTS dialogues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      messages TEXT NOT NULL,        -- JSON [{ role: 'user'|'author', content }]
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    );
  `);

  console.log("✅ Base de datos lista (~/.pliego/data.db).");
}
