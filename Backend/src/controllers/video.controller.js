import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary, bulkDeleteFromCloudinary } from "../utils/cloudinary.js"
import { log } from "console"



/* steps for get all videos
        1. Parse and validate input parameters
        2. Build Query Conditions:
            -> if video is published tb hi show hogi
        3. Build sort criteria
        4. Pagination and results formatting
        5. Return res
    */
   
// const getAllVideos = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//     //TODO: get all videos based on query, sort, pagination

//     // 1. Parse and validate input parameters
//     const pageNumber = parseInt(page);
//     const limitNumber = parseInt(limit);

//     if (isNaN(pageNumber) || pageNumber < 1) {
//         throw new ApiError(400, "Page must be a positive number");
//     }

//     if (isNaN(limitNumber) || limitNumber < 1) {
//         throw new ApiError(400, "Limit must be a positive number");
//     }


//     // Validate userId if provided (should be a valid ObjectId)
//     if (userId) {
//         if (!mongoose.isValidObjectId(userId)) {
//             throw new ApiError(400, "Invalid userId format");
//         }
//     }





//     // 2. Build Query Conditions:

//     const pipeline = [];
//     const matchConditions = { isPublished: true };

//     if (!query) {
//         throw new ApiError(400, "Query is required")
//     }

//     matchConditions.$or = [
//         {
//             title: {
//                 $regex: query,   // kisi bhi video ka title is query se match krta hai? 
//                 $options: 'i'    // case insenstive => mtlb chahe capital ho ys small...
//             }
//         },
//         {
//             description: {
//                 $regex: query,   // kisi bhi video ka discription is query se match krta hai? 
//                 $options: 'i'
//             }
//         }
//     ];

//     if (userId) {
//         if (!mongoose.isValidObjectId(userId)) {
//             throw new ApiError(400, "Invalid user ID");
//         }
//         matchConditions.owner = new mongoose.Types.ObjectId(userId);
//     }

//     pipeline.push({ $match: matchConditions });





//     // 3. Build sort criteria
//     const sortDirection = sortType?.toLowerCase() === 'asc' ? 1 : -1;
//     const sortField = sortBy || 'createdAt'; // Default to 'createdAt' if not specified

//     pipeline.push({
//         $sort: {
//             [sortField]: sortDirection
//         }
//     });






//     // 4. Pagination and results formatting
//     const skip = (pageNumber - 1) * limitNumber;
//     const projectFields = {
//         title: 1,
//         description: 1,
//         thumbnail: 1,
//         duration: 1,
//         views: 1,
//         owner: 1,
//         createdAt: 1
//         // Add other fields as needed
//     };

//     const allVideos = await Video.aggregate([...pipeline,
//     {
//         $facet: {
//             videos: [
//                 { $skip: skip },
//                 { $limit: limitNumber },
//                 { $project: projectFields }
//             ],
//             totalCount: [
//                 { $count: 'count' }
//             ]
//         }
//     }
//     ]);

//     const videos = allVideos[0].videos;
//     const totalCount = allVideos[0].totalCount[0]?.count || 0;



//     // 5. Return res
//     return res.status(200).json(
//         new ApiResponse(200, {
//             videos,
//             currentPage: pageNumber,
//             totalPages: Math.ceil(totalCount / limitNumber),
//             totalVideos: totalCount
//         })
//     );


// })

const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

        // 1. Validate and parse input parameters
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        if (isNaN(pageNumber)) throw new ApiError(400, "Page must be a number");
        if (pageNumber < 1) throw new ApiError(400, "Page must be at least 1");
        if (isNaN(limitNumber)) throw new ApiError(400, "Limit must be a number");
        if (limitNumber < 1) throw new ApiError(400, "Limit must be at least 1");
        if (!query) throw new ApiError(400, "Search query is required");
        if (userId && !mongoose.isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID format");
        }


        // 2. Build the aggregation pipeline
        const pipeline = [];

        // Match stage
        const matchConditions = {
            isPublished: true,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        };

        if (userId) {
            matchConditions.owner = new mongoose.Types.ObjectId(userId);
        }
        pipeline.push({ $match: matchConditions });

        // Sort stage
        const sortDirection = sortType?.toLowerCase() === 'asc' ? 1 : -1;
        pipeline.push({
            $sort: {
                [sortBy || 'createdAt']: sortDirection
            }
        });

        // Pagination stage
        const skip = (pageNumber - 1) * limitNumber;
        const projection = {
            title: 1,
            description: 1,
            thumbnail: 1,
            duration: 1,
            views: 1,
            owner: 1,
            createdAt: 1
        };

        const result = await Video.aggregate([...pipeline,
        {
            $facet: {
                videos: [
                    { $skip: skip },
                    { $limit: limitNumber },
                    { $project: projection }
                ],
                totalCount: [{ $count: 'count' }]
            }
        }
        ]);

        const videos = result[0].videos || [];
        const totalCount = result[0].totalCount[0]?.count || 0;

        // 3. Return response
        return res.status(200).json(
            new ApiResponse(200, {
                videos,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalVideos: totalCount
            })
        );

    } catch (error) {
        // Handle specific MongoDB errors
        if (error instanceof mongoose.Error.CastError) {
            throw new ApiError(400, "Invalid data format");
        }

        // Re-throw ApiError instances
        if (error instanceof ApiError) {
            throw error;
        }

        // Handle unexpected errors
        throw new ApiError(500, `Failed to fetch videos: ${error.message}`);
    }

});


