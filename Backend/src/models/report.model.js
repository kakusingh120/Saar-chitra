import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        reportedType: {
            type: String,
            enum: ["video", "user", "comment"],
            required: true
        },
        reportedId: {   // jise humne report kiya hai uski id hogi
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        reason: {
            type: String,
            required: true
        },
    }, { timestamps: true });

export const Report = mongoose.model("Report", reportSchema);
