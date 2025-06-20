import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from "fs/promises";
import dotenv from 'dotenv';
import path from "path";

dotenv.config();



// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


// log("CWD is:", process.cwd());


// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         // log(localFilePath)
//         if (!localFilePath) return null;
//         // Upload the file on cloudinary 
//         const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
//         // file has been uploaded successfully
//         console.log("File is uploaded on cloudinary", response.url);

//         // Delete the local temp file
//         fs.unlinkSync(localFilePath);

//         return response;
//     } catch (error) {
//         console.error("Cloudinary upload error:", error);

//         // Delete temp file even if upload fails
//         if (fs.existsSync(localFilePath)) {
//             fs.unlinkSync(localFilePath);    // Removed the locally saved temporary file as the upload operation got failed
//         }

//         return null;
//     }
// }


const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.warn("⚠️ No local file path provided");
      return null;
    }

    const absolutePath = path.resolve(localFilePath);

    // 📤 Upload to Cloudinary
    const response = await cloudinary.uploader.upload(absolutePath, {
      resource_type: "auto",
    });

    console.log("✅ File uploaded to Cloudinary:", response.secure_url);

    // 🗑️ Delete local file after successful upload
    try {
      await fs.unlink(absolutePath);
      console.log("🗑️ Local file deleted successfully:", absolutePath);
    } catch (unlinkErr) {
      console.warn("⚠️ Failed to delete local file:", unlinkErr.message);
    }

    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);

    // 🗑️ Attempt to delete local file even if upload fails
    try {
      const absolutePath = path.resolve(localFilePath);
      await fs.unlink(absolutePath);
      console.log("🗑️ Local file deleted after failed upload:", absolutePath);
    } catch (deleteErr) {
      console.warn("⚠️ Failed to delete local file after error:", deleteErr.message);
    }

    return null;
  }
};



/*
        * Deletes a video from Cloudinary
        * @param {string} publicId - The public_id of the video to delete
        * @param {object} [options] - Additional deletion options
        * @param {string} [options.resourceType='video'] - Resource type ('video' or 'image')
        * @param {string} [options.type='upload'] - Storage type ('upload', 'private', etc.)
        * @returns {Promise<object>} - Cloudinary deletion result
        * @throws {ApiError} - If deletion fails
    */

const deleteFromCloudinary = async (publicId, options = {}) => {
    if (!publicId) {
        throw new ApiError(400, 'publicId is required');
    }

    try {
        const deletionOptions = {
            resource_type: options.resourceType || 'auto', // Use 'auto' instead of hardcoding 'video'
            type: options.type || 'upload',
            invalidate: true
        };

        const result = await cloudinary.uploader.destroy(publicId, deletionOptions);

        console.log("🔁 Cloudinary delete result:", result);

        if (result.result !== 'ok' && result.result !== 'not found') {
            throw new ApiError(500, `Failed to delete from Cloudinary: ${result.result}`);
        }

        console.log("✅ Deleted from Cloudinary:", result);
        return result;

    } catch (error) {
        console.error("❌ Error deleting from Cloudinary:", error);
        throw new ApiError(
            500,
            error.message || 'Failed to delete from Cloudinary',
            error.stack
        );
    }
};



/* 
        Deletes multiple videos from Cloudinary
        * @param {string[]} publicIds - Array of public_ids to delete
        * @param {object} [options] - Additional deletion options
        * @returns {Promise<object[]>} - Array of deletion results
    */
const bulkDeleteFromCloudinary = async (publicIds, options = {}) => {
    if (!Array.isArray(publicIds)) {
        throw new ApiError(400, 'publicIds must be an array');
    }

    const results = await Promise.allSettled(
        publicIds.map(publicId =>
            deleteFromCloudinary(publicId, options)
        )
    );

    results.forEach((res, index) => {
        if (res.status === "rejected") {
            console.error(`❌ Failed to delete ${publicIds[index]}:`, res.reason);
        }
    });

    return results;
};




export { uploadOnCloudinary, deleteFromCloudinary, bulkDeleteFromCloudinary }
