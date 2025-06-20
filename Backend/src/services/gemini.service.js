// services/gemini.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import VideoMetadata from "../models/videoMetadata.model.js";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateVideoMetadata = async (transcript) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-preview-05-20"
    });

    const prompts = {
        titles: `Give exactly 5 catchy and SEO-friendly YouTube video titles based on the following transcript. 
        Return only the titles, one per line, with no numbering, no markdown, and no explanations:\n\n${transcript}`,

        description: `Write a single, engaging, SEO-optimized YouTube video description for the following transcript.
        Keep it concise and clear (max 150 words). Avoid emojis, markdown formatting, hashtags, or multiple options.
        Return only the plain description:\n\n${transcript}`,

        tags: `Generate 10 SEO-optimized YouTube tags based on the following transcript. 
        Return them as a comma-separated list only:\n\n${transcript}`,

        summary: `Summarize the key points of the following video transcript in under 100 words.
        Use clear, neutral language and return only the summary text:\n\n${transcript}`,

        moderation: `Review the following transcript for any hate speech, adult content, or YouTube policy violations. 
        Respond with "Safe" if there's no violation. If unsafe, briefly list the issue:\n\n${transcript}`
    };


    const [titleRes, descRes, tagsRes, summaryRes, modRes] = await Promise.all([
        model.generateContent([prompts.titles]),
        model.generateContent([prompts.description]),
        model.generateContent([prompts.tags]),
        model.generateContent([prompts.summary]),
        model.generateContent([prompts.moderation])
    ]);

    const metadata = {
        titles: (await titleRes.response.text()).split("\n").filter(line => line.trim()),
        description: await descRes.response.text(),
        tags: (await tagsRes.response.text()).split(",").map(tag => tag.trim()),
        summary: await summaryRes.response.text(),
        moderation: await modRes.response.text(),
    };

    // Save to MongoDB
    await VideoMetadata.create(metadata);

    // RETURN PLAIN OBJECT — NO ApiResponse here
    return metadata;
};

export { generateVideoMetadata };