/*  steps to publish a videos
        1: Validate Inputs
        2: Handle Video File
        3: Upload to Cloudinary
        4: Generate Thumbnail (Optional)
        5: Save Video to Database
        6: Send Response
    */

// ye controller update krna hai, (category, tag) => feature
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished, duration } = req.body
    // TODO: get video, upload to cloudinary, create video

    const userId = req.user?._id;

    // input fields validation
    if (!title?.trim() === "") throw new ApiError(400, "Title field is required")
    if (!description?.trim() === "") throw new ApiError(400, "Video field is required")
    if (isNaN(Number(duration))) throw new ApiError(400, "Duration must be a number");


    // local path
    const videoLocalPath = req.files?.videoFile[0]?.path;
    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    }

    if (!videoLocalPath) throw new ApiError(400, "Video local path is required")
    if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail local path is required")



    // cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400, "Video cloudinary Url is required")
    }

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail cloudinary Url is required")
    }


    const video = await Video.create({
        title,
        description: description.toLowerCase(),
        videoFile: videoFile.url,
        thumbnail: thumbnail?.url || "",
        duration: duration,
        isPublished: isPublished,
        owner: userId // ✅ Add this line
    })

    const createVideo = await Video.findById(video._id).populate('owner', 'username avatar');

    if (!createVideo) {
        throw new ApiError(500, "Something went wrong while uploading the video")
    }


    return res.status(201).json(
        new ApiResponse(200, createVideo, "video Uploaded successfully!")
    )


})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    // Validate videoId
    if (!videoId) {
        throw new ApiError(400, "videoId is required");
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId format - must be 24-character hex string");
    }

    const videoExist = await Video.findById(videoId)
        .select("-updatedAt -__v")
        .populate('owner', 'username avatar'); // Optional: populate owner details

    if (!videoExist) {
        throw new ApiError(404, "Video not found");
    }

    // Check if video is published (if your app has private videos)
    if (!videoExist.isPublished) {
        throw new ApiError(403, "This video is not publicly available");
    }

    res.status(201).json(
        new ApiResponse(200, videoExist, "Video fetched successfully")
    )



})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if (!videoId) throw new ApiError(400, "Video id is required")
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId format - must be 24-character hex string")

    const videoExist = await Video.findById(videoId)
        .select("-updatedAt -__v")
        .populate('owner', 'username avatar');

    if (!videoExist) {
        throw new ApiError(404, "Video not found");
    }

    // Check if video is published (if your app has private videos)
    if (!videoExist.isPublished) {
        throw new ApiError(403, "This video is not publicly available");
    }

    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail local path is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail cloudinary Url is required")
    }


    videoExist.title = title;
    videoExist.description = description;
    videoExist.thumbnail = thumbnail?.url || "";
    await videoExist.save({ validateBeforeSave: false })

    res.status(201).json(
        new ApiResponse(200, videoExist, "Video Updated successfully")
    )


})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) throw new ApiError(400, "Video id is required");
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId format - must be 24-character hex string");

    const videoExist = await Video.findById(videoId).select("-updatedAt -__v");

    if (!videoExist) {
        throw new ApiError(404, "Video not found");
    }

    if (!videoExist.isPublished) {
        throw new ApiError(403, "This video is not publicly available");
    }

    // ✅ Delete video & thumbnail from Cloudinary
    try {
        if (videoExist.videoFile?.publicId) {
            await deleteFromCloudinary(videoExist.videoFile.publicId, { resourceType: 'video' }); // Or use 'auto'
        }

        if (videoExist.thumbnail?.publicId) {
            await deleteFromCloudinary(videoExist.thumbnail.publicId, { resourceType: 'image' }); // Or use 'auto'
        }
    } catch (error) {
        console.error("❌ Cloudinary deletion error:", error);
        throw new ApiError(500, "Failed to delete media files from Cloudinary");
    }

    // ✅ Delete from database
    await Video.findByIdAndDelete(videoId);

    // ✅ Return response
    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    );
});


// handle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // 1. Validate videoId
    if (!videoId) throw new ApiError(400, "Invalid Video Id");
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId format - must be 24-character hex string");

    // 2. Check if video exists
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    // 3. Toggle publish status
    video.isPublished = !video.isPublished;

    // 4. Save without validation (optimized for single field update)
    const updatedVideo = await video.save({ validateBeforeSave: false });

    // 5. Send response
    res.status(200).json(
        new ApiResponse(200, { isPublished: updatedVideo.isPublished }, "Publish status updated successfully")
    );


})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}