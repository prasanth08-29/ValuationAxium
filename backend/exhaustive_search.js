const fs = require('fs');
let content = fs.readFileSync('dumped_templates_utf8.json', 'utf8');
const lines = content.split('\n');
const jsonOnly = lines.filter(l => !l.startsWith('[dotenv')).join('\n');
const data = JSON.parse(jsonOnly);

data.forEach(t => {
    console.log(`Template: ${t.name}`);
    t.fields.forEach((f, i) => {
        if (f.label && f.label.includes("FLOORS")) {
            console.log(`  MATCH: [${i}] label: ${f.label}, id: ${f.id}, type: ${f.type}`);
        }
        if (f.conditions && f.conditions.length > 0) {
            console.log(`  CONDITIONAL: [${i}] ${f.label} depends on ${f.conditions[0].fieldId}`);
        }
        if (f.dependsOn) {
            console.log(`  DEPENDS_ON: [${i}] ${f.label} depends on ${f.dependsOn}`);
        }
    });
});
