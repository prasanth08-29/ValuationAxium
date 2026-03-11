const fs = require('fs');
const content = fs.readFileSync('dumped_templates_utf8.json', 'utf8');
const lines = content.split('\n');
for (const line of lines) {
    if (line.includes("SELECT THE FLOORS")) {
        console.log("FOUND IT IN LINE: " + line);
    }
}
