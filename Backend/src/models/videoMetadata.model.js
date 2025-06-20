// models/videoMetadata.model.js
import mongoose from "mongoose";

const VideoMetadataSchema = new mongoose.Schema({
    titles: [
        {
            type: String,
            required: true,
            lowercase: true   // ✅ Fix: should be `lowercase` not `toLowercase`
        }
    ],
    description: {
        type: String,
        required: true,
        lowercase: true     // ✅ Fix
    },
    tags: [
        {
            type: String,
            required: true
        }
    ],
    summary: {
        type: String,
        required: true
    },
    moderation: {
        type: String,
        required: true
    }
}, { timestamps: true }); // ✅ `createdAt` and `updatedAt` auto-managed

const VideoMetadata = mongoose.model("VideoMetadata", VideoMetadataSchema);

export default VideoMetadata;
