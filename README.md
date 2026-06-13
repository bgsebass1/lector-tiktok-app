# Libros nada más · Estudio de contenido 📚✨📊🎬

Estudio personal de creación de contenido para el canal de TikTok
*"Libros nada más 😁"* (filosofía, literatura e historia del lenguaje).

De app de 3 funciones pasó a un **estudio completo** con 11 módulos.

---

## 🧱 Stack

| Capa          | Tecnología                                                        |
| ------------- | ---------------------------------------------------------------- |
| Frontend      | React + Vite + TypeScript + TailwindCSS + Recharts + Framer Motion |
| Drag & drop   | @hello-pangea/dnd · Exportar imágenes: html-to-image · Toasts: react-hot-toast |
| Backend       | Node.js + Express + TypeScript                                    |
| Base de datos | SQLite (archivo local) con **better-sqlite3**                     |
| IA            | Grok vía **OpenRouter** (`x-ai/grok-4.3`), compatible con formato OpenAI |
| Libros        | Open Library API (gratis, sin API key)                           |

> El modelo `grok-beta` fue retirado por xAI el 15/05/2026. Ahora se usa
> `x-ai/grok-4.3` a través de OpenRouter. Todo es configurable por `.env`.

---

## 📑 Páginas y módulos

| Ruta            | Página         | Módulos que incluye |
| --------------- | -------------- | ------------------- |
| `/`             | **Inicio**     | Dashboard rediseñado (M11): saludo por hora, próximos videos, ideas frescas, última lectura, cita del día, palabra del día, stats |
| `/libros`       | **Libros**     | Tracker de libros + carátulas (Open Library) + recomendaciones Grok |
| `/studio`       | **Studio**     | Guiones (M1), Hooks (M2), Caption & Hashtags (M8), Repurpose (M9), Series (M6) |
| `/citas`        | **Citas**      | Banco de citas (M3) con exportación a imagen PNG (Story/Post) |
| `/palabras`     | **Etimologías**| Diccionario personal de palabras (M4) |
| `/calendario`   | **Calendario** | Kanban con drag & drop + vista mensual (M5) |
| `/inspiracion`  | **Inspiración**| Banco de inspiración tipo Pinterest (M7) |
| `/ideas`        | **Ideas**      | Generador de ideas de video con Grok |
| `/tiktok`       | **TikTok**     | Analytics avanzado (M10): heatmap, demografía, retención, insights IA |

### Detalle del Studio (`/studio`)
- **🎬 Guiones**: genera guiones con timestamps por bloque ([0-3s] HOOK, etc.),
  edita cada bloque, reescribe un bloque suelto, transforma todo (más viral /
  más profundo / más corto), versionado e exportación a `.txt`.
- **🪝 Hooks**: 10 hooks en estilos distintos; "Usar este" lo manda al editor.
- **#️⃣ Caption & Hashtags**: 3 captions + 3 sets de hashtags + textos en pantalla + thumbnails.
- **♻️ Repurpose**: convierte el guion en hilo de X, carrusel IG, post LinkedIn, newsletter y caption de Reels.
- **📺 Series**: define una serie con plantilla fija y genera episodios nuevos.

---

## ⌨️ Atajos de teclado

| Atajo        | Acción                                  |
| ------------ | --------------------------------------- |
| `Cmd/Ctrl + K` | Búsqueda global (libros, citas, palabras, ideas, guiones) |
| `Cmd/Ctrl + N` | Menú radial "crear nuevo"               |
| `Cmd/Ctrl + 1` | Inicio                                  |
| `Cmd/Ctrl + 2` | Libros                                  |
| `Cmd/Ctrl + 3` | Studio                                  |
| `Cmd/Ctrl + 4` | Citas                                   |
| `Cmd/Ctrl + 5` | Calendario                              |
| `Cmd/Ctrl + 6` | TikTok                                  |

El botón flotante **"+"** (abajo a la derecha) abre el mismo menú radial.

---

## 🚀 Instalar y correr

Necesitas **Node.js 20+** (probado con Node 24). Dos terminales.

### 1. Instalar dependencias
```powershell
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configurar la IA
```powershell
cd backend
copy .env.example .env
```
Edita `backend/.env`:
```
GROK_BASE_URL=https://openrouter.ai/api/v1
GROK_API_KEY=sk-or-tu_clave_de_openrouter
GROK_MODEL=x-ai/grok-4.3
PORT=3001
```
> OpenRouter: https://openrouter.ai/keys · El `.env` NO se sube a Git.

### 3. Arrancar en desarrollo
```powershell
# Terminal 1
cd backend
npm run dev      # http://localhost:3001

# Terminal 2
cd frontend
npm run dev      # http://localhost:5173
```
Abre **http://localhost:5173**.

---

## 🔌 Endpoints principales

| Familia      | Rutas                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Libros       | `GET/POST/PUT/DELETE /api/books`, `/api/books/search`, `/api/books/recommend` |
| Ideas        | `GET/POST /api/grok/ideas`                                            |
| Guiones      | `/api/scripts` (CRUD), `/generate`, `/rewrite-block`, `/transform`    |
| Studio       | `/api/studio/hooks`, `/hooks/more`, `/captions`, `/repurpose`         |
| Citas        | `/api/quotes` (CRUD), `/api/quotes/:id/to-video`                      |
| Palabras     | `/api/words` (lista), `/analyze`, `/:id/status`                       |
| Kanban       | `/api/pipeline` (CRUD)                                                |
| Series       | `/api/series` (CRUD), `/:id/episodes`, `/:id/next`                    |
| Inspiración  | `/api/inspiration` (CRUD), `/:id/ideas`                               |
| TikTok       | `/api/tiktok/stats`, `/analytics`, `/analyze`                         |
| Búsqueda     | `/api/search?q=`                                                      |
| Backup       | `GET /api/backup`, `POST /api/restore`                                |

---

## 🗄️ Backup

- `GET /api/backup` descarga toda la base de datos como JSON.
- `POST /api/restore` (con `{ data: ... }`) restaura desde ese JSON.

---

## 📁 Estructura

```
backend/src/
  config/grok.config.ts          # modelo, base URL, timeout
  services/
    grok.service.ts              # llamada base + manejo de errores (GrokError)
    content.service.ts           # prompts de todos los módulos
    openlibrary.service.ts       # carátulas
    tiktok-analytics.service.ts  # métricas mock (firma lista para Windsor.ai)
  routes/                        # books, grok, tiktok, scripts, studio, quotes,
                                 # words, pipeline, series, inspiration, backup, search
frontend/src/
  pages/        # Dashboard, Books, Studio, Citas, Palabras, Calendario,
                # Inspiracion, Ideas, TikTok
  components/   # Navbar, BookCard, AddBookModal, CommandPalette, RadialMenu,
                # GrokLoading, Skeleton, PageTransition, studio/*
  lib/          # api.ts (cliente + tipos), notify.tsx (toasts)
```

---

## 🛣️ Próximos pasos

- Conectar el dashboard a datos reales de TikTok: ver
  `// TODO: conectar Windsor.ai API` en `backend/src/services/tiktok-analytics.service.ts`.
- Regenerar las API keys que se compartieron durante el desarrollo.
