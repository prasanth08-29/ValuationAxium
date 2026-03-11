const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dumped_templates_utf8.json', 'utf8'));

const jkBank = data.find(t => t.name.includes("JK Bank"));
if (jkBank) {
    console.log(`Template: ${jkBank.name}`);
    const headings = jkBank.fields.filter(f => f.type === 'heading' || (f.label && f.label.toUpperCase() === f.label && f.label.length > 5));
    headings.forEach((h, i) => {
        console.log(`${i+1}: ${h.label} (type: ${h.type})`);
    });
} else {
    console.log("JK Bank template not found in dump");
}
