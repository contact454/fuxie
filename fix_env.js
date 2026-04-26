const fs = require('fs');
let s = fs.readFileSync('.env', 'utf8');
s = s.replace('GEMINI_API_KEY=process.env.GEMINI_API_KEY ?? ''', 'GEMINI_API_KEY=process.env.GEMINI_API_KEY ?? ''');
fs.writeFileSync('.env', s, 'utf8');
console.log('Done!');
