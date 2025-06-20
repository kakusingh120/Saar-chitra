import ffmpeg from 'fluent-ffmpeg';

const extractAudio = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .noVideo()
            .audioCodec('libmp3lame')
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });
};

export default extractAudio;
