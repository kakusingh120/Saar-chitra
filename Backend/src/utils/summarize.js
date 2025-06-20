import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const summarize = async (transcript) => {
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: 'You are a YouTube video summarizer. Summarize transcripts into 3-4 bullet points.',
            },
            {
                role: 'user',
                content: transcript,
            },
        ],
    });

    return response.choices[0].message.content;
};

export default summarize;
