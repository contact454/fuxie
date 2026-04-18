const { execSync } = require('child_process');
[3000, 3001].forEach(port => {
    try {
        const output = execSync('netstat -ano | findstr :' + port).toString();
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('LISTENING')) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0') {
                    console.log('Killing PID ' + pid + ' on port ' + port + '...');
                    try { execSync('taskkill /F /PID ' + pid); } catch(e) {}
                }
            }
        }
    } catch(e) {}
});
console.log('Ports cleared!');
