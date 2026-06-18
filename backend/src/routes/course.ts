/**
 * TALLER DE ESCRITURA DE 60 DÍAS.
 *  GET  /api/course             -> resumen (esqueleto + estado de cada día)
 *  GET  /api/course/:day         -> día completo (lección + tu texto + nota)
 *  POST /api/course/:day/generate-> la IA genera/mejora la lección {feedback?}
 *  POST /api/course/:day/text     -> guarda tu ejercicio {text}
 *  POST /api/course/:day/evaluate -> la IA califica (5 destrezas, sin sesgo)
 */
import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { grokJson } from "../services/grok.service.js";
import { sendGrokError } from "./grok.js";
import { COURSE, WEEK_TITLES } from "../data/writing-course.js";

export const courseRouter = Router();

interface DayRow {
  day: number;
  theory: string | null;
  exercise: string | null;
  criteria: string | null;
  user_text: string | null;
  score: number | null;
  score_detail: string | null;
  score_reason: string | null;
  generated_at: string | null;
  updated_at: string | null;
}

function row(day: number): DayRow | undefined {
  return db.prepare("SELECT * FROM course_days WHERE day = ?").get(day) as DayRow | undefined;
}

/** GET /api/course — resumen con progreso. */
courseRouter.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT day, user_text, score, generated_at FROM course_days").all() as Array<{
    day: number;
    user_text: string | null;
    score: number | null;
    generated_at: string | null;
  }>;
  const state = new Map(rows.map((r) => [r.day, r]));
  const days = COURSE.map((d) => {
    const s = state.get(d.day);
    return {
      ...d,
      weekTitle: WEEK_TITLES[d.week],
      generated: !!s?.generated_at,
      done: !!(s?.user_text && s.user_text.trim()),
      score: s?.score ?? null,
    };
  });
  const done = days.filter((d) => d.done).length;
  const current = days.find((d) => !d.done)?.day ?? 60;
  res.json({ days, weekTitles: WEEK_TITLES, done, current, total: COURSE.length });
});

/** GET /api/course/:day */
courseRouter.get("/:day", (req: Request, res: Response) => {
  const day = Number(req.params.day);
  const meta = COURSE.find((d) => d.day === day);
  if (!meta) return res.status(404).json({ error: "Día no encontrado." });
  const r = row(day);
  return res.json({
    meta: { ...meta, weekTitle: WEEK_TITLES[meta.week] },
    theory: r?.theory ?? null,
    exercise: r?.exercise ?? null,
    criteria: r?.criteria ? JSON.parse(r.criteria) : null,
    user_text: r?.user_text ?? "",
    score: r?.score ?? null,
    score_detail: r?.score_detail ? JSON.parse(r.score_detail) : null,
    score_reason: r?.score_reason ? JSON.parse(r.score_reason) : null,
  });
});

interface Lesson {
  theory: string;
  exercise: string;
  criteria: string[];
}

