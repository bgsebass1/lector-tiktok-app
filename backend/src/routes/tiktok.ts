/**
 * Rutas de TIKTOK (dashboard + analytics avanzado, Módulo 10).
 *
 * Toda la data viene del servicio tiktok-analytics.service (mock por ahora,
 * con la firma lista para Windsor.ai).
 *
 *  GET  /api/tiktok/stats          -> overview + top videos (compat. con la app)
 *  GET  /api/tiktok/analytics      -> paquete completo de analytics avanzado
 *  POST /api/tiktok/analyze        -> Grok da insights sobre los datos
 */
import { Router, type Request, type Response } from "express";
import {
  getAccountOverview,
  getTopVideos,
  getAudienceDemographics,
  getBestPostingTimes,
  getEngagementByTopic,
} from "../services/tiktok-analytics.service.js";
import { analyzePerformance } from "../services/content.service.js";
import { sendGrokError } from "./grok.js";

export const tiktokRouter = Router();

/**
 * GET /api/tiktok/stats
 * Mantiene la forma original (followers, totalViews, engagementRate,
 * followerSeries, videos) para no romper la página existente.
 */
tiktokRouter.get("/stats", (_req: Request, res: Response) => {
  const overview = getAccountOverview();
  res.json({
    followers: overview.followers,
    totalViews: overview.totalViews,
    engagementRate: overview.engagementRate,
    followerSeries: overview.followerSeries,
    videos: getTopVideos(10),
  });
});

/** GET /api/tiktok/analytics — paquete completo para el dashboard avanzado. */
tiktokRouter.get("/analytics", (_req: Request, res: Response) => {
  res.json({
    overview: getAccountOverview(),
    topVideos: getTopVideos(10),
    demographics: getAudienceDemographics(),
    postingTimes: getBestPostingTimes(),
    engagementByTopic: getEngagementByTopic(),
  });
});

/** POST /api/tiktok/analyze — "Analizar mi rendimiento con IA". */
tiktokRouter.post("/analyze", async (_req: Request, res: Response) => {
  try {
    const data = {
      overview: getAccountOverview(),
      topVideos: getTopVideos(10),
      engagementByTopic: getEngagementByTopic(),
      demographics: getAudienceDemographics(),
    };
    const insights = await analyzePerformance(data);
    return res.json({ insights });
  } catch (err) {
    return sendGrokError(res, err);
  }
});
