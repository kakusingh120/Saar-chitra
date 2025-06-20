import path from 'path';
import fs from 'fs';
import extractAudio from '../utils/extractAudio.js';
import transcribe from '../utils/transcribe.js';
import summarize from '../utils/summarize.js';
import { ApiResponse } from "../utils/ApiResponse.js"

export const summarizeVideo = async (req, res) => {
    try {
        const videoPath = req.file.path; // multer will give correct path
        const tempDir = path.join(path.resolve(), 'public', 'temp');

        // Output audio path (.mp3 file in same temp folder)
        const audioFilename = `${req.file.filename}.mp3`;
        const audioPath = path.join(tempDir, audioFilename);

        console.log('📂 Video path:', videoPath);
        console.log('🎧 Audio path:', audioPath);

        await extractAudio(videoPath, audioPath);

        const transcript = await transcribe(audioPath);
        const summary = await summarize(transcript);

        // Clean up temp files
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);

        res.status(200).json({ summary });
        res.status(201).json(
            new ApiResponse()
        )
    } catch (error) {
        console.error('❌ Error summarizing video:', error);
        res.status(500).json({ error: 'Failed to summarize video' });
    }
};
