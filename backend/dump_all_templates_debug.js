require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');
const fs = require('fs');

async function dumpTemplates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const templates = await Template.find({}, { name: 1, entity: 1 });
        fs.writeFileSync('all_templates_debug.json', JSON.stringify(templates, null, 2));
        
        // Let's specifically look for the "SELECT THE FLOORS REQUIRED" text in any template
        const allT = await Template.find({});
        for (const t of allT) {
            let found = false;
            for (const f of t.fields) {
                if ((f.label || '').toUpperCase().includes("FLOOR")) {
                    console.log(`[${t.name}] Contains floor field: ${f.label}`);
                    found = true;
                }
                if (f.label === '1' || f.id === '1' || f.id === '2' || f.label === '2') {
                    console.log(`[${t.name}] Contains 1/2 field: ${f.label} (${f.id})`);
                }
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

dumpTemplates();
