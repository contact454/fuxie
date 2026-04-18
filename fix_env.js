const fs = require('fs');
let s = fs.readFileSync('.env', 'utf8');
s = s.replace('GEMINI_API_KEY="AIzaSyBUS1j5ET5ZZFfY2UGfkU61hBGk17Hv7I8"', 'GEMINI_API_KEY="AIzaSyA2Y0TAHR0MJUKLlr4Zf-oGsAk0cg-2XVE"');
fs.writeFileSync('.env', s, 'utf8');
console.log('Done!');
