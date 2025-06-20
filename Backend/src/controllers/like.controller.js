import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"




const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    const userId = req.user._id;

    if (!videoId || !mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Valid video Id is required");

    const video = await Video.findById(videoId);

    if (!video) throw new ApiError(403, "Video not found")

    // Check if like already exists
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    });

    let action;
    let result;

    if (existingLike) {
        // Unlike the video
        await Like.findByIdAndDelete(existingLike._id);
        action = "unliked";
        result = null; // No like document to return
    } else {
        // Like the video
        const like = await Like.create({
            video: videoId,
            likedBy: userId,
            tweet: null,    // Explicitly set other types to null
            comment: null   // if your schema supports multiple types
        });

        if (!like) throw new ApiError(500, "Failed to like video");

        // Populate only for like creation
        result = await Like.findById(like._id)
            .populate("video", "title thumbnail duration")
            .populate("likedBy", "username avatar");

        action = "liked";
    }


    res.status(201).json(
        new ApiResponse(200, {
            action,
            like: result
        }, `Video ${action} successfully`)
    );


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    const userId = req.user._id;

    if (!commentId || !mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Valid comment Id is required");

    const comment = await Comment.findById(commentId);

    if (!comment) throw new ApiError(403, "comment not found")

    // Check if like already exists
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    });

    let action;
    let result;

    if (existingLike) {
        // Unlike the comment
        await Like.findByIdAndDelete(existingLike._id);
        action = "unliked";
        result = null; // No like document to return
    } else {
        // Like the comment
        const like = await Like.create({
            comment: commentId,
            likedBy: userId,
            video: null,    // Explicitly set other types to null
            tweet: null   // if your schema supports multiple types
        });

        if (!like) throw new ApiError(500, "Failed to like video");

        // Populate only for like creation
        result = await Like.findById(like._id)
            .populate("comment", "content")
            .populate("likedBy", "username avatar");

        action = "liked";
    }


    res.status(200).json(
        new ApiResponse(200, {
            action,
            like: result
        }, `Comment ${action} successfully`)
    );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    const userId = req.user._id;

    if (!tweetId || !mongoose.isValidObjectId(tweetId)) throw new ApiError(400, "Valid tweet Id is required");

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) throw new ApiError(403, "tweet not found")

    // Check if like already exists
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    let action;
    let result;

    if (existingLike) {
        // Unlike the tweet
        await Like.findByIdAndDelete(existingLike._id);
        action = "unliked";
        result = null; // No like document to return
    } else {
        // Like the tweet
        const like = await Like.create({
            tweet: tweetId,
            likedBy: userId,
            video: null,    // Explicitly set other types to null
            comment: null   // if your schema supports multiple types
        });

        if (!like) throw new ApiError(500, "Failed to like video");

        // Populate only for like creation
        result = await Like.findById(like._id)
            .populate("tweet", "content")
            .populate("likedBy", "username avatar");

        action = "liked";
    }


    res.status(200).json(
        new ApiResponse(200, {
            action,
            like: result
        }, `Like ${action} successfully`)
    );
})






// acha logic hai isme 
const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;

    // Step 1: Find all video likes by this user
    const videoLikes = await Like.find({
        likedBy: userId,
        video: { $exists: true } // Only get video likes
    }).sort({ createdAt: -1 }); // Newest first

    // Step 2: Extract video IDs from likes
    const videoIds = videoLikes.map(like => like.video);

    // Step 3: Get complete video details
    const videos = await Video.find({
        _id: { $in: videoIds }
    })
        .populate("owner", "username avatar displayName")
        .select("title thumbnail duration views createdAt");

    // Step 4: Return response
    res.status(200).json(
        new ApiResponse(200, {
            count: videos.length,
            videos
        }, "Liked videos fetched successfully")
    );


})





export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}