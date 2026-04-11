const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/Users/DMF Schule/9-Fuxie/apps/web/src/app/teacher', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if 'use client' is present
    const useClientRegex = /^(?:import\s+.*?;\s*)?(?:'use client'|"use client");?/m;
    if (content.includes("'use client'") || content.includes('"use client"')) {
       // Remove all instances of use client
       content = content.replace(/'use client'|"use client"/g, '');
       // Also clean up empty lines if necessary
       content = "'use client'\n" + content.trimStart();
       fs.writeFileSync(filePath, content, 'utf8');
       console.log('Fixed use client in', filePath);
    }
  }
});
