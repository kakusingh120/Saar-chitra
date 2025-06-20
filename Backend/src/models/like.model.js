import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        video: {
            type: mongoose.Types.ObjectId,
            ref: "Video",
           
        },
        likedBy: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        comment: {
            type: mongoose.Types.ObjectId,
            ref: "Comment",
           
        },
        tweet: {
            type: mongoose.Types.ObjectId,
            ref: "Tweet",
           
        }
    },
    { timestamps: true }
);


export const Like = mongoose.model("Like", likeSchema);