// models/watchlater.model.js
import mongoose, { Schema } from "mongoose";

const watchLaterSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true
        }
    },
    { timestamps: true }
);

watchLaterSchema.index({ user: 1, video: 1 }, { unique: true }); // prevent duplicate saves

export const WatchLater = mongoose.model("WatchLater", watchLaterSchema);
