import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { processVideoAI, generateTTS } from "../controllers/ai.controller.js";

const router = Router();

router.use(verifyJWT);
router.route("/generate-content").post(processVideoAI);
router.route("/generate-tts").post(generateTTS);


export default router;
