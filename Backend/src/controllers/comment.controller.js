import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const validatePagination = (query) => ({
    page: Math.max(1, parseInt(query.page, 10)) || 1,
    limit: Math.min(50, Math.max(1, parseInt(query.limit, 10))) || 10
});

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    // const { page = 1, limit = 10 } = req.query

    const { page, limit } = validatePagination(req.query);

    const owner = req.user._id;

    if (!videoId || !mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Video Id is required")


    const video = await Video.findById(videoId);

    if (!video) throw new ApiError(400, "video not found")

    // Removed owner filter to get all comments
    const comments = await Comment.find({ video: videoId, })
        .populate("owner", "username avatar")
        .skip((page - 1) * limit)
        .limit(limit);

    // console.log(comments);


    res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    )


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params;

    const owner = req.user._id

    if (!content || !content.trim() === "") throw new ApiError(400, "Content is required")
    if (!videoId || !mongoose.isValidObjectId(videoId)) throw new ApiError(400, "video Id is required")

    const video = await Video.findById(videoId)

    if (!video) throw new ApiError(400, "video not found")

    const comment = await Comment.create({
        content: content.trim().toLowerCase(),
        owner: owner,
        video: videoId
    })


    const addComment = await Comment.findById(comment._id)
        .populate("owner", "username avatar")
        .populate("video", "title duration thumbnail")


    res.status(201).json(
        new ApiResponse(200, addComment, "Comment Added successfully")
    )


})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    // TODO: update a comment

    const userId = req.user?._id;

    if (!commentId || !mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Valid comment ID is required");
    if (!content || content.trim() === "") throw new ApiError(400, "Content is required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found")

    // Verify the user owns the comment
    if (!comment.owner.equals(userId)) throw new ApiError(403, "Unauthorized to update this comment")


    comment.content = content.trim().toLowerCase();
    await comment.save({ validateBeforeSave: false })

    const updatedComment = await Comment.findById(comment._id)
        .populate("video", "title thumbnail duration")
        .populate("owner", "username avatar")

    res.status(201).json(
        new ApiResponse(200, updatedComment, "Update comment successfully")
    )



})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    // TODO: delete a comment

    const owner = req.user?._id;

    if (!commentId || !mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Valid comment Id is required")

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");


    // Check if the user is the owner (or admin, if applicable)
    if (!comment.owner.equals(owner)) throw new ApiError(403, "Unauthorized to delete this comment");


    await Comment.findByIdAndDelete(commentId)

    res.status(201).json(
        new ApiResponse(200, null, "Comment delete successfully")
    )

})

const addReplyToComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Check if parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
        throw new ApiError(404, "Parent comment not found");
    }

    // Create reply comment
    const reply = await Comment.create({
        content,
        owner: userId,
        video: parentComment.video,
        parentComment: commentId,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, reply, "Reply added successfully"));
});


const getRepliesOfComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const replies = await Comment.find({ parentComment: commentId })
        .populate("owner", "username avatar")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, replies, "Replies fetched successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
    addReplyToComment,
    getRepliesOfComment,
}