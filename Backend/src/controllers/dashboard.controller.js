import mongoose from "mongoose"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


/*  Algorithm (High-Level Logic)
        Validate channelId.
        Check Permissions (if applicable).
        Fetch Channel Metadata (name, owner, etc.).
        Run Aggregation Queries (subscribers, videos, views, likes).
        Compute Derived Metrics (engagement rate, growth trends).
        Cache Results (optional for performance).
        Return Structured Response.
    */
const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.params;

    const userId = req.user?._id;

    if (!channelId || !mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Valid channel Id is required")


    if (userId.toString() !== channelId.toString()) throw new ApiError(400, "Unauthorized user")

    // Get total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // Get total videos by this channel
    const videos = await Video.find({ owner: channelId }).select("title thumbnail owner duration");
    const totalVideos = videos.length;

    // Count total likes across all videos of this channel
    const videoIds = videos.map(video => video._id);
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    // Optional: channel info (if needed)
    const channelInfo = await User.findById(channelId).select("username avatar");

    res.status(200).json(
        new ApiResponse(200, {
            channelInfo,
            totalSubscribers,
            totalVideos,
            totalLikes
        }, "Channel stats fetched successfully")
    );


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;

    const userId = req.user?._id;

    if (!channelId || !mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Valid channel Id is required")


    // Get total videos by this channel
    const videos = await Video.find({ owner: channelId })
        .select("title thumbnail owner duration createdAt")
        .populate("owner", "username avatar");

    const totalVideos = videos.length;


    // Optional: channel info (if needed)
    const channelInfo = await User.findById(channelId).select("username avatar");

    res.status(200).json(
        new ApiResponse(200, {
            channelInfo,
            totalVideos,
            videos,
        }, "Channel videos fetched successfully")
    );


})


export {
    getChannelStats,
    getChannelVideos
}