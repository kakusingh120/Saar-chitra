import textToSpeech from "@google-cloud/text-to-speech";
import fs from "fs";
import util from "util";
import path from "path";

// Create client with your service account key
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: path.join(process.cwd(), "src/config/google-tts-key.json"),
});

const convertTextToSpeech = async (text, filename = "output.mp3") => {
    const request = {
        input: { text: text },
        voice: {
            languageCode: "en-US", // You can change to other languages if needed
            ssmlGender: "NEUTRAL", // Options: MALE | FEMALE | NEUTRAL
        },
        audioConfig: { audioEncoding: "MP3" },
    };

    const [response] = await client.synthesizeSpeech(request);

    const writeFile = util.promisify(fs.writeFile);
    const outputPath = path.join("outputs", filename);
    await writeFile(outputPath, response.audioContent, "binary");

    console.log(`✅ Audio content written to file: ${outputPath}`);
    return outputPath;
};


export { convertTextToSpeech }