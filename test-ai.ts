import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

async function testGrammarModel() {
    console.log("Testing gemini-2.5-flash...");
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const res = await model.generateContent("Hallo! Translate to English.");
        console.log("OK: ", res.response.text().substring(0, 30));
    } catch (err: any) {
        console.error("FAIL: ", err.message);
    }
}

async function testSpeakingModel() {
    console.log("Testing gemini-2.5-pro (REST API)...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        console.log("OK: ", json.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 30));
    } catch (err: any) {
        console.error("FAIL: ", err.message);
    }
}

async function run() {
    if (!apiKey) {
        console.error("No API key found in process.env.GEMINI_API_KEY");
        return;
    }
    await testGrammarModel();
    await testSpeakingModel();
    console.log("Done");
}

run();
