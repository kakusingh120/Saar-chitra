import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    // changeCurrentPassword,
    getCurrentUser,
    updateAccoundDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    searchUser,
    requestPasswordChange,
    verifyPasswordOtp
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router
    .route("/register")
    .post(
        upload.fields([      // used multer middleware for multiple file uploads (fields)
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount: 1
            },
        ]),
        registerUser
    )
router.route("/login").post(loginUser)






// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
// router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/change-password/request").post(verifyJWT, requestPasswordChange);
router.route("/change-password/verify").post(verifyJWT, verifyPasswordOtp);
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccoundDetails)
router
    .route("/update-avatar")
    .patch(
        verifyJWT,
        upload.single("avatar"),    // used multer middleware for single file uploads (single)
        updateUserAvatar
    )
router
    .route("/update-cover-image")
    .patch(
        verifyJWT,
        upload.single("coverImage"),
        updateUserCoverImage
    )
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)
router.route("/search-user").get(verifyJWT, searchUser)



export default router;