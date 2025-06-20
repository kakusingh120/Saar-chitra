import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            lowercase: true,
            maxLength: [100, "Max length should be 100"]
        },
        owner: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        }
    },
    { timestamps: true }
);



export const Tweet = mongoose.model("Tweet", tweetSchema);