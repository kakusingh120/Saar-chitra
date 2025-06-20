import { Router } from 'express';
import multer from 'multer';
import { summarizeVideo } from '../controllers/summarize.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').post(upload.single('video'), summarizeVideo);

export default router;
