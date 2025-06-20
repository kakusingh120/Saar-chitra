import { asyncHandler } from "../utils/asyncHandler.js";
import { Report } from "../models/report.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// error handle krna baaki hai and validations......
const reportContent = asyncHandler(async (req, res) => {
    console.log(req.params);
    console.log(req.body);
    const { reportedType, reason } = req.body;
    const { reportedId } = req.params;

    const report = await Report.create({
        reporter: req.user._id,
        reportedType,
        reportedId,
        reason,
    })

    const createReport = await Report.findById(report._id).populate("reporter", "username avatar").select("-__v -updatedAt")


    res.status(201).json(
        new ApiResponse(200, createReport, "Report submitted successfully")
    )
});

// error handle krna baaki hai and validations......
const blockUser = asyncHandler(async (req, res) => {
    const { blockedUserId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user.blockedUsers.includes(blockedUserId)) {
        user.blockedUsers.push(blockedUserId);
        await user.save({ validateBeforeSave: false });
    }

    res.status(201).json(
        new ApiResponse(200, {}, "User blocked successfully")
    );
});


// error handle krna baaki hai and validations......
const getBlockedUsers = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("blockedUsers", "username avatar");

    res.status(201).json(
        new ApiResponse(200, { blockedUsers: user.blockedUsers }, "all blocked user fetched successfully")
    )
});


export { reportContent, blockUser, getBlockedUsers }