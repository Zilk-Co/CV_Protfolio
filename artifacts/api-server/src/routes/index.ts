import { Router, type IRouter } from "express";
import healthRouter from "./health";
import portfolioRouter from "./portfolio";
import cvRouter from "./cv";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portfolioRouter);
router.use(cvRouter);
router.use(openaiRouter);

export default router;
