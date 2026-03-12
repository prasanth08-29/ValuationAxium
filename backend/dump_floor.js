require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
    const Document = mongoose.model('Template', new mongoose.Schema({
        name: String,
        fields: Array,
        entity: String
    }, { collection: 'templates' }));

    const templates = await Document.find({ "fields.label": /SELECT THE FLOORS REQUIRED/i });
    if(templates.length === 0) {
        console.log("Not found.");
        process.exit();
    }
    
    templates.forEach(t => {
        console.log("TEMPLATE: " + t.name);
        const floorFields = t.fields.filter(f => /Name of the Floor/i.test(f.label) || /Plinth Area/i.test(f.label));
        console.log("Found Floor fields count:", floorFields.length);
        floorFields.forEach(f => {
             console.log(`- Label: ${f.label}`);
             console.log(`  Conditions: ${JSON.stringify(f.conditions)}`);
        });
    });
    process.exit();
}
check();
