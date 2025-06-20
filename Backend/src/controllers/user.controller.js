import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { log } from "console";
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/mail.js";




const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const getCookieOptions = () => {
    return {
        httpOnly: true,
        secure: true,       // Use `true` in production (HTTPS), can be false in dev
    };
};


/* steps for registerUser
        1. Get user details from frontend (name, email, password, etc.)
        2. Validation - Check for empty fields
        3. Check if user already exists in DB using email
        4. Check for uploaded avatar/image in request
        5. Upload avatar/image to Cloudinary and get the URL
        6. Create user object and save to database
        7. Remove sensitive fields (like password, refreshToken) from the response
        8. Check if user is successfully created
        9. Return a success response (optionally include token)
    */
const registerUser = asyncHandler(async (req, res) => {


    const { email, password, fullname, username } = req.body;

    //    log(req.body);

    // if (fullname.trim() === "") {  // is type se bhi check lga sakte ho 
    //     throw new ApiError(400, "fullname is required")
    // }

    if (
        [email, password, fullname, username].some(
            (field) => typeof field !== "string" || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    if (!email.includes("@")) {
        throw new ApiError(422, "Invalid email format");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    // log(existedUser)

    if (existedUser) {
        throw new ApiError(409, "User with username and email already exist.")
    }

    // log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;


    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // log("Avatar is :", avatar)


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // ✅ Send welcome email
    await sendMail({
        to: email,
        subject: `🎉 Welcome to ChaiTube, ${username}!`,
        html: `
      <h2>Hey ${username} 👋</h2>
      <p>Your account has been created successfully 🎉 on <strong>ChaiTube</strong>.</p>
      <p>Enjoy watching and uploading videos!</p>
    `,
    });

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully!")
    )


})


/*  steps for loginUser
       1. get user details from frontend
       2. validate input fields
       3. Find User in Database
       4. verify password
       5. generate tokens(access & refresh)
       6. store refresh tokens
       7. set cookies and send tokens
    */
const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (
        [username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }

    if (!email.includes("@")) {
        throw new ApiError(422, "invalid user credentials");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(409, "You want to register first")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = User.findById(user._id).select(
        "-password -refreshToken"
    )

    // const option = {
    //     httpOnly: true,
    //     secure: true
    // }

    res.status(200)
        .cookie("accessToken", accessToken, getCookieOptions())
        .cookie("refreshToken", refreshToken, getCookieOptions())
        .json(
            new ApiResponse(
                200,
                {
                    loggedInUser: {
                        _id: loggedInUser._id,
                        email: loggedInUser.email,
                        username: loggedInUser.username,
                        // Add only safe fields here
                    },
                    accessToken,
                    refreshToken
                },
                "User loggedIn successfully."
            )
        )

})


/* steps for logoutUser
        1. Get the refresh token or auth cookie from the request
        2. Validate if token/cookie exists
        3. Clear the cookie from the browser (if using cookies)
            -> res.clearCookie("token", cookieOptions)
        4. (Optional) Delete or invalidate the refresh token from the database
            -> Example: user.refreshToken = null; await user.save()
        5. Return a success response indicating logout was successful
    */
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,  // this removes the field from document
            }
        },
        {
            new: true
        }
    )



    res.status(200)
        .clearCookie("accessToken", getCookieOptions())
        .clearCookie("refreshToken", getCookieOptions()).json(
            new ApiResponse(200, {}, "User looged out")
        )

})


/* steps for refreshAccessToken
        1. Get the refresh token from cookies or request body/header
        2. Validate if refresh token exists
        3. Verify the refresh token using JWT and secret key
            -> jwt.verify(token, REFRESH_TOKEN_SECRET)
        4. Decode the token to get the user ID
        5. Check if the user exists in the database
        6. Compare the token with the one stored in DB (if storing refresh tokens)
        7. Generate a new access token using user ID and other details
        8. Send the new access token as a response or set it in a cookie
        9. Return success response with the new access token
*/
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // console.log(incomingRefreshToken);
    if (
        !incomingRefreshToken ||
        typeof incomingRefreshToken !== 'string' ||
        !incomingRefreshToken.includes('.')
    ) {
        throw new ApiError(400, "Refresh token is missing or malformed");
    }




    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        // console.log(decodedToken);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }


        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        const newRefreshToken = refreshToken;
        return res
            .status(200)
            .cookie("accessToken", accessToken, getCookieOptions())
            .cookie("refreshToken", newRefreshToken, getCookieOptions()).json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token refreshed"

                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

