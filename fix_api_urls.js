const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function fixFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixFiles(fullPath);
            return;
        }
        if (!file.endsWith('.jsx') && !file.endsWith('.js')) return;

        let content = fs.readFileSync(fullPath, 'utf8');
        let original = content;

        content = content.replace(/import\.meta\.env\.VITE_API_URL\s*\|\|\s*["']http:\/\/(127\.0\.0\.1|localhost):5000["']/g, 'import.meta.env.VITE_API_URL || ""');
        content = content.replace(/console\.log\(`Attempting login at: \${apiUrl}`\);/g, '');

        if (content !== original) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Fixed: ${fullPath}`);
        }
    });
}

fixFiles(srcDir);
