/**
 * Rutas de STUDIO sin estado (Módulos 2, 8, 9).
 * Son llamadas directas a Grok que no necesitan guardarse en BD.
 *
 *  POST /api/studio/hooks         -> 10 hooks (Módulo 2)
 *  POST /api/studio/hooks/more    -> variaciones de un hook
 *  POST /api/studio/captions      -> captions + hashtags + textos (Módulo 8)
 *  POST /api/studio/repurpose     -> adaptaciones multiplataforma (Módulo 9)
 */
import { Router, type Request, type Response } from "express";
import { sendGrokError } from "./grok.js";
import {
  generateHooks,
  moreLikeHook,
  generateCaptions,
  repurpose,
} from "../services/content.service.js";

export const studioRouter = Router();

/** POST /api/studio/hooks { topic } */
studioRouter.post("/hooks", async (req: Request, res: Response) => {
  const topic = String(req.body?.topic ?? "").trim();
  if (!topic) return res.status(400).json({ error: "Falta el tema." });
  try {
    return res.json({ hooks: await generateHooks(topic) });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** POST /api/studio/hooks/more { hook, topic } */
studioRouter.post("/hooks/more", async (req: Request, res: Response) => {
  const { hook, topic } = req.body ?? {};
  if (!hook) return res.status(400).json({ error: "Falta el hook base." });
  try {
    return res.json({ hooks: await moreLikeHook(hook, topic ?? "") });
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** POST /api/studio/captions { script } */
studioRouter.post("/captions", async (req: Request, res: Response) => {
  const script = String(req.body?.script ?? "").trim();
  if (!script) return res.status(400).json({ error: "Pega el guion." });
  try {
    return res.json(await generateCaptions(script));
  } catch (err) {
    return sendGrokError(res, err);
  }
});

/** POST /api/studio/repurpose { script } */
studioRouter.post("/repurpose", async (req: Request, res: Response) => {
  const script = String(req.body?.script ?? "").trim();
  if (!script) return res.status(400).json({ error: "Pega el guion." });
  try {
    return res.json(await repurpose(script));
  } catch (err) {
    return sendGrokError(res, err);
  }
});
