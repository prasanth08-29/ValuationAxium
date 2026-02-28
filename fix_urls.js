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

    // First replace single-quoted exact strings to template literals
    content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, '`${import.meta.env.VITE_API_URL || "http://localhost:5000"}$1`');

    // Then replace any remaining http://localhost:5000 that are already inside template literals ` `
    // The previous replacement inserted "http://localhost:5000", but it's inside double quotes, so we shouldn't replace it if it's there.
    // To be safe, let's just use string replace on the remaining occurrences that don't match the new insertion

    content = content.replace(/`(.*?)http:\/\/localhost:5000(.*?)`/g, (_, before, after) => {
        return `\`${before}\${import.meta.env.VITE_API_URL || "http://localhost:5000"}${after}\``;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log('Updated ' + file);
    }
});
console.log(`Updated ${changed} files.`);