// const changeCurrentPassword = asyncHandler(async (req, res) => {
//     const { oldPassword, newPassword } = req.body;

//     const user = await User.findById(req.user?._id)

//     const correctPassword = await user.isPasswordCorrect(oldPassword);

//     if (!correctPassword) {
//         throw new ApiError(400, "Invalid old password");
//     }


//     user.password = newPassword;
//     await user.save({ validateBeforeSave: false });

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(200, {}, "Password changed Successfully")
//         )

// })


const requestPasswordChange = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch) throw new ApiError(400, "Invalid old password");

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // valid for 10 min

    // Temporarily store new password in memory (not in DB)
    req.session = req.session || {};
    req.session.pendingNewPassword = newPassword;
    req.session.otpUserId = user._id;

    await user.save();

    await sendMail({
        to: user.email,
        subject: "🔐 OTP for Password Change",
        html: `<p>Your OTP for changing password is: <strong>${otp}</strong></p>
           <p>This will expire in 10 minutes.</p>`,
    });

    res.status(200).json(
        new ApiResponse(200, {}, "OTP sent to email")
    );
});

const verifyPasswordOtp = asyncHandler(async (req, res) => {
    const { otp, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user || user.resetOtp !== Number(otp)) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (Date.now() > user.resetOtpExpires) {
        throw new ApiError(400, "OTP expired");
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;

    await user.save();

    await sendMail({
        to: user.email,
        subject: "✅ Password Changed Successfully",
        html: `
      <p>Hello ${user.username},</p>
      <p>Your password has been successfully updated.</p>
      <p>If this wasn't you, please contact support immediately.</p>
    `,
    });

    res.status(200).json(
        new ApiResponse(200, {}, "Password updated successfully")
    );
});




const getCurrentUser = asyncHandler(async (req, res) => {
    const currUser = await User.findById(req.user?._id);

    return res
        .status(200)
        .json(
            new ApiResponse(200, currUser, "Current user fetched successfully")
        )

})


const updateAccoundDetails = asyncHandler(async (req, res) => {
    const { fullname, username, email } = req.body;

    if (!(fullname || email || username)) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findById(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email,
                username,
            }
        },
        {
            new: true,
        }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Accound details update Successfully")
        )

})


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // TODO : delete oldImage - make a utility function.
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findById(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {
            new: true,
        }
    ).select("-password -refreshToken")


    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar update Successfully")
        )


})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findById(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url || "",
            }
        },
        {
            new: true,
        }
    ).select("-password -refreshToken")


    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "CoverImage update Successfully")
        )


})


// join user or subscription schema
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;  // url me se data lena 

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([    // pipline for find subscriber
        {
            $match: {
                username: username?.toLowerCase(),
            }
        },
        {
            $lookup: {     // user model ko subscription model ke sath join krega 
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {   // user ke andar ye do new fields aur add krdi hai.
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribeToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {  // conditioning krne ke liye use hot hai.
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    }
                }
            }
        },
        {
            $project: {    // seleceted/particular cheeze hi bejta hai.
                fullname: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribeToCount: 1,
                isSubscribed: 1,
                email: 1,
            }
        }
    ])
    // console.log(channel);

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "User Channel fetched successfully")
    )

})

// join user or video schema
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",  // field jis naam se user schema me store hai.
                foreignField: "_id",  // field jis naam se video schema me store hai,
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {   // array me se first field ka data lena.
                            owner: {
                                $first: "$owner",
                            }

                        }
                    }

                ]
            },

        },
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully")
        )
})

const searchUser = asyncHandler(async (req, res) => {
    const keyword = req.query.q?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!keyword) {
        throw new ApiError(400, "Search keyword is required");
    }

    const skip = (page - 1) * limit;

    const users = await User.find({
        $and: [
            {
                $or: [
                    { username: { $regex: keyword, $options: "i" } },
                    { fullname: { $regex: keyword, $options: "i" } }
                ]
            },
            { _id: { $ne: req.user._id } } // Exclude current user
        ]
    })
        .select("username fullname avatar") // Return only basic details
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments({
        $and: [
            {
                $or: [
                    { username: { $regex: keyword, $options: "i" } },
                    { fullname: { $regex: keyword, $options: "i" } }
                ]
            },
            { _id: { $ne: req.user._id } }
        ]
    });

    return res.status(200).json(
        new ApiResponse(200, {
            results: users,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }, "Users fetched successfully")
    );
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    // changeCurrentPassword,
    requestPasswordChange,
    verifyPasswordOtp,
    getCurrentUser,
    updateAccoundDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    searchUser,
} 