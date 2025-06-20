import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();



const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            lowecase: true,
            unique: true,
            trim: true,
            index: true // you want to make this field is searcheable, so you can give index = true
        },
        email: {
            type: String,
            required: true,
            lowecase: true,
            unique: true,
            trim: true,
            minLength: [6, "Minimum length of email should be 6"],
            maxLength: [25, "Maximum length of email should be 25"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,  // Cloudinary url
            required: true,
        },
        coverImage: {
            type: String,   // Cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
                required: true
            }
        ],
        blockedUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        resetOtp: Number,
        resetOtpExpires: Date,

        // likedVideos: [   // for recommendation system
        //     {
        //         type: mongoose.Schema.Types.ObjectId,
        //         ref: "Video"
        //     }
        // ],
    },
    { timestamps: true }
);




userSchema.pre("save", async function (next) {
    // is Used for pre checking before save ya any action 
    if (!this.isModified("password")) return next();

    // Only hash the password if it has been modified
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(err); // Pass error to next middleware
    }
})

// user defined methods
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);  // ye true or false me retrun krta hai.
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {   // payload --> user ki details deni hoti hai.
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,   // secret
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY  // expires time
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

userSchema.index({ username: "text", fullname: "text" });


export const User = mongoose.model("User", userSchema);