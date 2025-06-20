import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { log } from "console"

// Basically isse tum CRUD operation sheek rhe ho.

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    //TODO: create tweet

    // console.log(req.body);

    // Get owner from authenticated user (set by verifyJWT middleware)
    const owner = req.user._id;

    if (!content || content.trim() === "") throw new ApiError(400, "Content is required");


    const tweet = await Tweet.create({ content: content.toLowerCase(), owner: owner });

    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username email");
    if (!createdTweet) throw new ApiError(500, "Failed to create tweet");

    return res.status(201).json(
        new ApiResponse(201, createdTweet, "Tweet created successfully!")
    );

})


const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user) throw new ApiError(401, "Unauthorized user");

    // Find all tweets where owner matches user ID
    const tweets = await Tweet.find({ owner: userId })
        .sort({ createdAt: -1 }) // Newest first
        .populate({
            path: 'owner',
            select: 'username'
        });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                count: tweets.length,
                tweets
            },
            "User tweets fetched successfully"
        )
    );

})


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params;
    const { content } = req.body;



    if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Verify the authenticated user owns the tweet
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized: You can only update your own tweets");
    }

    tweet.content = content.trim();
    await tweet.save({ validateBeforeSave: false });

    // 6. Fetch the updated tweet (optional: populate owner if needed)
    const updatedTweet = await Tweet.findById(tweet._id)
        .populate('owner', 'username avatar');

    return res.status(201).json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    );


});


const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;

    // 2. Validate inputs
    if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(
        new ApiResponse(200, null, "Tweet delete successfully")
    );

})



export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}