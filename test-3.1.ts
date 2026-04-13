import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

async function testModel(modelName: string) {
    console.log(`Testing ${modelName}...`);
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent("Hallo! Translate to English.");
        console.log(`OK ${modelName}: `, res.response.text().substring(0, 30));
    } catch (err: any) {
        console.error(`FAIL ${modelName}: `, err.message);
    }
}

async function run() {
    if (!apiKey) return;
    await testModel("gemini-3.1-flash");
    await testModel("gemini-3.1-flash-lite");
    await testModel("gemini-3.1-pro");
}

run();
