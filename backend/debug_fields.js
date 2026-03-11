require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

async function debugFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const templates = await Template.find({});
        templates.forEach(t => {
            const hasFloorSelection = t.fields.some(f => f.label === "1" || f.label === "2");
            if (hasFloorSelection) {
                console.log(`Potential Match in Template: ${t.name}`);
                const relevantFields = t.fields.filter(f => f.label === "1" || f.label === "2" || f.label === "3" || f.label === "4" || f.dependsOn);
                relevantFields.forEach(f => {
                    console.log(`  Label: ${f.label}, ID: ${f.id}, DependsOn: ${f.dependsOn}`);
                });
            }
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugFields();
