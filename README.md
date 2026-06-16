# Pliego

> Tu sistema personal de **lectura, creación de contenido y aprendizaje**.
> Una sola app (instalable como PWA) para leer con intención y crear sin fricción.

---

## ✨ Qué incluye

### 📖 Lectura
- **Leer**: sesiones de lectura con cronómetro, subrayados y notas por libro.
- **Heatmap anual** estilo GitHub con los minutos leídos cada día.
- **Quiero leer**: lista de deseos con sugerencias de IA, portadas automáticas (Open Library), prioridad reordenable y "Empezar a leer" (la pasa a tu biblioteca).
- **Libros**: tracker con carátulas y recomendaciones generadas por IA.
- **Racha** de días consecutivos de lectura.

### 🎓 Estudio
- **Diálogos con autores**: conversa "en personaje" con Dostoyevski, Wittgenstein, Borges, etc.
- **Flashcards** con repetición espaciada (algoritmo SM-2) y generación desde un libro.
- **Timeline intelectual**: línea de tiempo de libros, autores, ideas y eventos.

### ✍️ Creación
- **Escribir**: editor de escritura libre con autoguardado y contador de palabras.
- **Constelación**: grafo vivo (simulación de fuerzas) que conecta tus libros por temas y autores. Zoom, paneo y nodos arrastrables.
- **Modo monje**: concentración a pantalla completa con respiración guiada; registra el tiempo en tu heatmap.
- **Shuffle creativo**: baraja libros/citas/palabras/ideas al azar y los combina con IA en una idea de video.
- **Crear (Studio)**: guiones, hooks, captions & hashtags, repurpose y series.
- **Citas, Palabras (etimologías), Recursos B-roll, Inspiración, Calendario (Kanban), Analytics de TikTok.**

### 🎨 Experiencia
- **4 temas visuales** (Carbón, Pergamino, Nocturno, Bosque) con cambio en caliente.
- **Ritual diario**: bienvenida una vez al día con saludo, racha, frase e intención.
- **Onboarding** de primera vez.
- **Sonidos** de interfaz sutiles (Web Audio, sin archivos), con interruptor.
- **Búsqueda global** (`Cmd/Ctrl + K`) sobre los 11 tipos de contenido.

### 🛠️ Infraestructura
- **PWA** instalable (iOS/Android) con service worker y modo offline básico.
- **Persistencia** SQLite en `~/.pliego/data.db` (sobrevive a borrar el proyecto) + **backup diario** rotando los últimos 30.

---

## 🧱 Stack

| Capa          | Tecnología                                                         |
| ------------- | ----------------------------------------------------------------- |
| Frontend      | React + Vite + TypeScript + TailwindCSS + Framer Motion + Recharts |
| Backend       | Node.js + Express + TypeScript                                     |
| Base de datos | SQLite con **better-sqlite3** (v12)                                |
| IA            | **Groq** (`llama-3.3-70b-versatile`), gratis y compatible con el formato OpenAI |
| Libros        | Open Library API (gratis, sin API key)                            |

> El cliente de IA es agnóstico al proveedor: las variables conservan el prefijo
> `GROK_` por historia, pero apuntan a Groq. Puedes cambiar a OpenRouter o xAI
> solo editando el `.env` (ver abajo).

---

## 🚀 Instalar y correr

Necesitas **Node.js 20+**. Dos terminales.

### 1. Dependencias
```powershell
cd backend;  npm install
cd ../frontend;  npm install
```

### 2. Configurar la IA (Groq, gratis)
Crea `backend/.env`:
```
GROK_BASE_URL=https://api.groq.com/openai/v1
GROK_API_KEY=gsk_tu_clave_de_groq
GROK_MODEL=llama-3.3-70b-versatile
PORT=3001
```
> Clave gratis en https://console.groq.com · El `.env` NO se sube a Git.
> Alternativas: OpenRouter (`https://openrouter.ai/api/v1`, `x-ai/grok-4.3`) o xAI (`https://api.x.ai/v1`, `grok-4.3`).

### 3. Desarrollo
```powershell
# Terminal 1
cd backend;  npm run dev      # http://localhost:3001

# Terminal 2
cd frontend;  npm run dev     # http://localhost:5173
```
Abre **http://localhost:5173**.

