import { Router } from 'express';
import {
    reportContent,
    blockUser,
    getBlockedUsers,
} from "../controllers/moderation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT)


router.route("/report/:reportedId").post(reportContent);
router.route("/block/:blockedUserId").post(blockUser);
router.route("/blocked").get(getBlockedUsers);


export default router;
