import { Router } from 'express';
import { addToWatchLater, removeFromWatchLater, getWatchLaterList, toggleWatchLater, isVideoSaved } from "../controllers/watchlater.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/add/:videoId").post(addToWatchLater);
router.route("/remove/:videoId").delete(removeFromWatchLater);
router.route("/list").get(getWatchLaterList);
router.route("/toggel/:videoId").post(toggleWatchLater);
router.route("/is-saved/:videoId").get(isVideoSaved);


export default router