require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
    const Template = mongoose.model('Template', new mongoose.Schema({}, { strict: false }));
    const templates = await Template.find({});
    
    templates.forEach(t => {
        console.log(`\n=== Template: ${t.name} ===`);
        t.fields.forEach(f => {
            if (f.label.toLowerCase().includes('floor') || f.conditions || f.dependsOn) {
                console.log(`Field: ${f.label} (${f.id})`);
                if (f.type) console.log(`  Type: ${f.type}`);
                if (f.conditions) console.log(`  Conditions: ${JSON.stringify(f.conditions)}`);
                if (f.dependsOn) console.log(`  DependsOn: ${f.dependsOn} = ${f.dependsOnValue}`);
                if (f.options) console.log(`  Options: ${JSON.stringify(f.options)}`);
            }
        });
    });
    process.exit();
}
check();
