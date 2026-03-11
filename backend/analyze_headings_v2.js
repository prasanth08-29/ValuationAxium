const fs = require('fs');
let content = fs.readFileSync('dumped_templates_utf8.json', 'utf8');
// Strip the DOTENV lines if they exist
content = content.replace(/^\[dotenv@.+?\r?\n/gm, '');
// Strip leading junk
const start = content.indexOf('[');
content = content.substring(start);

const data = JSON.parse(content);

const jkBank = data.find(t => t.name.includes("JK Bank"));
if (jkBank) {
    console.log(`Template: ${jkBank.name}`);
    const headings = jkBank.fields.map((f, i) => ({ ...f, index: i }))
        .filter(f => f.type === 'heading' || (f.label && f.label === f.label.toUpperCase() && f.label.trim().length > 5));
    
    headings.forEach((h, i) => {
        console.log(`${i+1}: ${h.label} (id: ${h.id}, type: ${h.type}, index: ${h.index})`);
    });
} else {
    console.log("JK Bank template not found in dump");
}
