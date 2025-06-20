import mongoose from "mongoose";
import { WatchLater } from "../models/watchLater.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { log } from "console";



const addToWatchLater = asyncHandler(async (req, res) => {
    log(req.params)
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId || !mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Video ID is required");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const saved = await WatchLater.findOneAndUpdate(
        { user: userId, video: videoId },
        {},
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(new ApiResponse(201, saved, "Video saved to watch later"));
});


const removeFromWatchLater = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { videoId } = req.params;

    const deleted = await WatchLater.findOneAndDelete({ user: userId, video: videoId });

    if (!deleted) throw new ApiError(404, "Video not found in Watch Later list");

    res.status(200).json(new ApiResponse(200, null, "Video removed from watch later"));
});


const getWatchLaterList = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const savedVideos = await WatchLater.find({ user: userId })
        .populate("video", "title thumbnail duration owner") // Customize fields
        .populate("user", "username avatar")
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, savedVideos, "Watch later list fetched"));
});

const toggleWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const existing = await WatchLater.findOne({ user: userId, video: videoId });

    if (existing) {
        await existing.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Video removed from watch later"));
    }

    const saved = await WatchLater.create({ user: userId, video: videoId });
    return res.status(201).json(new ApiResponse(201, saved, "Video added to watch later"));
});


const isVideoSaved = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is required");
    }

    const exists = await WatchLater.exists({ user: userId, video: videoId });

    res.status(200).json(
        new ApiResponse(200, { isSaved: !!exists }, "Video save status fetched")
    );
});



export {
    addToWatchLater,
    removeFromWatchLater,
    getWatchLaterList,
    toggleWatchLater,
    isVideoSaved
}