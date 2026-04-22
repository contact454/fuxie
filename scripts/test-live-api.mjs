import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });

const API_KEY = process.env.GEMINI_API_KEY;
const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

console.log('Connecting to', wsUrl.replace(API_KEY, 'REDACTED'));

const ws = new WebSocket(wsUrl);

ws.addEventListener('open', () => {
    console.log('Connected! Sending setup message...');
    ws.send(JSON.stringify({
        setup: {
            model: 'models/gemini-3.1-flash-live-preview',
            generationConfig: {
                responseModalities: ["AUDIO"]
            },
            systemInstruction: {
                parts: [{ text: 'Hello' }]
            }
        }
    }));
});

ws.addEventListener('message', (event) => {
    console.log('Received message:', event.data.toString().substring(0, 500));
});

ws.addEventListener('error', (event) => {
    console.error('WebSocket Error:', event.message || 'Unknown error');
});

ws.addEventListener('close', (event) => {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    process.exit(event.code === 1000 ? 0 : 1);
});

setTimeout(() => {
    console.log('Timeout reached. Closing.');
    ws.close();
}, 5000);
