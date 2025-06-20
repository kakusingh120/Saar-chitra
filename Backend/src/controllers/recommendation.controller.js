import {asyncHandler} from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { computeVideoScore } from "../utils/scoring.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getRecommendations = asyncHandler(async (req, res) => {
    const { userId, videoId } = req.query;

    const currentVideo = await Video.findById(videoId);
    const user = await User.findById(userId);

    if (!currentVideo || !user) return res.status(404).json({ message: "Not found" });

    // 🔹 1. Content-Based (tags & category)
    const contentBased = await Video.find({
        _id: { $ne: videoId },
        $or: [
            { tags: { $in: currentVideo.tags } },
            { category: currentVideo.category },
        ],
    }).limit(20);

    // 🔹 2. User-Based (liked & watched videos)
    const userVideos = await Video.find({
        _id: { $in: [...user.likedVideos, ...user.watchHistory] },
    });

    const userBasedTags = [...new Set(userVideos.flatMap(v => v.tags))];

    const userBased = await Video.find({
        _id: { $nin: [...user.likedVideos, ...user.watchHistory] },
        tags: { $in: userBasedTags },
    }).limit(20);

    // 🔹 3. Trending
    const trending = await Video.find().sort({ views: -1, likes: -1 }).limit(20);

    // 🔹 4. Combine All
    const allVideos = [...contentBased, ...userBased, ...trending];

    const uniqueVideos = Array.from(
        new Map(allVideos.map((video) => [video._id.toString(), video])).values()
    );

    // 🔹 5. Score & Sort
    const scored = uniqueVideos.map((video) => ({
        video,
        score: computeVideoScore(video),
    }));

    scored.sort((a, b) => b.score - a.score);

    const recommendations = scored.slice(0, 10).map((item) => item.video);

    res.json({ recommendations });
});


export { getRecommendations }
