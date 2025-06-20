// ai.controller.js
import { generateVideoMetadata } from "../services/gemini.service.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { convertTextToSpeech } from "../services/tts.service.js";



const processVideoAI = asyncHandler(async (req, res) => {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
        throw new ApiError(400, null, "Transcript is required and must be a non-empty string.");
    }

    const metadata = await generateVideoMetadata(transcript);

    if (!metadata) {
        throw new ApiError(500, null, "Failed to generate video metadata.");
    }

    return res.status(200).json(
        new ApiResponse(200, metadata, "Video metadata generated successfully")
    );
});



const generateTTS = asyncHandler(async (req, res) => {
    const { text } = req.body || {}; // prevent destructure error

    if (!text) {
        throw new ApiError(400, "Text is required for TTS conversion");
    }

    const filePath = await convertTextToSpeech(text, "speech.mp3");

    res.status(200).json(
        new ApiResponse(200, { filePath }, "Text converted to speech successfully")
    );
});



export { processVideoAI, generateTTS };
