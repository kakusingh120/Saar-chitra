import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist

    // input validation 
    if (!name?.trim()) throw new ApiError(400, "Name is required");
    if (!description?.trim()) throw new ApiError(400, "Description is required");

    const owner = req.user?._id;

    const playlist = await Playlist.create({
        name: name.toLowerCase().trim(),
        description: description.toLowerCase().trim(),
        owner,
        videos: [],
    })

    if (!playlist) throw new ApiError(500, "Failed to create playlist due to server error");

    const createdPlaylist = await Playlist.findById(playlist._id).populate("owner", "username avatar");

    if (!createdPlaylist) throw new ApiError(400, "Something went wrong while creating the playlist");

    res.status(201).json(
        new ApiResponse(200, createdPlaylist, "Playlist create successfully")
    )


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!userId || !mongoose.isValidObjectId(userId)) throw new ApiError(400, "User Id is required")

    const user = await User.findById(userId);

    if (!user) throw new ApiError(400, "Invalid user Id")

    const playlists = await Playlist.find({ owner: userId });

    // Check if playlists exist (note: this might not be necessary as empty array is valid)
    if (!playlists || playlists.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "User has no playlists")
        );
    }

    // Check authorization (optional - depends on your requirements)
    // If you want users to only see their own playlists:
    if (userId !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized: You can only view your own playlists");
    }

    res.status(201).json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    );



})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!playlistId || !mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "playlist Id is required")

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) throw new ApiError(400, "Playlist not found")

    res.status(201).json(
        new ApiResponse(200, playlist, "playlist fetched successfully")
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    const userId = req.user._id;

    if (!playlistId || !mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "playlist Id is required")
    if (!videoId || !mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Video Id is required")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(400, "Video not found")


    // Check if playlist exists and is owned by the user
    const playlist = await Playlist.findOne({
        _id: playlistId,
        owner: userId, // Ensure only the owner can modify
    });
    if (!playlist) throw new ApiError(404, "Playlist not found or unauthorized");



    // Check if video is already in the playlist (avoid duplicates)
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }



    playlist.videos.push(videoId);
    await playlist.save({ validateBeforeSave: false })


    // const playlistWithDetails = await Playlist.findById(playlistId).populate([
    //     {
    //         path: "owner",
    //         select: "username avatar"
    //     },
    //     {
    //         path: "videos",
    //         select: "title thumbnail duration"
    //     }
    // ]);

    const playlistWithDetails = await Playlist.findById(playlistId)
        .populate({
            path: "owner",
            select: "username avatar"
        })
        .populate({
            path: "videos",
            select: "title thumbnail duration"
        });

    // const user = await User.findById({ _id: playlist.owner })

    res.status(201).json(
        new ApiResponse(200, playlistWithDetails, "Video added in playlist successfully")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    const userId = req.user._id;

    if (!playlistId || !mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "playlist Id is required")
    if (!videoId || !mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Video Id is required")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(400, "Video not found")


    // Check if playlist exists and is owned by the user
    const playlist = await Playlist.findOne({
        _id: playlistId,
        owner: userId, // Ensure only the owner can modify
    });
    if (!playlist) throw new ApiError(404, "Playlist not found or unauthorized");



    // Check if video is already in the playlist (avoid duplicates)
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video not found in playlist");
    }

    playlist.videos.pull(videoId);
    await playlist.save({ validateBeforeSave: false });

    res.status(201).json(
        new ApiResponse(200, {}, "Video deleted in playlist successfully")
    )



})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    const userId = req.user._id;

    if (!playlistId || !mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "playlist Id is required")


    await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: userId, // Ensure only the owner can modify
    });

    res.status(201).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    const userId = req.user._id;

    if (!playlistId || !mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "playlist Id is required")
    if (!name || !name?.trim() === "") throw new ApiError(400, "name is required")
    if (!description || !description?.trim() === "") throw new ApiError(400, "description is required")


    // Check if playlist exists and is owned by the user
    const playlist = await Playlist.findOne({
        _id: playlistId,
        owner: userId, // Ensure only the owner can modify
    });
    if (!playlist) throw new ApiError(404, "Playlist not found or unauthorized");




    playlist.name = name.trim().toLowerCase();
    playlist.description = description.trim().toLowerCase();
    await playlist.save({ validateBeforeSave: false })


    const updatedPlaylist = await Playlist.findById(playlistId).populate([
        {
            path: "owner",
            select: "username avatar"
        },
        {
            path: "videos",
            select: "title thumbnail duration"
        }
    ]);


    res.status(201).json(
        new ApiResponse(200, updatedPlaylist, "Update playlist successfully")
    )


})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}