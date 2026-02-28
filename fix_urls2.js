const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walkDir(srcDir);
let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix the double insertion mistake where:
    // `${import.meta.env.VITE_API_URL || "${import.meta.env.VITE_API_URL || "http://localhost:5000"}"}`
    // becomes:
    // `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*"\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*"http:\/\/localhost:5000"}"}/g, '${import.meta.env.VITE_API_URL || "http://localhost:5000"}');

    // And fix the ones inside backticks directly:
    // `${import.meta.env.VITE_API_URL || `...`}` maybe?
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*'\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*"http:\/\/localhost:5000"}'}/g, '${import.meta.env.VITE_API_URL || "http://localhost:5000"}');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log('Fixed ' + file);
    }
});
console.log(`Fixed ${changed} files.`);
