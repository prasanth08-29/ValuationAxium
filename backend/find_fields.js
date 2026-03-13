const fs = require('fs');
let text = fs.readFileSync('dumped.json', 'utf16le');
if (text.includes('[dotenv@')) text = text.substring(text.indexOf('['));
if (!text.startsWith('[{')) text = text.replace(/^.*\[dotenv@.*?\][^\n]*\n/g, '');
text = text.trim();
if(text.startsWith('[dotenv')) text = text.substring(text.indexOf('[{'));
if(!text.startsWith('[')) text = text.substring(text.indexOf('['));

const data = JSON.parse(text);
const out = [];

data.forEach(t => {
   if (t.fields) {
       t.fields.forEach(f => {
           if (f.conditions && f.conditions.length > 0) {
               out.push({ template: t.name, field: f.label, conditions: f.conditions });
           } else if (f.dependsOn) {
               out.push({ template: t.name, field: f.label, dependsOn: f.dependsOn, dependsOnValue: f.dependsOnValue });
           }
       });
   }
});

fs.writeFileSync('outputUtf8.txt', JSON.stringify(out, null, 2), 'utf8');
