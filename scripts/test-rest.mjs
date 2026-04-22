const API_KEY = 'AIzaSyCuXbcaixBgUzc64JxwaaQ4QJ2KtEDGgEw';

async function test() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (e) {
        console.error(e);
    }
}
test();
