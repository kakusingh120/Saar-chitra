import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            lowercase: true,
            trim: true,
            required: true,
        },
        video: {
            type: mongoose.Types.ObjectId,
            ref: "Video",
            required: true,
        },
        owner: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        parentComment: {
            type: mongoose.Types.ObjectId,
            ref: "Comment",
            default: null, // null means it's a top-level comment
        }
    },
    { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