---

## ⌨️ Atajos de teclado

| Atajo            | Acción                       |
| ---------------- | ---------------------------- |
| `Cmd/Ctrl + K`   | Búsqueda global              |
| `Cmd/Ctrl + N`   | Menú radial "crear nuevo"    |
| `Cmd/Ctrl + 1…6` | Inicio · Libros · Crear · Citas · Calendario · TikTok |

---

## 🗺️ Rutas principales

| Ruta             | Página                                   |
| ---------------- | ---------------------------------------- |
| `/`              | Inicio (dashboard + intención del día)   |
| `/libros`        | Biblioteca                               |
| `/leer`, `/leer/:id` | Hub de lectura + sesión (cronómetro/highlights) |
| `/quiero-leer`   | Lista de deseos (IA + portadas)          |
| `/estudio`       | Hub de estudio                           |
| `/dialogos`      | Diálogos con autores                     |
| `/flashcards`    | Flashcards (SM-2)                        |
| `/timeline`      | Timeline intelectual                     |
| `/crear`         | Studio (guiones, hooks, captions…)       |
| `/escribir`      | Editor de escritura libre                |
| `/constelacion`  | Grafo de libros y temas                  |
| `/monje`         | Modo monje (concentración)               |
| `/shuffle`       | Shuffle creativo                         |
| `/recursos`      | Banco de recursos B-roll                 |
| `/citas`, `/palabras`, `/calendario`, `/inspiracion`, `/tiktok` | Contenido y analítica |
| `/settings/apariencia`, `/settings/sonidos`, `/settings/backup` | Ajustes |

---

## 🔌 Endpoints (familias)

`books` · `grok` · `tiktok` · `scripts` · `studio` · `quotes` · `words` ·
`pipeline` · `series` · `inspiration` · `backup` · `search` · `dialogues` ·
`flashcards` · `resources` · `timeline` · `reading` · `writings` · `wishlist` ·
`constelacion` · `shuffle`

- **Backup**: `GET /api/backup` (descarga todo en JSON) · `POST /api/restore`.
- **Salud**: `GET /api/health`.

---

## ☁️ Despliegue

- **Backend → Railway**: Root Directory `backend`. Variables `GROK_BASE_URL`,
  `GROK_MODEL`, `GROK_API_KEY` y `PLIEGO_DATA_DIR=/data` con un **Volume** montado
  en `/data` para que los datos persistan entre despliegues. Healthcheck `/api/health`.
- **Frontend → Vercel**: la URL del backend se hornea en build vía
  `frontend/.env.production` (`VITE_API_URL=...`). `vercel.json` en la raíz hace
  `npm --prefix frontend install/build`, sirve `frontend/dist` y reescribe rutas SPA.

---

## 📁 Estructura

```
backend/src/
  config/grok.config.ts     # modelo + base URL + timeout (por defecto Groq)
  services/                 # grok, content, openlibrary, tiktok-analytics
  routes/                   # books, grok, reading, writings, wishlist, dialogues,
                            # flashcards, timeline, resources, constelacion, shuffle,
                            # scripts, studio, quotes, words, pipeline, series,
                            # inspiration, search, backup, tiktok
  db.ts                     # SQLite + tablas + backup diario
frontend/src/
  pages/                    # una por módulo (Dashboard, Leer, QuieroLeer, Escribir,
                            # Constelacion, Monje, Shuffle, Dialogos, Flashcards, …)
  components/               # shell, CommandPalette, RadialMenu, Onboarding,
                            # DailyRitual, ReadingHeatmap, InstallPrompt, …
  lib/                      # api.ts (cliente + tipos), theme.ts, sound.ts, nav.ts, notify
```

---

## 🛣️ Pendientes conocidos

- Conectar el dashboard a datos reales de TikTok (`// TODO: Windsor.ai` en
  `backend/src/services/tiktok-analytics.service.ts`).
- Regenerar las API keys compartidas durante el desarrollo.
- Parte F (animaciones avanzadas / colección de cartas): opcional, tras validar en móvil.
