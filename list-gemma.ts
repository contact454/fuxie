import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

async function run() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const names = data.models.map((m: any) => m.name);
        console.log("AVAILABLE MODELS:", names.filter((n: string) => n.includes("gemma")));
    } catch (e) {
        console.error(e);
    }
}
run();