/** POST /api/course/:day/generate { feedback? } */
courseRouter.post("/:day/generate", async (req: Request, res: Response) => {
  const day = Number(req.params.day);
  const meta = COURSE.find((d) => d.day === day);
  if (!meta) return res.status(404).json({ error: "Día no encontrado." });
  const feedback = String(req.body?.feedback ?? "").trim();

  const systemPrompt =
    "Eres un profesor de escritura creativa de nivel universitario (literatura, filosofía y narrativa). " +
    "Diseñas lecciones exigentes, como las de una escuela de escritores seria. Citas a autores como Borges, " +
    "Tolstói, Dostoyevski, Kafka, Cortázar, Camus, Orwell y García Márquez cuando aporta. Devuelves solo JSON válido.";
  const userPrompt = `Diseña la lección del DÍA ${day} de un taller de 60 días.
Semana ${meta.week}: ${WEEK_TITLES[meta.week]}
Tema del día: ${meta.title}
Enfoque: ${meta.brief}
Destrezas: ${meta.skills.join(", ")}.
${meta.project ? "Es el PROYECTO de la semana: un ejercicio más grande que integra lo aprendido." : ""}
${feedback ? `El estudiante quiere ajustar el tema así: "${feedback}". Adáptalo manteniendo el objetivo y el nivel.` : ""}

Estructura para 1 hora de trabajo (teoría 10-15 min, escritura 35-40 min, reflexión 5-10 min).
Devuelve SOLO:
{
  "theory": "explicación teórica densa pero clara (180-260 palabras), con al menos una referencia a un autor",
  "exercise": "consigna de escritura concreta, con objetivo de palabras y tiempo sugerido",
  "criteria": ["3-5 criterios específicos de autoevaluación para este ejercicio"]
}`;
  try {
    const l = await grokJson<Lesson>(systemPrompt, userPrompt);
    db.prepare(
      `INSERT INTO course_days (day, theory, exercise, criteria, generated_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(day) DO UPDATE SET theory=excluded.theory, exercise=excluded.exercise, criteria=excluded.criteria, generated_at=CURRENT_TIMESTAMP`
    ).run(day, l.theory, l.exercise, JSON.stringify(l.criteria ?? []));
    return res.json({ theory: l.theory, exercise: l.exercise, criteria: l.criteria ?? [] });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** POST /api/course/:day/text { text } */
courseRouter.post("/:day/text", (req: Request, res: Response) => {
  const day = Number(req.params.day);
  if (!COURSE.find((d) => d.day === day)) return res.status(404).json({ error: "Día no encontrado." });
  const text = String(req.body?.text ?? "");
  db.prepare(
    `INSERT INTO course_days (day, user_text, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(day) DO UPDATE SET user_text=excluded.user_text, updated_at=CURRENT_TIMESTAMP`
  ).run(day, text);
  return res.json({ ok: true });
});

interface EvalResult {
  claridad: number;
  observacion: number;
  originalidad: number;
  profundidad: number;
  estilo: number;
  veredicto: string;
  fuerte: string;
  mejora: string;
}

/** POST /api/course/:day/evaluate */
courseRouter.post("/:day/evaluate", async (req: Request, res: Response) => {
  const day = Number(req.params.day);
  const meta = COURSE.find((d) => d.day === day);
  if (!meta) return res.status(404).json({ error: "Día no encontrado." });
  const r = row(day);
  const text = (r?.user_text ?? "").trim();
  if (!text) return res.status(400).json({ error: "Primero escribe y guarda tu ejercicio." });

  const systemPrompt =
    "Eres un profesor de escritura honesto y CALIBRADO. Evalúas sin sesgo: si algo está muy bien, lo dices " +
    "claramente y pones nota alta; si flojea, lo señalas con precisión. No inventas defectos ni adulas. " +
    "La mayoría de textos de aprendiz caen entre 5 y 7; reserva 9-10 para trabajo sobresaliente. Devuelves solo JSON.";
  const userPrompt = `Ejercicio del día ${day} (${meta.title}). Consigna: ${r?.exercise ?? meta.brief}

Texto del estudiante:
"""${text}"""

Califica del 1 al 10 (entero) cada destreza, con rigor:
- claridad (de pensamiento y prosa)
- observacion (mirada, detalle concreto)
- originalidad
- profundidad (filosófica/emocional)
- estilo (voz, ritmo, lenguaje)

Devuelve SOLO:
{ "claridad": n, "observacion": n, "originalidad": n, "profundidad": n, "estilo": n,
  "veredicto": "1-2 frases honestas (reconoce lo bueno si lo hay)", "fuerte": "lo mejor del texto", "mejora": "lo más útil para mejorar" }`;
  try {
    const e = await grokJson<EvalResult>(systemPrompt, userPrompt);
    const clamp = (x: number) => Math.max(1, Math.min(10, Math.round(Number(x) || 0)));
    const detail = {
      claridad: clamp(e.claridad),
      observacion: clamp(e.observacion),
      originalidad: clamp(e.originalidad),
      profundidad: clamp(e.profundidad),
      estilo: clamp(e.estilo),
    };
    const vals = Object.values(detail);
    const score = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    db.prepare(
      "UPDATE course_days SET score = ?, score_detail = ?, score_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE day = ?"
    ).run(score, JSON.stringify(detail), JSON.stringify({ veredicto: e.veredicto, fuerte: e.fuerte, mejora: e.mejora }), day);
    return res.json({ score, score_detail: detail, score_reason: { veredicto: e.veredicto, fuerte: e.fuerte, mejora: e.mejora } });
  } catch (err) {
    return sendGrokError(res, err);
  }
});
