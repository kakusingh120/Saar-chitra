import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: true,
            lowercase: true,
        },
        owner: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
        videos: [
            {
                type: mongoose.Types.ObjectId,
                ref: "Video",
                required: true,
            },
        ]
    },
    { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);