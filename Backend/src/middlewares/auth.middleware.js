import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";



export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }


        // decodedToken me user ki details hogi 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log(decodedToken);
        

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )

        if (!user) {
            // disscus about frontend
            throw new ApiError(401, "Invalid Access Token")
        }

        // console.log(user);
        

        req.user = user;  // req me user ko add kiya hai. 
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }

})