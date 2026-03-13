const currentValues = { "select_the_floors_required": ["1", "2"] };

const fs = require('fs');
let text = fs.readFileSync('dumped.json', 'utf16le');
if (text.includes('[dotenv@')) text = text.substring(text.indexOf('['));
if (!text.startsWith('[{')) text = text.replace(/^.*\[dotenv@.*?\][^\n]*\n/g, '');
text = text.trim();
if(text.startsWith('[dotenv')) text = text.substring(text.indexOf('[{'));
if(!text.startsWith('[')) text = text.substring(text.indexOf('['));

const data = JSON.parse(text);

data.forEach(t => {
   if (t.fields) {
       t.fields.forEach(f => {
           if (f.label && f.label.toLowerCase().includes('name of the floor')) {
               console.log("Template:", t.name, "- Field:", f.label, "- conditions:", JSON.stringify(f.conditions), "dependsOn:", f.dependsOn, "dependsOnValue", f.dependsOnValue);
           }
       });
   }
});

