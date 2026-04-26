import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY ?? '';
const ai = new GoogleGenAI({ apiKey: apiKey });

async function main() {
    console.log("Listing models...");
    const models = await ai.models.list({});
    for await (const m of models) {
        console.log(m.name);
    }
}
main().catch(console.error);
