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
    if (content.includes('<a ') || content.includes('</a>')) {
      content = content.replace(/<a /g, '<Link ');
      content = content.replace(/<\/a>/g, '</Link>');
      if (!content.includes('next/link')) {
        content = `import Link from 'next/link';\n` + content;
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
