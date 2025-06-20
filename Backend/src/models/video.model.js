import mongoose, { Schema } from "mongoose";
import moongoseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        videoFile: {
            type: String,   // cloudinary url
            required: true,
        },
        thumbnail: {
            type: String,   // cloudinary url
            required: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        duration: {
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
            required: true
        },
        // // for recommendation system
        // category: { type: String, required: true },
        // tags: [{ type: String }],
        // likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    }
    , { timestamps: true }
);

videoSchema.plugin(moongoseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);