import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { log } from "console"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Valid channel Id is required");
    }

    // Check if channel (User) exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    let result;
    let action;

    if (existingSubscription) {
        // Unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id);
        action = "Unsubscribed";
        result = null;
    } else {
        // Subscribe
        const newSubscription = await Subscription.create({
            subscriber: userId,
            channel: channelId,
        });

        if (!newSubscription) throw new ApiError(400, "Failed to subscribe to channel");

        result = await Subscription.findById(newSubscription._id)
            .populate("subscriber", "username avatar")
            .populate("channel", "username avatar");

        action = "Subscribed";
    }

    res.status(201).json(
        new ApiResponse(
            200,
            {
                action,
                subscription: result,
            },
            `Channel ${action} successfully`
        )
    );
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    log(req.params);
    const { channelId } = req.params
    const userId = req.user?._id;

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Valid channel ID is required");
    }

    // Find all subscriptions to this channel
    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar")

    if (!subscribers || subscribers.length === 0) {
        throw new ApiError(404, "No subscribers found for this channel");
    }

    const channel = await User.findById(channelId).select("username avatar");

    res.status(201).json(
        new ApiResponse(200, {
            channelInfo: channel,
            subscriberCount: subscribers.length,
            subscribers
        }, "Subscriber list fetched successfully")
    );

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    const userId = req.user?._id;

    if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Valid subscriber ID is required");
    }

    // Optional: Verify requesting user has permission
    // (if users should only see their own subscriptions)
    if (userId.toString() !== subscriberId) {
        throw new ApiError(403, "Unauthorized to view these subscriptions");
    }

    const subscription = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username avatar")

    if (!subscription || subscription.length === 0) {
        throw new ApiError(404, "No subscribed channels found");
    }

    // Get subscriber info
    const subscriber = await User.findById(subscriberId)
        .select("username avatar fullName");


    res.status(201).json(  // Changed from 201 (Created) to 200 (OK)
        new ApiResponse(200, {
            subscriberInfo: subscriber,
            subscribedChannelsCount: subscription.length,
            subscribedChannels: subscription.map(sub => sub.channel)  // Extract just channel info
        }, "Subscribed channels fetched successfully")
    );

})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}