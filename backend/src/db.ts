/**
 * Configuración de la base de datos SQLite (better-sqlite3).
 *
 * better-sqlite3 es síncrono: cada consulta devuelve el resultado directamente,
 * sin promesas ni callbacks. Es perfecto para una app local de un solo usuario.
 *
 * El archivo de la base de datos ("lector.db") se crea automáticamente en la
 * carpeta /backend la primera vez que arranca el servidor.
 */
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Como usamos ESM, reconstruimos __dirname manualmente.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// El .db queda en la raíz de /backend (un nivel arriba de /src).
const dbPath = join(__dirname, "..", "lector.db");

// Abrimos (o creamos) la base de datos.
export const db = new Database(dbPath);

// WAL mejora el rendimiento en lecturas/escrituras concurrentes.
db.pragma("journal_mode = WAL");

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
  `);

  console.log("✅ Base de datos lista (tablas creadas/verificadas).");
}
